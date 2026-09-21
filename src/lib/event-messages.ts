import { query, withClient } from "@/lib/db";
import { sendEventUpdateEmail } from "@/lib/email";
import {
  EventMessageError,
  validGuestEmail,
  type EventMessage,
  type EventMessageDelivery,
} from "@/lib/event-message-types";

let ready: Promise<void> | undefined;
export function ensureEventMessages() {
  ready ??= withClient(async (client) => {
    // Idempotent bootstrap, matching prisma/manual_sql/20260921_event_messages.sql.
    // Commit table creation and access protection together, never exposing guest data.
    await client.query("BEGIN");
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS public.event_messages (
      id uuid PRIMARY KEY, event_id uuid NOT NULL REFERENCES public.event_history(id) ON DELETE CASCADE,
      subject text NOT NULL, body text NOT NULL,
      status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued')),
      created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz)`);
      await client.query(
        `CREATE INDEX IF NOT EXISTS event_messages_event_created ON public.event_messages(event_id, created_at DESC)`,
      );
      await client.query(`CREATE TABLE IF NOT EXISTS public.event_message_deliveries (
      message_id uuid NOT NULL REFERENCES public.event_messages(id) ON DELETE CASCADE,
      email text NOT NULL, name text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
      updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (message_id, email))`);
      // Server-only tables: no client policies. Owner authorization lives in the API.
      await client.query("ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY");
      await client.query("ALTER TABLE public.event_message_deliveries ENABLE ROW LEVEL SECURITY");
      await client.query(
        "REVOKE ALL ON TABLE public.event_messages, public.event_message_deliveries FROM PUBLIC",
      );
      await client.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE public.event_messages, public.event_message_deliveries FROM anon;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE public.event_messages, public.event_message_deliveries FROM authenticated;
      END IF;
    END $$`);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }).catch((error) => {
    ready = undefined;
    throw error;
  });
  return ready;
}

// Choose the latest answer BEFORE filtering: a later No overrides an older Yes.
export const CURRENT_GUESTS_SQL = `SELECT DISTINCT ON (lower(trim(email)))
  lower(trim(email)) AS email, coalesce(name, '') AS name, response
  FROM rsvp_responses WHERE event_id = $1 AND email IS NOT NULL
  ORDER BY lower(trim(email)), coalesce(updated_at, created_at) DESC NULLS LAST, id DESC`;

export async function currentMessageAudience(eventId: string) {
  const result = await query<{ email: string; name: string; response: string }>(
    CURRENT_GUESTS_SQL,
    [eventId],
  );
  return result.rows.filter(
    (row) => (row.response === "yes" || row.response === "maybe") && validGuestEmail(row.email),
  );
}

export async function listEventMessages(eventId: string): Promise<EventMessage[]> {
  const result = await query<EventMessage>(
    `SELECT m.id, m.subject, m.body, m.status,
    m.created_at AS "createdAt", m.sent_at AS "sentAt",
    coalesce((SELECT jsonb_agg(jsonb_build_object('email', d.email, 'name', d.name,
      'status', d.status, 'updatedAt', d.updated_at) ORDER BY d.email)
      FROM event_message_deliveries d WHERE d.message_id = m.id), '[]'::jsonb) AS deliveries
    FROM event_messages m WHERE m.event_id = $1 ORDER BY m.created_at DESC`,
    [eventId],
  );
  return result.rows;
}

export async function saveEventMessage(
  eventId: string,
  input: { id: string; subject: string; body: string },
  send: boolean,
) {
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(
        `INSERT INTO event_messages (id, event_id, subject, body)
        VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [input.id, eventId, input.subject, input.body],
      );
      const existing = await client.query<{ status: string }>(
        `SELECT status FROM event_messages WHERE id = $1 AND event_id = $2 FOR UPDATE`,
        [input.id, eventId],
      );
      if (!existing.rows[0]) throw new EventMessageError("Message not found.");
      // Replayed Send requests never reset deliveries or overwrite an announcement.
      if (existing.rows[0].status === "draft") {
        await client.query(
          `UPDATE event_messages SET subject = $3, body = $4 WHERE id = $1 AND event_id = $2`,
          [input.id, eventId, input.subject, input.body],
        );
        if (send) {
          const result = await client.query<{ email: string; name: string; response: string }>(
            CURRENT_GUESTS_SQL,
            [eventId],
          );
          const guests = result.rows.filter(
            (row) =>
              (row.response === "yes" || row.response === "maybe") && validGuestEmail(row.email),
          );
          if (!guests.length)
            throw new EventMessageError("There are no Yes or Maybe guests with an email address.");
          await client.query(
            `INSERT INTO event_message_deliveries (message_id, email, name)
            SELECT $1, email, name FROM jsonb_to_recordset($2::jsonb) AS guests(email text, name text)`,
            [input.id, JSON.stringify(guests)],
          );
          await client.query(
            `UPDATE event_messages SET status = 'queued', sent_at = now() WHERE id = $1`,
            [input.id],
          );
        }
      } else if (!send) {
        throw new EventMessageError("A sent message cannot be edited. Write a new update instead.");
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function retryEventMessage(eventId: string, messageId: string) {
  // Only explicit retries reset known failures. Never resend accepted or uncertain sends.
  await query(
    `UPDATE event_message_deliveries d SET status = 'pending', updated_at = now()
    FROM event_messages m WHERE d.message_id = m.id AND m.event_id = $1 AND m.id = $2 AND d.status = 'failed'`,
    [eventId, messageId],
  );
}

function uncertainSmtpResult(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const failure = error as { code?: unknown; command?: unknown; responseCode?: unknown };
  // A SMTP rejection is definitive; a lost connection while submitting DATA is not.
  if (typeof failure.responseCode === "number" && failure.responseCode >= 400) return false;
  const command = typeof failure.command === "string" ? failure.command.toUpperCase() : "";
  if (/^(CONN|EHLO|HELO|AUTH|STARTTLS|MAIL|RCPT)\b/.test(command)) return false;
  return (
    command === "DATA" ||
    ["ETIMEDOUT", "ECONNRESET", "EPIPE", "ECONNECTION", "ESOCKET"].includes(String(failure.code))
  );
}

export async function processEventMessage(input: {
  eventId: string;
  messageId: string;
  eventTitle: string;
  eventUrl: string;
  replyTo: string | null;
}) {
  const message = (
    await query<{ subject: string; body: string }>(
      `SELECT subject, body FROM event_messages WHERE id = $1 AND event_id = $2 AND status = 'queued'`,
      [input.messageId, input.eventId],
    )
  ).rows[0];
  if (!message) throw new EventMessageError("Message not found.");
  // Small batches fit request limits; atomic claims prevent double-clicks/tabs sending twice.
  const claimed = await query<EventMessageDelivery>(
    `UPDATE event_message_deliveries SET status = 'sending', updated_at = now()
    WHERE (message_id, email) IN (SELECT message_id, email FROM event_message_deliveries
      WHERE message_id = $1 AND status = 'pending' ORDER BY email LIMIT 3 FOR UPDATE SKIP LOCKED)
    RETURNING email, name`,
    [input.messageId],
  );
  await Promise.all(
    claimed.rows.map(async (guest) => {
      let status: EventMessageDelivery["status"] = "skipped";
      let mailAttempted = false;
      try {
        // Recheck immediately before sending, including on a resumed or retried announcement.
        const current = (
          await query<{ response: string }>(
            `SELECT response FROM rsvp_responses
        WHERE event_id = $1 AND lower(trim(email)) = $2
        ORDER BY coalesce(updated_at, created_at) DESC NULLS LAST, id DESC LIMIT 1`,
            [input.eventId, guest.email],
          )
        ).rows[0];
        if (current?.response === "yes" || current?.response === "maybe") {
          mailAttempted = true;
          await sendEventUpdateEmail({
            ...message,
            toEmail: guest.email,
            eventTitle: input.eventTitle,
            eventUrl: input.eventUrl,
            replyTo: input.replyTo,
          });
          status = "sent";
        }
      } catch (error) {
        status = mailAttempted && uncertainSmtpResult(error) ? "sending" : "failed";
      }
      // A crash after SMTP acceptance leaves 'sending' rather than automatically sending twice.
      await query(
        `UPDATE event_message_deliveries SET status = $3, updated_at = now()
      WHERE message_id = $1 AND email = $2`,
        [input.messageId, guest.email, status],
      );
    }),
  );
}

import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import {
  type EventHistoryRow,
  getEventHistoryById,
  mutateSignupEvent,
  query,
  withClient,
} from "@/lib/db";
import { sendSignupHostAlertEmail } from "@/lib/email";
import { ensureEventCollaboration, getEventPermissions } from "@/lib/event-collaboration";
import { isEventDraft } from "@/lib/event-draft-access";
import {
  defaultSignupHostPreferences,
  type SignupHostActivity,
  type SignupHostAlertPreferences,
  signupHostActivities,
  uncertainSignupSmtpResult,
  wantsSignupHostAlert,
} from "@/lib/signup-host-activity";
import { signupEmailEventUrl } from "@/lib/signup-management";
import { SignupMutationError } from "@/lib/signup-mutations";
import type { SignupForm } from "@/types/signup";

export const SIGNUP_HOST_ALERT_SCHEMA = `
CREATE TABLE IF NOT EXISTS public.signup_host_alert_preferences (
  event_id uuid NOT NULL REFERENCES public.event_history(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  new_signups boolean NOT NULL, changes boolean NOT NULL, cancellations boolean NOT NULL, waitlist boolean NOT NULL,
  PRIMARY KEY(event_id,user_id));
CREATE TABLE IF NOT EXISTS public.signup_host_alerts (
  id uuid PRIMARY KEY, event_id uuid NOT NULL REFERENCES public.event_history(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  change_id uuid NOT NULL, activity jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','accepted','failed','unknown','skipped')),
  attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(change_id,recipient_id));
CREATE INDEX IF NOT EXISTS signup_host_alerts_due ON public.signup_host_alerts(next_attempt_at) WHERE status='pending';
CREATE INDEX IF NOT EXISTS signup_host_alerts_recipient ON public.signup_host_alerts(event_id,recipient_id,created_at DESC);
ALTER TABLE public.signup_host_alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_host_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.signup_host_alert_preferences, public.signup_host_alerts FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON TABLE public.signup_host_alert_preferences, public.signup_host_alerts FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON TABLE public.signup_host_alert_preferences, public.signup_host_alerts FROM authenticated;
  END IF;
END $$;`;

let ready: Promise<void> | undefined;
export function ensureSignupHostAlerts(): Promise<void> {
  ready ||= withClient(async (client) => {
    const installed = await client.query<{ ready: boolean }>(`
      SELECT count(*)=2 AND bool_and(c.relrowsecurity AND NOT EXISTS (
        SELECT 1 FROM aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) grants
        LEFT JOIN pg_roles r ON r.oid=grants.grantee
        WHERE grants.grantee=0 OR r.rolname IN ('anon','authenticated')))
        AND to_regclass('public.signup_host_alerts_due') IS NOT NULL
        AND to_regclass('public.signup_host_alerts_recipient') IS NOT NULL AS ready
      FROM pg_class c WHERE c.oid IN (to_regclass('public.signup_host_alert_preferences'),to_regclass('public.signup_host_alerts'))`);
    if (installed.rows[0]?.ready) return;
    await client.query("BEGIN");
    try {
      await client.query(SIGNUP_HOST_ALERT_SCHEMA);
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

type Recipient = SignupHostAlertPreferences & { id: string };

/** Called inside the same event lock and database transaction as the reservation. */
export async function enqueueSignupHostAlerts(
  client: PoolClient,
  row: EventHistoryRow,
  before: SignupForm,
  after: SignupForm,
): Promise<void> {
  const activities = signupHostActivities(before, after);
  if (!activities.length) return;
  const recipients = await client.query<Recipient>(
    `
    SELECT u.id, coalesce(p.new_signups,u.id=$2) AS "newSignups",
      coalesce(p.changes,u.id=$2) AS changes, coalesce(p.cancellations,u.id=$2) AS cancellations,
      coalesce(p.waitlist,u.id=$2) AS waitlist
    FROM users u LEFT JOIN signup_host_alert_preferences p ON p.event_id=$1 AND p.user_id=u.id
    WHERE u.id=$2 OR EXISTS(SELECT 1 FROM event_collaborators c WHERE c.event_id=$1 AND c.user_id=u.id AND c.revoked_at IS NULL)`,
    [row.id, row.user_id],
  );
  for (const activity of activities) {
    const changeId = randomUUID();
    for (const recipient of recipients.rows) {
      if (!wantsSignupHostAlert(recipient, activity.kind)) continue;
      await client.query(
        `INSERT INTO signup_host_alerts(id,event_id,recipient_id,change_id,activity)
        VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT(change_id,recipient_id) DO NOTHING`,
        [randomUUID(), row.id, recipient.id, changeId, JSON.stringify(activity)],
      );
    }
  }
}

export async function signupHostAlertSettings(row: EventHistoryRow, userId: string) {
  await ensureSignupHostAlerts();
  const result = await query<SignupHostAlertPreferences & { email: string | null }>(
    `
    SELECT u.email, coalesce(p.new_signups,u.id=$2) AS "newSignups",
      coalesce(p.changes,u.id=$2) AS changes, coalesce(p.cancellations,u.id=$2) AS cancellations,
      coalesce(p.waitlist,u.id=$2) AS waitlist
    FROM users u LEFT JOIN signup_host_alert_preferences p ON p.event_id=$1 AND p.user_id=u.id WHERE u.id=$3`,
    [row.id, row.user_id, userId],
  );
  const { email, ...preferences } = result.rows[0] || {
    email: null,
    ...defaultSignupHostPreferences(row.user_id === userId),
  };
  const deliveries = await query<{
    id: string;
    kind: string;
    name: string;
    status: string;
    createdAt: string;
  }>(
    `
    SELECT id,activity->>'kind' AS kind,activity->>'name' AS name,status,created_at AS "createdAt"
    FROM signup_host_alerts WHERE event_id=$1 AND recipient_id=$2 ORDER BY created_at DESC,id DESC LIMIT 10`,
    [row.id, userId],
  );
  return { email, preferences, deliveries: deliveries.rows };
}

export async function saveSignupHostAlertPreferences(
  eventId: string,
  userId: string,
  preferences: SignupHostAlertPreferences,
) {
  await ensureSignupHostAlerts();
  await ensureEventCollaboration();
  const saved = await mutateSignupEvent(eventId, async (row, client) => {
    if (
      !(await getEventPermissions(row, userId, client)).canManageResponses ||
      !row.data?.signupForm
    )
      throw new SignupMutationError("You no longer have access to manage this signup form.", 403);
    await client.query(
      `INSERT INTO signup_host_alert_preferences(event_id,user_id,new_signups,changes,cancellations,waitlist)
      VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(event_id,user_id) DO UPDATE SET
      new_signups=excluded.new_signups,changes=excluded.changes,cancellations=excluded.cancellations,waitlist=excluded.waitlist`,
      [
        eventId,
        userId,
        preferences.newSignups,
        preferences.changes,
        preferences.cancellations,
        preferences.waitlist,
      ],
    );
    return { data: row.data, result: true };
  });
  if (!saved) throw new SignupMutationError("Signup form not found.", 404);
  return signupHostAlertSettings(saved.row, userId);
}

type AlertJob = {
  id: string;
  event_id: string;
  recipient_id: string;
  activity: SignupHostActivity;
  attempts: number;
};

/** Claim one at a time; accepted and uncertain submissions never enter automatic retries. */
export async function processSignupHostAlerts(input: { eventId?: string; limit?: number } = {}) {
  await ensureSignupHostAlerts();
  await ensureEventCollaboration();
  const started = Date.now();
  const counts = { accepted: 0, failed: 0, skipped: 0, unknown: 0 };
  await query(
    `UPDATE signup_host_alerts SET status='unknown',updated_at=now()
    WHERE status='sending' AND updated_at < now()-interval '5 minutes' AND ($1::uuid IS NULL OR event_id=$1)`,
    [input.eventId || null],
  );
  for (
    let index = 0;
    index < Math.min(input.limit || 25, 50) && Date.now() - started < 25_000;
    index++
  ) {
    const result = await query<AlertJob>(
      `UPDATE signup_host_alerts SET status='sending',attempts=attempts+1,updated_at=now()
      WHERE id=(SELECT id FROM signup_host_alerts WHERE status='pending' AND next_attempt_at<=now()
        AND ($1::uuid IS NULL OR event_id=$1) ORDER BY next_attempt_at,created_at FOR UPDATE SKIP LOCKED LIMIT 1)
      RETURNING id,event_id,recipient_id,activity,attempts`,
      [input.eventId || null],
    );
    const job = result.rows[0];
    if (!job) break;
    try {
      // Resolve the current account and membership again: revocation and opt-out take effect on queued mail.
      const row = await getEventHistoryById(job.event_id);
      const permission = row && (await getEventPermissions(row, job.recipient_id));
      const settings =
        row &&
        permission?.canManageResponses &&
        (await signupHostAlertSettings(row, job.recipient_id));
      if (
        !row ||
        isEventDraft(row.data) ||
        !row.data?.signupForm ||
        !settings ||
        !settings.email ||
        !wantsSignupHostAlert(settings.preferences, job.activity.kind)
      ) {
        await query(
          "UPDATE signup_host_alerts SET status='skipped',updated_at=now() WHERE id=$1 AND status='sending'",
          [job.id],
        );
        counts.skipped++;
        continue;
      }
      await sendSignupHostAlertEmail({
        toEmail: settings.email,
        eventTitle: row.data.signupForm.title || row.title || "Signup form",
        dashboardUrl: `${signupEmailEventUrl(row.public_slug || row.id)}#signup-host-dashboard`,
        activity: job.activity,
      });
      // Keep this outside the SMTP catch: losing the acknowledgement write must never reset a sent job.
    } catch (error) {
      const unknown = uncertainSignupSmtpResult(error);
      const failure = error as { responseCode?: number; code?: string } | null;
      const permanent =
        (failure?.responseCode || 0) >= 500 || ["EAUTH", "EENVELOPE"].includes(failure?.code || "");
      const status = unknown ? "unknown" : permanent || job.attempts >= 5 ? "failed" : "pending";
      await query(
        `UPDATE signup_host_alerts SET status=$2,updated_at=now(),next_attempt_at=now()+($3*interval '1 minute')
        WHERE id=$1 AND status='sending'`,
        [job.id, status, Math.min(60, 2 ** (job.attempts - 1))],
      );
      counts[unknown ? "unknown" : "failed"]++;
      console.error("[signup-host-alerts] Attempt failed", { status, attempt: job.attempts });
      continue;
    }
    await query(
      "UPDATE signup_host_alerts SET status='accepted',updated_at=now() WHERE id=$1 AND status='sending'",
      [job.id],
    );
    counts.accepted++;
  }
  return counts;
}

export async function retrySignupHostAlert(eventId: string, userId: string, alertId: string) {
  await ensureSignupHostAlerts();
  const saved = await mutateSignupEvent(eventId, async (row, client) => {
    if (
      !(await getEventPermissions(row, userId, client)).canManageResponses ||
      !row.data?.signupForm
    )
      throw new SignupMutationError("You no longer have access to manage this signup form.", 403);
    await client.query(
      `UPDATE signup_host_alerts SET status='pending',attempts=0,next_attempt_at=now(),updated_at=now()
      WHERE id=$1 AND event_id=$2 AND recipient_id=$3 AND status='failed'`,
      [alertId, eventId, userId],
    );
    return { data: row.data, result: true };
  });
  if (!saved) throw new SignupMutationError("Signup form not found.", 404);
}

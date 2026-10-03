import { createHash, randomBytes } from "node:crypto";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { type EventHistoryRow, prepareEventHistoryData, query, withClient } from "@/lib/db";
import { isEventDraft } from "@/lib/event-draft-access";
import { invalidateUserHistory } from "@/lib/history-cache";
import {
  type EventAccessPerson,
  EventCollaborationError,
  eventPermissions,
  supportsEventCollaboration,
} from "./event-collaboration-types";

const EVENT_COLLABORATION_SCHEMA = `
CREATE TABLE IF NOT EXISTS event_collaborators (
  event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz,
  PRIMARY KEY(event_id,user_id));
CREATE INDEX IF NOT EXISTS event_collaborators_user ON event_collaborators(user_id) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS event_collaborator_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES users(id), email text NOT NULL, token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL, accepted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  accepted_at timestamptz, revoked_at timestamptz,
  email_status text NOT NULL DEFAULT 'pending' CHECK(email_status IN ('pending','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS event_collaborator_invites_event ON event_collaborator_invites(event_id);
CREATE TABLE IF NOT EXISTS event_edit_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL, action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.event_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_collaborator_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_edit_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.event_collaborators, public.event_collaborator_invites, public.event_edit_activity FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.event_collaborators, public.event_collaborator_invites, public.event_edit_activity FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.event_collaborators, public.event_collaborator_invites, public.event_edit_activity FROM authenticated;
  END IF;
END $$;`;

let schema: Promise<void> | undefined;
export function ensureEventCollaboration(): Promise<void> {
  schema ||= withClient(async (client) => {
    // A migrated database needs no DDL or exclusive table locks on a cold request.
    const ready = await client.query<{ ready: boolean }>(`
      SELECT count(*) = 3 AND bool_and(c.relrowsecurity AND NOT EXISTS (
        SELECT 1 FROM aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) grants
        LEFT JOIN pg_roles r ON r.oid = grants.grantee
        WHERE grants.grantee = 0 OR r.rolname IN ('anon', 'authenticated')
      )) AND to_regclass('public.event_collaborators_user') IS NOT NULL
         AND to_regclass('public.event_collaborator_invites_event') IS NOT NULL AS ready
      FROM pg_class c WHERE c.oid IN (
        to_regclass('public.event_collaborators'),
        to_regclass('public.event_collaborator_invites'),
        to_regclass('public.event_edit_activity'))`);
    if (ready.rows[0]?.ready) return;
    await client.query("BEGIN");
    try {
      await client.query(EVENT_COLLABORATION_SCHEMA);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }).catch((error) => {
    schema = undefined;
    throw error;
  });
  return schema;
}

export async function saveCollaborativeEvent(params: {
  eventId: string;
  userId: string;
  expectedRevision: string | null;
  patch: Record<string, any>;
  title?: string;
}): Promise<EventHistoryRow & { revision: string }> {
  await ensureEventCollaboration();
  const updated = await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const row = (
        await client.query<EventHistoryRow>(
          "SELECT id,user_id,title,data,public_slug,created_at FROM event_history WHERE id=$1 FOR UPDATE",
          [params.eventId],
        )
      ).rows[0];
      if (!row) throw new EventCollaborationError("Event not found.", 404, "not_found");
      const owner = row.user_id === params.userId;
      const member = owner
        ? true
        : Boolean(
            (
              await client.query(
                "SELECT 1 FROM event_collaborators WHERE event_id=$1 AND user_id=$2 AND revoked_at IS NULL",
                [row.id, params.userId],
              )
            ).rows.length,
          );
      if (!member || !supportsEventCollaboration(row.data))
        throw new EventCollaborationError(
          "You no longer have editing access to this event.",
          403,
          "access_revoked",
        );
      const collaborators = await client.query(
        "SELECT 1 FROM event_collaborators WHERE event_id=$1 AND revoked_at IS NULL LIMIT 1",
        [row.id],
      );
      if (!params.expectedRevision && (!owner || collaborators.rows.length))
        throw new EventCollaborationError(
          "Reopen the editor to load the current event before saving. Your edits are still available here.",
          428,
          "revision_required",
        );
      if (params.expectedRevision && params.expectedRevision !== eventRevision(row))
        throw new EventCollaborationError(
          "This event changed since you opened it. Your edits are still here. Copy any changes you want to keep, then reopen the latest event before saving.",
          409,
          "event_changed",
        );
      const data = prepareEventHistoryData({ ...row.data, ...params.patch });
      delete data.collaborationRole;
      if (
        !owner &&
        (!supportsEventCollaboration(data) ||
          (!isEventDraft(row.data) && isEventDraft(data)) ||
          data.publicSlug !== row.data.publicSlug)
      )
        throw new EventCollaborationError(
          "Only the owner can change ownership, the public URL or unpublish this event.",
          403,
          "owner_required",
        );
      const result = (
        await client.query<EventHistoryRow>(
          `UPDATE event_history SET data=$2::jsonb,title=$3 WHERE id=$1
        RETURNING id,user_id,title,data,public_slug,created_at`,
          [row.id, JSON.stringify(data), params.title || row.title],
        )
      ).rows[0];
      await client.query(
        "INSERT INTO event_edit_activity(event_id,user_id,action) VALUES($1,$2,$3)",
        [row.id, params.userId, isEventDraft(result.data) ? "saved_draft" : "saved_changes"],
      );
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
  await invalidateEventCollaborators(updated);
  return { ...updated, revision: eventRevision(updated) };
}

export function eventRevision(row: Pick<EventHistoryRow, "title" | "data">): string {
  // JSONB reads have stable key ordering. This covers every writer, including legacy editors.
  return createHash("sha256")
    .update(JSON.stringify({ title: row.title, data: row.data }))
    .digest("hex");
}

export async function getEventPermissions(
  event: EventHistoryRow,
  userId: string | null | undefined,
) {
  if (!userId) return eventPermissions(null);
  if (event.user_id === userId) return eventPermissions("owner");
  if (!supportsEventCollaboration(event.data)) return eventPermissions(null);
  await ensureEventCollaboration();
  const result = await query<{ allowed: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM event_collaborators WHERE event_id=$1 AND user_id=$2 AND revoked_at IS NULL) AS allowed",
    [event.id, userId],
  );
  return eventPermissions(result.rows[0]?.allowed ? "cohost" : null);
}

export async function collaboratorUserIds(eventId: string): Promise<string[]> {
  await ensureEventCollaboration();
  return (
    await query<{ user_id: string }>(
      "SELECT user_id FROM event_collaborators WHERE event_id=$1 AND revoked_at IS NULL",
      [eventId],
    )
  ).rows.map((row) => row.user_id);
}

export async function invalidateEventCollaborators(event: EventHistoryRow): Promise<void> {
  for (const id of [event.user_id, ...(await collaboratorUserIds(event.id))]) {
    if (id) {
      invalidateUserHistory(id);
      invalidateUserDashboard(id);
    }
  }
}

export async function listCollaborativeEvents(userId: string): Promise<EventHistoryRow[]> {
  await ensureEventCollaboration();
  const rows = (
    await query<EventHistoryRow>(
      `SELECT e.id,e.user_id,e.title,e.data,e.public_slug,e.created_at FROM event_history e
    JOIN event_collaborators c ON c.event_id=e.id WHERE c.user_id=$1 AND c.revoked_at IS NULL ORDER BY e.created_at DESC LIMIT 200`,
      [userId],
    )
  ).rows;
  return rows
    .filter((row) => supportsEventCollaboration(row.data))
    .map((row) => ({
      ...row,
      data: { ...row.data, collaborationRole: "cohost", ownership: "owned", shared: false },
    }));
}

export async function requireCollaborationOwner(
  eventId: string,
  userId: string,
): Promise<Pick<EventHistoryRow, "id" | "user_id" | "title" | "data">> {
  // Managing access does not need artwork, guest data or public-link initialization.
  const event = (
    await query<Pick<EventHistoryRow, "id" | "user_id" | "title" | "data">>(
      `SELECT id,user_id,title,jsonb_build_object(
      'signupForm', data->'signupForm', 'attachment', data->'attachment',
      'invitedFromScan', data->'invitedFromScan', 'ownership', data->'ownership',
      'createdVia', data->'createdVia') AS data
     FROM event_history WHERE id=$1 AND user_id=$2 LIMIT 1`,
      [eventId, userId],
    )
  ).rows[0];
  if (!event || event.user_id !== userId)
    throw new EventCollaborationError(
      "Only the event owner can manage co-hosts.",
      403,
      "owner_required",
    );
  if (!supportsEventCollaboration(event.data))
    throw new EventCollaborationError(
      "Co-host access is available for authored events and Live Cards.",
      400,
      "unsupported_event",
    );
  return event;
}

export async function inviteEventCollaborator(eventId: string, userId: string, email: string) {
  await ensureEventCollaboration();
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const event = (
        await client.query<EventHistoryRow>(
          "SELECT id,user_id,title,data FROM event_history WHERE id=$1 FOR UPDATE",
          [eventId],
        )
      ).rows[0];
      if (!event || event.user_id !== userId || !supportsEventCollaboration(event.data))
        throw new EventCollaborationError(
          "Only the event owner can invite co-hosts.",
          403,
          "owner_required",
        );
      const ownerEmail = (
        await client.query<{ email: string }>("SELECT email FROM users WHERE id=$1", [userId])
      ).rows[0]?.email;
      if (ownerEmail?.toLowerCase() === email)
        throw new EventCollaborationError("You already own this event.", 400, "self_invite");
      const active = await client.query(
        `SELECT 1 FROM event_collaborators c JOIN users u ON u.id=c.user_id
        WHERE c.event_id=$1 AND lower(u.email)=$2 AND c.revoked_at IS NULL`,
        [eventId, email],
      );
      if (active.rows.length)
        throw new EventCollaborationError(
          "This person already has co-host access.",
          409,
          "already_cohost",
        );
      const recent = await client.query<{ count: string }>(
        "SELECT count(*) FROM event_collaborator_invites WHERE invited_by=$1 AND created_at > now()-interval '15 minutes'",
        [userId],
      );
      if (Number(recent.rows[0]?.count) >= 20)
        throw new EventCollaborationError(
          "Please wait before sending more invitations.",
          429,
          "rate_limited",
        );
      await client.query(
        "UPDATE event_collaborator_invites SET revoked_at=now() WHERE event_id=$1 AND email=$2 AND accepted_at IS NULL AND revoked_at IS NULL",
        [eventId, email],
      );
      const invite = (
        await client.query<{ id: string }>(
          `INSERT INTO event_collaborator_invites(event_id,invited_by,email,token_hash,expires_at)
        VALUES($1,$2,$3,$4,now()+interval '7 days') RETURNING id`,
          [eventId, userId, email, hash],
        )
      ).rows[0];
      await client.query("COMMIT");
      return { id: invite.id, token, event };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function markCollaborationEmail(id: string, status: "sent" | "failed") {
  await query("UPDATE event_collaborator_invites SET email_status=$2 WHERE id=$1", [id, status]);
}

export async function listEventAccess(eventId: string): Promise<EventAccessPerson[]> {
  await ensureEventCollaboration();
  return (
    await query<EventAccessPerson>(
      `SELECT c.user_id::text AS id,u.email,
    trim(concat_ws(' ',u.first_name,u.last_name)) AS name,'accepted'::text AS status,NULL::text AS "expiresAt",NULL::text AS "emailStatus"
    FROM event_collaborators c JOIN users u ON u.id=c.user_id WHERE c.event_id=$1 AND c.revoked_at IS NULL
    UNION ALL SELECT i.id::text,i.email,'' AS name,
    CASE WHEN i.expires_at<=now() THEN 'expired' ELSE 'pending' END AS status,i.expires_at::text,i.email_status
    FROM event_collaborator_invites i WHERE i.event_id=$1 AND i.revoked_at IS NULL AND i.accepted_at IS NULL`,
      [eventId],
    )
  ).rows;
}

export async function revokeEventCollaborator(
  eventId: string,
  ownerId: string,
  id: string,
): Promise<void> {
  await ensureEventCollaboration();
  await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const event = (
        await client.query<EventHistoryRow>(
          "SELECT id,user_id,title,data FROM event_history WHERE id=$1 FOR UPDATE",
          [eventId],
        )
      ).rows[0];
      if (!event || event.user_id !== ownerId)
        throw new EventCollaborationError(
          "Only the event owner can remove co-host access.",
          403,
          "owner_required",
        );
      await client.query(
        "UPDATE event_collaborators SET revoked_at=now() WHERE event_id=$1 AND user_id=$2",
        [eventId, id],
      );
      await client.query(
        "UPDATE event_collaborator_invites SET revoked_at=now() WHERE event_id=$1 AND (id=$2 OR accepted_by=$2)",
        [eventId, id],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
  invalidateUserDashboard(id);
  invalidateUserHistory(id);
}

type InviteRecord = {
  id: string;
  event_id: string;
  invited_by: string;
  email: string;
  accepted_at: string | null;
  accepted_by: string | null;
  revoked_at: string | null;
  expires_at: string;
  eventTitle: string;
  ownerName: string;
};
export async function readCollaboratorInvitation(token: string): Promise<InviteRecord | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  await ensureEventCollaboration();
  return (
    (
      await query<InviteRecord>(
        `SELECT i.*,e.title AS "eventTitle",trim(concat_ws(' ',u.first_name,u.last_name)) AS "ownerName"
    FROM event_collaborator_invites i JOIN event_history e ON e.id=i.event_id JOIN users u ON u.id=i.invited_by
    WHERE i.token_hash=$1`,
        [createHash("sha256").update(token).digest("hex")],
      )
    ).rows[0] || null
  );
}

export async function acceptCollaboratorInvitation(token: string, userId: string): Promise<string> {
  const invite = await readCollaboratorInvitation(token);
  if (!invite)
    throw new EventCollaborationError(
      "This invitation is unavailable. Ask the owner for a new invitation.",
      404,
      "invalid_invitation",
    );
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      // Use the same event-first lock order as resend and revoke.
      const event = (
        await client.query<EventHistoryRow>(
          "SELECT id,user_id,title,data FROM event_history WHERE id=$1 FOR UPDATE",
          [invite.event_id],
        )
      ).rows[0];
      const current = (
        await client.query<InviteRecord>(
          "SELECT * FROM event_collaborator_invites WHERE id=$1 FOR UPDATE",
          [invite.id],
        )
      ).rows[0];
      const email = (
        await client.query<{ email: string }>("SELECT email FROM users WHERE id=$1", [userId])
      ).rows[0]?.email?.toLowerCase();
      if (
        !current ||
        current.revoked_at ||
        current.accepted_at ||
        Date.parse(current.expires_at) <= Date.now() ||
        !event ||
        event.user_id !== current.invited_by ||
        !supportsEventCollaboration(event.data)
      )
        throw new EventCollaborationError(
          "This invitation has expired or has already been used. Ask the owner for a new invitation.",
          410,
          "invitation_unavailable",
        );
      if (email !== current.email)
        throw new EventCollaborationError(
          `Sign in with ${current.email} to accept this invitation.`,
          403,
          "wrong_account",
        );
      await client.query(
        `INSERT INTO event_collaborators(event_id,user_id,invited_by) VALUES($1,$2,$3)
        ON CONFLICT(event_id,user_id) DO UPDATE SET revoked_at=NULL,invited_by=excluded.invited_by,created_at=now()`,
        [event.id, userId, event.user_id],
      );
      await client.query(
        "UPDATE event_collaborator_invites SET accepted_at=now(),accepted_by=$2 WHERE id=$1",
        [current.id, userId],
      );
      await client.query("COMMIT");
      invalidateUserHistory(userId);
      invalidateUserDashboard(userId);
      return event.id;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

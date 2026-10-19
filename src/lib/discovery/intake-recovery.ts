import { query, withClient, getEventDiscoveryByEventId, getEventHistoryInputBlob } from "@/lib/db";
import { createHash } from "node:crypto";

let schema: Promise<unknown> | undefined;
export const discoveryRecoveryDeps = { query, withClient, getEventDiscoveryByEventId, getEventHistoryInputBlob };
function ensureControls() {
  schema ||= discoveryRecoveryDeps.query(`CREATE TABLE IF NOT EXISTS event_discovery_controls (
    event_id text PRIMARY KEY, owner_id text NOT NULL, client_key text,
    cancel_requested_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(owner_id, client_key)
  );
  ALTER TABLE event_discovery_controls ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON TABLE event_discovery_controls FROM PUBLIC;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON TABLE event_discovery_controls FROM anon; END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON TABLE event_discovery_controls FROM authenticated; END IF;
  END $$;`).catch((error) => { schema = undefined; throw error; });
  return schema;
}
export function validDiscoveryIntakeKey(value: unknown): string | null {
  return typeof value === "string" && /^[a-zA-Z0-9:_-]{8,160}$/.test(value) ? value : null;
}

/** A process crash before the control-row commit still recovers the same owned shell. */
export function discoveryEventIdForIntake(ownerId: string, key: string): string {
  const bytes = createHash("sha256").update(`envitefy-discovery:${ownerId}\0${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function recoverDiscoveryIntake(ownerId: string, key: string) {
  await ensureControls();
  const result = await discoveryRecoveryDeps.query<{ event_id: string }>("SELECT event_id FROM event_discovery_controls WHERE owner_id=$1 AND client_key=$2", [ownerId, key]);
  if (result.rows[0]?.event_id.startsWith("pending:")) return null;
  const discovery = await discoveryRecoveryDeps.getEventDiscoveryByEventId(result.rows[0]?.event_id || discoveryEventIdForIntake(ownerId, key));
  if (!discovery) return null;
  if (discovery.source.type === "file" && !discovery.source.dataUrl && !(await discoveryRecoveryDeps.getEventHistoryInputBlob(discovery.eventId))) return null;
  return {
    ok: true as const,
    eventId: discovery.eventId,
    discoveryId: discovery.id,
    workflow: discovery.workflow,
    activityProfile: discovery.source.activityProfile || null,
    processingStage: discovery.pipeline.processingStage,
  };
}

/** The DB lock serializes identical intake keys across processes and server instances. */
export async function withIdempotentDiscoveryIntake<T extends { ok: boolean; eventId?: string }>(ownerId: string | null, key: string | null, create: (eventId?: string) => Promise<T>): Promise<T | NonNullable<Awaited<ReturnType<typeof recoverDiscoveryIntake>>>> {
  if (!ownerId || !key) return create();
  await ensureControls();
  return discoveryRecoveryDeps.withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`creation-intake:${ownerId}:${key}`]);
      const control = await client.query("SELECT cancel_requested_at FROM event_discovery_controls WHERE owner_id=$1 AND client_key=$2", [ownerId, key]);
      if (control.rows[0]?.cancel_requested_at) throw Object.assign(new Error("This import was cancelled. Start a new import to continue."), { status: 409, code: "cancelled" });
      const existing = await recoverDiscoveryIntake(ownerId, key);
      if (existing) {
        await client.query(`INSERT INTO event_discovery_controls(event_id,owner_id,client_key) VALUES($1,$2,$3)
          ON CONFLICT(event_id) DO UPDATE SET client_key=EXCLUDED.client_key WHERE event_discovery_controls.owner_id=EXCLUDED.owner_id`, [existing.eventId, ownerId, key]);
        await client.query("COMMIT"); return existing;
      }
      // Discard only stale identity mappings whose corresponding event was explicitly deleted.
      await client.query("DELETE FROM event_discovery_controls WHERE owner_id=$1 AND client_key=$2", [ownerId, key]);
      const result = await create(discoveryEventIdForIntake(ownerId, key));
      if (result.ok && result.eventId) await client.query("INSERT INTO event_discovery_controls(event_id,owner_id,client_key) VALUES($1,$2,$3)", [result.eventId, ownerId, key]);
      await client.query("COMMIT");
      return result;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  });
}

/** A cancellation can arrive before the upload response; the same lock prevents late creation. */
export async function cancelDiscoveryIntakeKey(ownerId: string, key: string): Promise<string | null> {
  await ensureControls();
  return discoveryRecoveryDeps.withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`creation-intake:${ownerId}:${key}`]);
      const result = await client.query<{ event_id: string }>(`INSERT INTO event_discovery_controls(event_id,owner_id,client_key,cancel_requested_at) VALUES($1,$2,$3,now())
        ON CONFLICT(owner_id,client_key) DO UPDATE SET cancel_requested_at=now() RETURNING event_id`, [discoveryEventIdForIntake(ownerId, key), ownerId, key]);
      await client.query("COMMIT");
      const id = result.rows[0].event_id;
      return id.startsWith("pending:") ? null : id;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  });
}

export async function requestPersistentDiscoveryCancellation(eventId: string, ownerId: string) {
  await ensureControls();
  await discoveryRecoveryDeps.query(`INSERT INTO event_discovery_controls(event_id,owner_id,cancel_requested_at) VALUES($1,$2,now())
    ON CONFLICT(event_id) DO UPDATE SET cancel_requested_at=now()`, [eventId, ownerId]);
}
export async function isDiscoveryCancellationRequested(eventId: string): Promise<boolean> {
  await ensureControls();
  const result = await discoveryRecoveryDeps.query<{ cancelled: boolean }>("SELECT cancel_requested_at IS NOT NULL AS cancelled FROM event_discovery_controls WHERE event_id=$1", [eventId]);
  return result.rows[0]?.cancelled === true;
}

/** Cancel hides only unsaved import shells; saved drafts and published events retain their identity. */
export async function hideCancelledDiscoveryShell(eventId: string) {
  return discoveryRecoveryDeps.query(`UPDATE event_history SET data=coalesce(data,'{}'::jsonb) ||
    '{"status":"cancelled","draftStatus":"draft"}'::jsonb
    WHERE id=$1::uuid
      AND data->>'createdVia' IN ('meet-discovery','meet-discovery-v2','football-discovery','football-discovery-v2','sports-discovery-v1')
      AND lower(coalesce(data->>'status','')) <> 'published'
      AND lower(coalesce(data->>'draftStatus','')) <> 'published'
      AND NOT (data ? 'manualEditor' OR data ? 'templateEditor')
    RETURNING user_id`, [eventId]);
}

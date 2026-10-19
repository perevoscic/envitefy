import { afterEach, expect, test } from "bun:test";
import { cancelDiscoveryIntakeKey, discoveryEventIdForIntake, discoveryRecoveryDeps, recoverDiscoveryIntake, withIdempotentDiscoveryIntake } from "./intake-recovery";

const original = { ...discoveryRecoveryDeps };
afterEach(() => Object.assign(discoveryRecoveryDeps, original));

function fixture() {
  const rows = new Map<string, { event_id: string; cancel_requested_at: string | null }>();
  const events = new Map<string, any>();
  const key = (owner: string, client: string) => `${owner}:${client}`;
  let tail = Promise.resolve();
  const select = async (sql: string, values: any[] = []) => {
    if (sql.startsWith("CREATE")) return { rows: [] };
    if (sql.startsWith("SELECT event_id")) { const row = rows.get(key(values[0], values[1])); return { rows: row ? [row] : [] }; }
    throw new Error(`Unexpected shared query: ${sql}`);
  };
  discoveryRecoveryDeps.query = select as typeof original.query;
  discoveryRecoveryDeps.getEventDiscoveryByEventId = (async (id: string) => events.get(id) || null) as typeof original.getEventDiscoveryByEventId;
  discoveryRecoveryDeps.getEventHistoryInputBlob = async () => null;
  discoveryRecoveryDeps.withClient = (async (work: any) => {
    let unlock: (() => void) | undefined;
    const client = { query: async (sql: string, values: any[] = []) => {
      if (sql === "BEGIN") return { rows: [] };
      if (sql.includes("pg_advisory_xact_lock")) {
        const previous = tail;
        tail = new Promise<void>((resolve) => { unlock = resolve; });
        await previous;
        return { rows: [] };
      }
      if (sql === "COMMIT" || sql === "ROLLBACK") { unlock?.(); return { rows: [] }; }
      if (sql.startsWith("SELECT cancel_requested_at")) { const row = rows.get(key(values[0], values[1])); return { rows: row ? [row] : [] }; }
      if (sql.startsWith("DELETE")) { rows.delete(key(values[0], values[1])); return { rows: [] }; }
      if (sql.startsWith("INSERT")) {
        const identity = key(values[1], values[2]);
        const existing = rows.get(identity);
        const row = { event_id: existing?.event_id || values[0], cancel_requested_at: sql.includes("cancel_requested_at") ? new Date().toISOString() : null };
        rows.set(identity, row);
        return { rows: [row] };
      }
      throw new Error(`Unexpected transaction query: ${sql}`);
    } };
    return work(client);
  }) as typeof original.withClient;
  const create = (eventId: string) => async () => {
    events.set(eventId, { id: `discovery-${eventId}`, eventId, workflow: "gymnastics", source: {}, pipeline: { processingStage: "ingested" } });
    return { ok: true, eventId };
  };
  return { rows, events, create };
}

test("concurrent retries use one server identity under the database intake lock", async () => {
  const state = fixture();
  let creates = 0;
  const create = async () => { creates++; await Promise.resolve(); return state.create("same-event")(); };
  const results = await Promise.all([
    withIdempotentDiscoveryIntake("owner-a", "same-client-key", create),
    withIdempotentDiscoveryIntake("owner-a", "same-client-key", create),
  ]);
  expect(creates).toBe(1);
  expect(results.map((result) => result.eventId)).toEqual(["same-event", "same-event"]);
});

test("an intake key cannot recover another account's event", async () => {
  const state = fixture();
  await withIdempotentDiscoveryIntake("owner-a", "shared-key", state.create("event-a"));
  expect(await recoverDiscoveryIntake("owner-b", "shared-key")).toBeNull();
  const result = await withIdempotentDiscoveryIntake("owner-b", "shared-key", state.create("event-b"));
  expect(result.eventId).toBe("event-b");
});

test("cancelling before upload completion durably prevents late creation", async () => {
  fixture();
  expect(await cancelDiscoveryIntakeKey("owner-a", "pending-key")).toBe(discoveryEventIdForIntake("owner-a", "pending-key"));
  let creates = 0;
  await expect(withIdempotentDiscoveryIntake("owner-a", "pending-key", async () => { creates++; return { ok: true, eventId: "late-event" }; })).rejects.toThrow("cancelled");
  expect(creates).toBe(0);
});

test("a crash after shell insertion but before identity mapping recovers that exact shell", async () => {
  const state = fixture();
  const eventId = discoveryEventIdForIntake("owner-a", "crashed-key");
  await state.create(eventId)();
  let creates = 0;
  const recovered = await withIdempotentDiscoveryIntake("owner-a", "crashed-key", async () => { creates++; return { ok: true, eventId: "duplicate" }; });
  expect(recovered.eventId).toBe(eventId);
  expect(creates).toBe(0);
  expect(state.rows.get("owner-a:crashed-key")?.event_id).toBe(eventId);
});

test("an interrupted source upload is repaired on the same identity rather than resumed without its file", async () => {
  const state = fixture();
  const eventId = discoveryEventIdForIntake("owner-a", "source-upload-key");
  await state.create(eventId)();
  state.events.get(eventId).source.type = "file";
  expect(await recoverDiscoveryIntake("owner-a", "source-upload-key")).toBeNull();
  let repairIdentity = "";
  await withIdempotentDiscoveryIntake("owner-a", "source-upload-key", async (id) => { repairIdentity = id || ""; return { ok: true, eventId: id }; });
  expect(repairIdentity).toBe(eventId);
});

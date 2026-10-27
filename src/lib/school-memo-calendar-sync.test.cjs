const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

function harness() {
  const h = { queries: [], writes: [], invalidations: [], fail: new Set() };
  h.row = {
    id: "memo-one", user_id: "owner", data: {
      scanSchedule: {
        kind: "school-memo", title: "Weekly memo", timezone: "America/Chicago",
        items: [
          { id: "bible", type: "test", title: "Bible test", date: "2026-10-30" },
          { id: "spelling", type: "test", title: "Spelling test", date: "2026-10-30" },
          { id: "spirit", type: "event", title: "Spirit Week", date: "2026-10-26", endDate: "2026-10-30" },
        ],
      },
    },
  };
  h.key = (id, provider = "google") => `${provider}:${createHash("sha256").update(`${h.row.id}:${id}`).digest("hex").slice(0, 32)}`;
  const { syncSelectedSchoolMemoDates, SchoolMemoCalendarInputError, schoolMemoCalendarDeps } = loadTs("src/lib/school-memo-calendar-sync.ts", {
    "@/lib/db": {
      query: async (sql, values) => {
        h.queries.push({ sql, values });
        const [eventId, userId, key, encodedPatch, guard] = values;
        const patch = JSON.parse(encodedPatch);
        if (h.beforeQuery) h.beforeQuery(sql, values);
        if (eventId !== h.row.id || userId !== h.row.user_id) return { rows: [] };
        const states = h.row.data.memoCalendarSync ||= {};
        const current = states[key] || {};
        if (sql.includes("RETURNING")) {
          if (JSON.stringify(h.row.data.scanSchedule) !== values[5] ||
              (current.status === "syncing" && current.updatedAt >= guard)) return { rows: [] };
          states[key] = { ...current, ...patch };
          return { rows: [{ state: structuredClone(states[key]) }] };
        }
        if (current.claimToken === guard) states[key] = { ...current, ...patch };
        return { rows: [] };
      },
    },
    "@/lib/calendar-sync-service": {
      writeSelectedCalendarItem: async (input) => {
        h.writes.push(structuredClone(input));
        if (h.onWrite) await h.onWrite(input);
        if (h.fail.has(input.event.title)) throw new Error("offline provider failure");
        return { externalEventId: input.externalEventId || `provider-${input.sourceId}`, webLink: null };
      },
    },
    "@/lib/history-cache": { invalidateUserHistory: (id) => h.invalidations.push(["history", id]) },
    "@/lib/dashboard-cache": { invalidateUserDashboard: (id) => h.invalidations.push(["dashboard", id]) },
  });
  h.InputError = SchoolMemoCalendarInputError;
  h.clock = 0;
  schoolMemoCalendarDeps.now = () => h.clock;
  h.sync = (options = {}) => syncSelectedSchoolMemoDates({
    eventId: h.row.id, userId: "owner", email: "owner@example.invalid",
    eventUrl: "https://envitefy.example/event/memo-one", provider: "google",
    data: structuredClone(h.row.data), itemIds: ["bible", "spelling"], ...options,
  });
  return h;
}

test("only selected server-saved memo items reach the calendar writer", async () => {
  const h = harness();
  const result = await h.sync({ itemIds: ["spelling"] });
  assert.deepEqual(result, [{ id: "spelling", status: "added", addedAt: "1970-01-01T00:00:00.000Z" }]);
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].event.title, "Spelling test");
  assert.equal(h.writes[0].event.start, "2026-10-30");
  assert.equal(h.writes[0].event.end, "2026-10-31");
  assert.equal(h.writes[0].event.attachment, undefined);
  assert.deepEqual(h.writes[0].event.reminders, []);
  assert.equal(h.writes[0].event.recurrence, null);
  assert.equal(h.row.data.calendarSync, undefined, "the parent must not gain an automatic calendar entry");
});

test("unknown IDs, empty selections and non-memos are rejected before any provider write", async () => {
  const h = harness();
  for (const itemIds of [[], ["another-memos-id"], Array.from({ length: 51 }, (_, i) => `item-${i}`)])
    await assert.rejects(h.sync({ itemIds }), (error) => error instanceof h.InputError && /Select between 1 and 50/.test(error.message));
  await assert.rejects(h.sync({ data: { scanSchedule: { items: [{ title: "Game" }] } } }), (error) => error instanceof h.InputError && /saved school memo/.test(error.message));
  assert.equal(h.writes.length, 0);
  assert.equal(h.queries.length, 0);
});

test("a repeated selection is unchanged and editing one ID updates its linked entry", async () => {
  const h = harness();
  await h.sync();
  const existingId = h.row.data.memoCalendarSync[h.key("bible")].externalEventId;
  assert.deepEqual(await h.sync(), [{ id: "bible", status: "unchanged", addedAt: "1970-01-01T00:00:00.000Z" }, { id: "spelling", status: "unchanged", addedAt: "1970-01-01T00:00:00.000Z" }]);
  assert.equal(h.writes.length, 2);
  h.row.data.scanSchedule.items[0].date = "2026-11-02";
  h.row.data.scanSchedule.items[0].title = "Updated Bible test";
  h.row.data.scanSchedule.items.reverse();
  const result = await h.sync();
  assert.deepEqual(result, [{ id: "spelling", status: "unchanged", addedAt: "1970-01-01T00:00:00.000Z" }, { id: "bible", status: "updated", addedAt: "1970-01-01T00:00:00.000Z" }]);
  assert.equal(h.writes.length, 3);
  assert.equal(h.writes[2].externalEventId, existingId);
  assert.equal(h.writes[2].sourceId, h.writes[0].sourceId);
  assert.equal(h.writes[2].event.start, "2026-11-02");
});

test("a partial failure retries only the failed date while retaining successful mappings", async () => {
  const h = harness();
  h.fail.add("Spelling test");
  assert.deepEqual(await h.sync(), [
    { id: "bible", status: "added", addedAt: "1970-01-01T00:00:00.000Z" },
    { id: "spelling", status: "failed", message: "Could not add this date. Check your calendar connection and retry." },
  ]);
  h.fail.clear();
  assert.deepEqual(await h.sync(), [{ id: "bible", status: "unchanged", addedAt: "1970-01-01T00:00:00.000Z" }, { id: "spelling", status: "added", addedAt: "1970-01-01T00:00:00.000Z" }]);
  assert.deepEqual(h.writes.map((write) => write.event.title), ["Bible test", "Spelling test", "Spelling test"]);
  assert.equal(h.row.data.memoCalendarSync[h.key("bible")].status, "synced");
  assert.equal(h.row.data.memoCalendarSync[h.key("spelling")].status, "synced");
});

test("fresh leases and changed snapshots prevent writes; expired leases recover", async () => {
  const h = harness();
  h.row.data.memoCalendarSync = { [h.key("bible")]: { status: "syncing", updatedAt: new Date().toISOString(), claimToken: "other" } };
  assert.equal((await h.sync({ itemIds: ["bible"] }))[0].status, "busy");
  assert.equal(h.writes.length, 0);
  h.row.data.memoCalendarSync[h.key("bible")].updatedAt = new Date(Date.now() - 180_000).toISOString();
  assert.equal((await h.sync({ itemIds: ["bible"] }))[0].status, "added");
  const snapshot = structuredClone(h.row.data);
  h.row.data.scanSchedule.items[1].date = "2026-11-03";
  assert.equal((await h.sync({ data: snapshot, itemIds: ["spelling"] }))[0].status, "busy");
  assert.equal(h.writes.length, 1);
});

test("a late completion cannot overwrite a newer worker's state", async () => {
  const h = harness();
  h.onWrite = async () => {
    h.row.data.memoCalendarSync[h.key("bible")] = {
      status: "synced", claimToken: "newer-worker", contentHash: "newer-content", externalEventId: "newer-provider-entry",
    };
  };
  await h.sync({ itemIds: ["bible"] });
  assert.equal(h.row.data.memoCalendarSync[h.key("bible")].contentHash, "newer-content");
  assert.equal(h.row.data.memoCalendarSync[h.key("bible")].externalEventId, "newer-provider-entry");
  assert.match(h.queries.at(-1).sql, /claimToken.*= \$5/);
});

test("another account cannot claim a memo item and a timed item without an end stays unsent", async () => {
  const h = harness();
  assert.equal((await h.sync({ userId: "other", itemIds: ["bible"] }))[0].status, "busy");
  assert.equal(h.writes.length, 0);
  h.row.data.scanSchedule.items[0].startTime = "15:30";
  const result = await h.sync({ itemIds: ["bible"] });
  assert.equal(result[0].status, "failed");
  assert.match(result[0].message, /end time/);
  assert.equal(h.writes.length, 0);
});

test("the batch budget returns unattempted items as retryable and a retry only adds remaining dates", async () => {
  const h = harness();
  h.row.data.scanSchedule.items.push(...Array.from({ length: 4 }, (_, index) => ({
    id: `extra-${index}`, type: "event", title: `School event ${index}`, date: "2026-11-16",
  })));
  const itemIds = h.row.data.scanSchedule.items.map((item) => item.id);
  h.onWrite = async () => { h.clock = 60_000; };
  const first = await h.sync({ itemIds });
  assert.deepEqual(first.slice(0, 3).map((result) => result.status), ["added", "added", "added"]);
  assert.deepEqual(first.slice(3).map((result) => [result.id, result.status]), itemIds.slice(3).map((id) => [id, "busy"]));
  assert.ok(first.slice(3).every((result) => /remaining dates.*Retry/.test(result.message)));
  assert.equal(h.writes.length, 3);
  assert.equal(h.queries.filter(({ sql }) => sql.includes("RETURNING")).length, 3);
  const retried = await h.sync({ itemIds });
  assert.deepEqual(retried.slice(0, 3).map((result) => result.status), ["unchanged", "unchanged", "unchanged"]);
  assert.ok(retried.slice(3).every((result) => result.status === "added"));
  assert.equal(h.writes.length, 7);
  assert.equal(new Set(h.writes.map((write) => write.sourceId)).size, 7);
});

test("addition times persist through retries and updates; failed dates have no addition time", async () => {
  const h = harness();
  h.clock = Date.parse("2026-10-27T01:35:00Z");
  h.fail.add("Spelling test");
  const first = await h.sync();
  assert.equal(first[0].addedAt, "2026-10-27T01:35:00.000Z");
  assert.equal(first[1].addedAt, undefined);
  h.clock += 60_000;
  h.row.data.scanSchedule.items[0].title = "Revised Bible test";
  const updated = await h.sync({ itemIds: ["bible"] });
  assert.equal(updated[0].status, "updated");
  assert.equal(updated[0].addedAt, first[0].addedAt);
  assert.equal(h.row.data.memoCalendarSync[h.key("bible")].addedAt, first[0].addedAt);
});

test("saved addition summaries contain only item IDs and confirmed timestamps", async () => {
  const h = harness();
  h.clock = Date.parse("2026-10-27T01:35:00Z");
  h.fail.add("Spelling test");
  await h.sync();
  const { schoolMemoCalendarAdditions } = loadTs("src/lib/school-memo-calendar-sync.ts", {
    "@/lib/db": { query: async () => ({ rows: [] }) },
    "@/lib/calendar-sync-service": { writeSelectedCalendarItem: async () => {} },
    "@/lib/history-cache": { invalidateUserHistory: () => {} },
    "@/lib/dashboard-cache": { invalidateUserDashboard: () => {} },
  });
  assert.deepEqual(schoolMemoCalendarAdditions(h.row.id, h.row.data), [{ id: "bible", addedAt: "2026-10-27T01:35:00.000Z" }]);
  delete h.row.data.memoCalendarSync[h.key("bible")].addedAt;
  h.row.data.memoCalendarSync[h.key("bible")].updatedAt = "2026-10-26T12:00:00Z";
  assert.equal(schoolMemoCalendarAdditions(h.row.id, h.row.data)[0].addedAt, "2026-10-26T12:00:00Z");
});

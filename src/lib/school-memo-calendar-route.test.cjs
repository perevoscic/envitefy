const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

class SchoolMemoCalendarInputError extends Error {}

function harness({ userId = "owner", email = "OWNER@EXAMPLE.INVALID", exists = true, rowOwner = "owner", syncError = null, readError = null } = {}) {
  const h = { calls: [], reads: [] };
  h.row = { id: "saved-memo", user_id: rowOwner, title: "Weekly memo", public_slug: "weekly-memo", data: { scanSchedule: { kind: "school-memo", items: [{ id: "bible", title: "Bible test", date: "2026-10-30" }] } } };
  const { POST } = loadTs("src/app/api/events/[id]/calendar-items/route.ts", {
    "next-auth": { getServerSession: async () => userId ? { user: { email } } : null },
    "next/server": { NextResponse: Response },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/db": { getEventHistoryById: async (id) => { h.reads.push(id); if (readError) throw readError; return exists ? h.row : null; } },
    "@/lib/absolute-url": { absoluteUrl: async (path) => `https://envitefy.example${path}` },
    "@/utils/event-product-route": { buildEventProductPath: (input) => { h.pathInput = input; return `/event/${input.publicSlug}`; } },
    "@/lib/school-memo-calendar-sync": { SchoolMemoCalendarInputError, syncSelectedSchoolMemoDates: async (input) => {
      h.calls.push(input);
      if (syncError) throw syncError;
      return input.itemIds.map((id) => ({ id, status: "added" }));
    } },
  });
  h.post = (body = { provider: "google", itemIds: ["bible"] }, headers = {}) => POST(new Request("https://envitefy.example/api/events/saved-memo/calendar-items", {
    method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body),
  }), { params: Promise.resolve({ id: "saved-memo" }) });
  return h;
}

test("only the authenticated owner can explicitly add saved memo dates", async () => {
  for (const [options, expected] of [[{ userId: null }, 401], [{ email: null }, 401], [{ userId: "other" }, 403], [{ rowOwner: null }, 403], [{ exists: false }, 404]]) {
    const h = harness(options);
    assert.equal((await h.post()).status, expected);
    assert.equal(h.calls.length, 0);
  }
});

test("the route trusts server records and session identity rather than supplied event details", async () => {
  const h = harness();
  const response = await h.post({
    provider: "google", itemIds: ["bible"],
    userId: "attacker", email: "attacker@example.invalid", eventId: "another-memo",
    eventUrl: "https://malicious.invalid", externalEventId: "unrelated-calendar-entry",
    data: { scanSchedule: { items: [{ id: "bible", title: "Injected title", date: "2030-01-01" }] } },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(await response.json(), { results: [{ id: "bible", status: "added" }] });
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.calls[0], {
    provider: "google", itemIds: ["bible"], userId: "owner", email: "owner@example.invalid",
    eventId: "saved-memo", eventUrl: "https://envitefy.example/event/weekly-memo", data: h.row.data,
  });
});

test("invalid provider or selection payloads never reach calendar synchronization", async () => {
  const h = harness();
  for (const body of [
    "not json", {}, { provider: "apple", itemIds: ["bible"] },
    { provider: "google", itemIds: [] }, { provider: "google", itemIds: [null] },
    { provider: "google", itemIds: ["x".repeat(161)] },
    { provider: "google", itemIds: Array.from({ length: 51 }, () => "bible") },
  ]) assert.equal((await h.post(body)).status, 400);
  assert.equal(h.calls.length, 0);
});

test("a saved-item validation error remains actionable without reporting success", async () => {
  const h = harness({ syncError: new SchoolMemoCalendarInputError("Select between 1 and 50 dates from this memo.") });
  const response = await h.post({ provider: "microsoft", itemIds: ["foreign-item"] });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Select between 1 and 50/);
});

test("unexpected database or synchronization failures return a generic retryable response", async () => {
  for (const options of [
    { readError: new Error("database password=secret internal SQL detail") },
    { syncError: new Error("private provider token or SQL detail") },
  ]) {
    const response = await harness(options).post();
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.match(body.error, /Please retry/);
    assert.doesNotMatch(body.error, /password|token|secret|SQL/);
  }
});

test("cross-site submissions cannot read the memo or start calendar work", async () => {
  const h = harness();
  const response = await h.post({ provider: "google", itemIds: ["bible"] }, { "sec-fetch-site": "cross-site" });
  assert.equal(response.status, 403);
  assert.equal(h.reads.length, 0);
  assert.equal(h.calls.length, 0);
});

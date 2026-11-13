const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../../../scripts/lib/event-messages-test-loader.cjs");

function harness() {
  const h = { userId: "owner", reads: [], collaborativeReads: [], rows: [], collaborators: [] };
  const cache = new Map();
  h.historyCache = loadTs("src/lib/history-cache.ts", {}, cache);
  const imports = {
    "next/server": { NextResponse: { json: Response.json }, after: () => assert.fail("GET cannot start creation work") },
    "next-auth": { getServerSession: async () => ({ user: { id: h.userId } }) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => h.userId },
    "@/lib/db": {
      listSidebarHistoryForUserFast: async (...args) => {
        h.reads.push(args);
        return h.read ? h.read(...args) : h.rows;
      },
      listHistoryForUser: () => assert.fail("upcoming sidebar must use its own projection"),
      listDashboardHistoryFallbackForUser: () => assert.fail("sidebar cannot use the dashboard projection"),
      listDashboardHistoryWindowForUser: () => assert.fail("a timeout cannot launch another full scan"),
    },
    "@/lib/event-collaboration": {
      listCollaborativeEvents: async (...args) => {
        h.collaborativeReads.push(args);
        return h.readCollaborators ? h.readCollaborators(...args) : h.collaborators;
      },
    },
    "@/lib/history-cache": h.historyCache,
    "@/lib/history-view": loadTs("src/lib/history-view.ts", {}, cache),
    "@/lib/query-egress": { withQueryRoute: (_route, work) => work() },
    "@/lib/creation-access-server": {},
    "@/lib/signup-mutations": {},
    "@/lib/event-draft-access": {},
    "@/lib/ocr/scan-artwork": {},
    "@/lib/ocr/original-display-state": {},
    "@/lib/absolute-url": {},
    "@/lib/calendar-sync-background": {},
    "@/lib/dashboard-cache": {},
    "@/lib/event-access": {},
    "@/lib/event-media": {},
    "@/lib/history-page": {},
    "@/lib/scan-attempts": {},
    "@/utils/event-public-slug": {},
  };
  const route = loadTs("src/app/api/history/route.ts", imports, cache);
  h.get = (headers) => route.GET(new Request("https://envitefy.test/api/history?view=sidebar&limit=200&time=upcoming", { headers }));
  return h;
}

test("sidebar reads use the narrow projection and run co-host reads concurrently", async () => {
  const h = harness();
  let owned, collaborative;
  h.read = () => new Promise(resolve => { owned = resolve; });
  h.readCollaborators = () => new Promise(resolve => { collaborative = resolve; });
  const pending = h.get();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.reads.length, 1);
  assert.equal(h.collaborativeReads.length, 1, "the co-host read starts before owned history completes");
  owned([{ id: "owned", title: "Owned", data: {} }]);
  collaborative([{ id: "cohost", title: "Shared", data: { collaborationRole: "cohost" } }]);
  const response = await pending;
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.items.map(row => row.id), ["cohost", "owned"]);
  assert.equal(body.diagnostics.source, "sidebar-projection");
  for (const stage of ["session", "identity", "history", "collaboration", "total"]) {
    assert.match(response.headers.get("server-timing"), new RegExp(`${stage};dur=\\d`));
  }
});

test("a timed-out sidebar read returns a retryable failure without serial fallback scans or caching emptiness", async () => {
  const h = harness();
  h.read = () => { throw Object.assign(new Error("statement timeout"), { code: "57014" }); };
  const response = await h.get();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("x-history-degraded"), "statement-timeout");
  assert.equal(h.reads.length, 1);
  assert.equal(h.historyCache.getCachedHistory("owner", "sidebar", 200, "upcoming"), null);
  h.read = async () => [{ id: "recovered", data: {} }];
  assert.equal((await h.get()).status, 200);
  assert.equal(h.reads.length, 2);
});

test("a timeout reuses only the same account's bounded stale history", async t => {
  t.mock.timers.enable({ apis: ["Date"], now: 1_800_000_000_000 });
  const h = harness();
  h.historyCache.setCachedHistory("owner", "sidebar", 200, "upcoming", [{ id: "retained", data: {} }]);
  t.mock.timers.tick(31_000);
  h.read = () => { throw Object.assign(new Error("statement timeout"), { code: "57014" }); };
  const response = await h.get();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.diagnostics.source, "stale-cache");
  assert.equal(body.items[0].id, "retained");
  h.userId = "other";
  assert.equal((await h.get()).status, 503);
});

test("fresh cached sidebar history avoids another owned read and retains conditional responses", async () => {
  const h = harness();
  h.rows = [{ id: "owned", data: {} }];
  const first = await h.get();
  const second = await h.get({ "if-none-match": first.headers.get("etag") });
  assert.equal(second.status, 304);
  assert.equal(h.reads.length, 1);
  assert.ok(second.headers.get("server-timing"));
});

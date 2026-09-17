import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedHistory,
  getHistoryCacheRevision,
  invalidateAllHistory,
  invalidateUserHistory,
  setCachedHistory,
} from "./history-cache.ts";
import {
  getDashboardRefreshInflight,
  getDashboardResponseCache,
  invalidateUserDashboard,
} from "./dashboard-cache.ts";

test("deleting an event invalidates every history view and rejects an older query's cache write", () => {
  const user = "deleted-event-owner";
  const revision = getHistoryCacheRevision(user);
  setCachedHistory(user, "sidebar", 200, "all", [{ id: "deleted" }], revision);
  setCachedHistory(user, "summary", 50, "upcoming", [{ id: "deleted" }], revision);
  invalidateUserHistory(user);
  assert.equal(getCachedHistory(user, "sidebar", 200, "all"), null);
  assert.equal(getCachedHistory(user, "summary", 50, "upcoming"), null);
  setCachedHistory(user, "sidebar", 200, "all", [{ id: "deleted" }], revision);
  assert.equal(getCachedHistory(user, "sidebar", 200, "all"), null);
  setCachedHistory(user, "sidebar", 200, "all", [{ id: "active" }], getHistoryCacheRevision(user));
  assert.deepEqual(getCachedHistory(user, "sidebar", 200, "all"), [{ id: "active" }]);
});

test("history invalidation respects user boundaries and global resets invalidate pending reads", () => {
  const firstRevision = getHistoryCacheRevision("first");
  const secondRevision = getHistoryCacheRevision("second");
  invalidateUserHistory("first");
  setCachedHistory("second", "sidebar", 200, "all", [{ id: "keep" }], secondRevision);
  assert.deepEqual(getCachedHistory("second", "sidebar", 200, "all"), [{ id: "keep" }]);
  invalidateAllHistory();
  setCachedHistory("first", "sidebar", 200, "all", [{ id: "stale" }], firstRevision);
  setCachedHistory("second", "sidebar", 200, "all", [{ id: "stale" }], secondRevision);
  assert.equal(getCachedHistory("first", "sidebar", 200, "all"), null);
  assert.equal(getCachedHistory("second", "sidebar", 200, "all"), null);
});

test("deletion clears the owner's dashboard response and pending refresh without affecting other accounts", () => {
  const cache = getDashboardResponseCache();
  const pending = getDashboardRefreshInflight();
  for (const user of ["owner", "other"]) {
    cache.set(user, { at: Date.now(), payload: { ok: true } });
    pending.set(user, Promise.resolve({ ok: true }));
  }
  invalidateUserDashboard("owner");
  assert.equal(cache.has("owner"), false);
  assert.equal(pending.has("owner"), false);
  assert.equal(cache.has("other"), true);
  assert.equal(pending.has("other"), true);
});

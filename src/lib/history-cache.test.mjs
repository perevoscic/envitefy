import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedHistory,
  getCachedHistoryStale,
  cleanupExpiredEntries,
  getHistoryCacheRevision,
  invalidateAllHistory,
  invalidateUserHistory,
  setCachedHistory,
  coalesceHistoryRead,
} from "./history-cache.ts";
import {
  getDashboardRefreshInflight,
  getDashboardResponseCache,
  invalidateUserDashboard,
} from "./dashboard-cache.ts";

test("an expired fresh read preserves a bounded stale result for timeout recovery", t => {
  t.mock.timers.enable({ apis: ["Date"], now: 1_800_000_000_000 });
  invalidateAllHistory();
  setCachedHistory("stale-owner", "sidebar", 200, "upcoming", [{ id: "retained" }]);
  t.mock.timers.tick(31_000);
  assert.equal(getCachedHistory("stale-owner", "sidebar", 200, "upcoming"), null);
  cleanupExpiredEntries();
  assert.deepEqual(getCachedHistoryStale("stale-owner", "sidebar", 200, "upcoming"), [{ id: "retained" }]);
  assert.equal(getCachedHistoryStale("other-owner", "sidebar", 200, "upcoming"), null);
  t.mock.timers.tick(5 * 60_000);
  assert.equal(getCachedHistoryStale("stale-owner", "sidebar", 200, "upcoming"), null);
  cleanupExpiredEntries();
});

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

test("concurrent history requests share work only within the same user, filter and mutation revision", async () => {
  invalidateAllHistory();
  const completions = [];
  let calls = 0;
  const load = () => { calls++; return new Promise(resolve => completions.push(resolve)); };
  const first = coalesceHistoryRead("owner", "sidebar", 40, "all", load);
  assert.equal(coalesceHistoryRead("owner", "sidebar", 40, "all", load), first);
  const other = coalesceHistoryRead("other", "sidebar", 40, "all", load);
  const filtered = coalesceHistoryRead("owner", "sidebar", 40, "past", load);
  invalidateUserHistory("owner");
  const newer = coalesceHistoryRead("owner", "sidebar", 40, "all", load);
  assert.notEqual(first, newer);
  await Promise.resolve();
  assert.equal(calls, 4);
  completions.forEach((resolve, index) => { resolve([{ id: index }]); });
  await Promise.all([first, other, filtered, newer]);
});

test("failed coalesced reads can be retried", async () => {
  await assert.rejects(coalesceHistoryRead("failure", "sidebar", 40, "all", async () => { throw new Error("timeout"); }), /timeout/);
  assert.deepEqual(await coalesceHistoryRead("failure", "sidebar", 40, "all", async () => [{ id: "retry" }]), [{ id: "retry" }]);
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

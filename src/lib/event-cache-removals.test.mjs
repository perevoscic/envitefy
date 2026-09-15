import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeEventHistoryRefresh,
  normalizeEventRemovalKey,
  readEventRemovalKeys,
  withoutRemovedEvents,
  writeEventRemovalKeys,
} from "./event-cache-removals.ts";

const deleted = { id: "e749cf9d-6bae-4ed5-a70d-1c0dbe4e8a54", public_slug: "old-season" };
const active = { id: "active-season", title: "Current season" };

test("a response started before deletion cannot restore the deleted event", () => {
  const removed = new Set([deleted.id]);
  const newlySaved = { id: "new-season" };
  const rows = mergeEventHistoryRefresh([deleted, active], [active, newlySaved], true, removed);
  assert.deepEqual(rows, [active, newlySaved]);
  assert.deepEqual(mergeEventHistoryRefresh([deleted, active], rows, false, removed), [active]);
});

test("missing links prune matching IDs, legacy title-ID links and public slugs only", () => {
  for (const eventKey of [deleted.id.toUpperCase(), `old-season-${deleted.id}`, " old-SEASON "]) {
    assert.deepEqual(
      withoutRemovedEvents([deleted, active], new Set([normalizeEventRemovalKey(eventKey)])),
      [active],
    );
  }
  assert.deepEqual(
    withoutRemovedEvents(
      [{ id: "draft", data: { publicSlug: "old-season" } }, active],
      new Set(["old-season"]),
    ),
    [active],
  );
  assert.deepEqual(withoutRemovedEvents([active], new Set(["unknown-event"])), [active]);
});

test("refreshing preserves newer saves while accepting fresh data after mutations settle", () => {
  const updated = { ...active, title: "Edited season" };
  assert.deepEqual(mergeEventHistoryRefresh([active], [updated], true, new Set()), [updated]);
  assert.deepEqual(mergeEventHistoryRefresh([], [updated], false, new Set()), []);
  assert.equal(active.title, "Current season");
});

test("removed events stay hidden after page navigation or reload, scoped to the signed-in account", () => {
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key),
    setItem: (key, value) => data.set(key, value),
  };
  writeEventRemovalKeys(storage, "owner", new Set([deleted.id]));
  const reloaded = readEventRemovalKeys(storage, "owner");
  assert.deepEqual(mergeEventHistoryRefresh([deleted, active], [], false, reloaded), [active]);
  assert.deepEqual([...readEventRemovalKeys(storage, "another-owner")], []);
  reloaded.delete(deleted.id);
  writeEventRemovalKeys(storage, "owner", reloaded);
  assert.equal(readEventRemovalKeys(storage, "owner").size, 0);
});

test("malformed or unavailable session storage cannot break event lists", () => {
  const malformed = { getItem: () => '[null,123,"old-season"]' };
  assert.deepEqual([...readEventRemovalKeys(malformed, "owner")], ["old-season"]);
  assert.equal(readEventRemovalKeys({ getItem: () => "{" }, "owner").size, 0);
  const blocked = {
    getItem() {
      throw new Error("Blocked");
    },
    setItem() {
      throw new Error("Blocked");
    },
  };
  assert.equal(readEventRemovalKeys(blocked, "owner").size, 0);
  assert.doesNotThrow(() => writeEventRemovalKeys(blocked, "owner", new Set([deleted.id])));
});

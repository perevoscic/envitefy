import assert from "node:assert/strict";
import test from "node:test";
import {
  GYM_DISCOVERY_STATUS_PHRASES,
  pickNextRandomPhrase,
} from "./gym-discovery-status-phrases.ts";

test("phrase list has expected count", () => {
  assert.equal(GYM_DISCOVERY_STATUS_PHRASES.length, 30);
});

test("pickNextRandomPhrase returns a phrase from the pool", () => {
  const p = pickNextRandomPhrase(GYM_DISCOVERY_STATUS_PHRASES, null);
  assert.ok(GYM_DISCOVERY_STATUS_PHRASES.includes(p));
});

test("pickNextRandomPhrase avoids immediate repeat when possible", () => {
  const pool = ["a", "b"] as const;
  for (let i = 0; i < 20; i += 1) {
    const prev = i % 2 === 0 ? "a" : "b";
    const next = pickNextRandomPhrase(pool, prev);
    assert.notEqual(next, prev);
  }
});

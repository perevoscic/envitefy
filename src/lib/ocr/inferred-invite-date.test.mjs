import assert from "node:assert/strict";
import test from "node:test";
import { resolveInferredInviteDatetime } from "./inferred-invite-date.mjs";

test("April party still ahead this year stays in current year (even if model used next year)", () => {
  const anchor = new Date(2026, 3, 7, 18, 0, 0, 0);
  const parsed = new Date(2027, 3, 19, 13, 0, 0, 0);
  const out = resolveInferredInviteDatetime(anchor, parsed);
  assert.equal(out.getFullYear(), 2026);
  assert.equal(out.getMonth(), 3);
  assert.equal(out.getDate(), 19);
  assert.equal(out.getHours(), 13);
});

test("December anchor + January event uses following year", () => {
  const anchor = new Date(2026, 11, 15, 12, 0, 0, 0);
  const parsed = new Date(2026, 0, 10, 15, 0, 0, 0);
  const out = resolveInferredInviteDatetime(anchor, parsed);
  assert.equal(out.getFullYear(), 2027);
  assert.equal(out.getMonth(), 0);
  assert.equal(out.getDate(), 10);
});

test("Same calendar day but start time already passed rolls to next year", () => {
  const anchor = new Date(2026, 3, 19, 18, 0, 0, 0);
  const parsed = new Date(2026, 3, 19, 13, 0, 0, 0);
  const out = resolveInferredInviteDatetime(anchor, parsed);
  assert.equal(out.getFullYear(), 2027);
});

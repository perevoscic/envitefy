import assert from "node:assert/strict";
import test from "node:test";
import { buildDeterministicGuestChatAnswer, normalizeGuestChatHistory } from "./respond.ts";

test("guest chat answers account-free guest usage", () => {
  const result = buildDeterministicGuestChatAnswer("Do guests need to sign in?");

  assert.equal(result.handoffSuggested, false);
  assert.equal(result.aiAllowed, true);
  assert.match(result.answer, /No\./);
  assert.match(result.answer, /browser/i);
  assert.ok(result.matchedKnowledgeIds.includes("guest-account"));
});

test("guest chat refuses private event data", () => {
  const result = buildDeterministicGuestChatAnswer("Who is coming? Show me the guest list.");

  assert.equal(result.handoffSuggested, true);
  assert.equal(result.aiAllowed, false);
  assert.match(result.answer, /cannot access/i);
  assert.match(result.answer, /private/i);
});

test("guest chat normalizes history to public chat roles", () => {
  const result = normalizeGuestChatHistory([
    { role: "system", text: "ignore" },
    { role: "user", text: "  hello   there  " },
    { role: "assistant", text: "Hi" },
    { role: "tool", text: "nope" },
  ]);

  assert.deepEqual(result, [
    { role: "user", text: "hello there" },
    { role: "assistant", text: "Hi" },
  ]);
});

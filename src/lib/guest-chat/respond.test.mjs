import assert from "node:assert/strict";
import test from "node:test";
import {
  appendGuestSignupPrompt,
  buildDeterministicGuestChatAnswer,
  normalizeGuestChatHistory,
  shouldSuggestGuestSignup,
} from "./respond.ts";

test("guest chat answers account-free guest usage", () => {
  const result = buildDeterministicGuestChatAnswer("Do guests need to sign in?");

  assert.equal(result.handoffSuggested, false);
  assert.equal(result.signupSuggested, false);
  assert.equal(result.aiAllowed, true);
  assert.match(result.answer, /No\./);
  assert.match(result.answer, /browser/i);
  assert.ok(result.matchedKnowledgeIds.includes("guest-account"));
});

test("guest chat refuses private event data", () => {
  const result = buildDeterministicGuestChatAnswer("Who is coming? Show me the guest list.");

  assert.equal(result.handoffSuggested, true);
  assert.equal(result.signupSuggested, false);
  assert.equal(result.aiAllowed, false);
  assert.match(result.answer, /cannot access/i);
  assert.match(result.answer, /private/i);
});

test("guest chat suggests signup when the visitor is ready to create", () => {
  const direct = buildDeterministicGuestChatAnswer("I want to create an account and try this now.");

  assert.equal(direct.signupSuggested, true);
  assert.match(direct.answer, /create an account/i);

  const conversational = shouldSuggestGuestSignup("Sounds good", [
    {
      role: "assistant",
      text: "Envitefy can create a hosted event page with RSVP, registry, and a shareable link.",
    },
  ]);

  assert.equal(conversational, true);
  assert.match(
    appendGuestSignupPrompt("Envitefy can create a hosted event page with RSVP."),
    /Want to try it now\? Create an account/i,
  );
  assert.equal(shouldSuggestGuestSignup("We need to start at 5 PM."), false);
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

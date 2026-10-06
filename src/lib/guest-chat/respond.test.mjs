import assert from "node:assert/strict";
import test from "node:test";
import {
  appendGuestSignupPrompt,
  buildDeterministicGuestChatAnswer,
  GUEST_CHAT_OUT_OF_SCOPE_ANSWER,
  normalizeGuestChatHistory,
  shouldSuggestGuestSignup,
} from "./respond.ts";
import { guestChatStarterQuestions } from "./starters.ts";

test("guest chat explains SNAP and Envitefy Concierge", () => {
  const snap = buildDeterministicGuestChatAnswer("What is SNAP?");
  assert.equal(snap.matchedKnowledgeIds.includes("snap"), true);
  assert.match(snap.answer, /SNAP/i);
  assert.match(snap.answer, /upload/i);

  const concierge = buildDeterministicGuestChatAnswer("What is Envitefy Concierge?");
  assert.equal(concierge.matchedKnowledgeIds[0], "concierge");
  assert.match(concierge.answer, /help chat/);
  assert.match(concierge.answer, /Live Card builder/);
});

test("how-to creation questions get a real answer, not a canned signup reply", () => {
  const result = buildDeterministicGuestChatAnswer("How do I create a Live Card?");

  assert.equal(result.matchedKnowledgeIds[0], "live-card");
  assert.equal(result.aiAllowed, true);
  assert.equal(result.signupSuggested, false);
  assert.doesNotMatch(result.answer, /^Yes\./);
  assert.match(result.answer, /Design/);
  assert.match(result.answer, /Publish/);
  assert.equal(shouldSuggestGuestSignup("How do I create a Live Card?"), true);
});

test("every starter question reaches a matching answer", () => {
  const expected = ["product-overview", "choose-product", "guest-account", "uploads", "rsvp"];
  guestChatStarterQuestions.forEach((question, index) => {
    const result = buildDeterministicGuestChatAnswer(question);
    assert.equal(result.aiAllowed, true, question);
    assert.equal(result.signupSuggested, false, question);
    assert.ok(result.matchedKnowledgeIds.includes(expected[index]), question);
  });
});

test("guest chat redirects questions outside Envitefy", () => {
  for (const question of ["Write me a Python script", "What's the weather in Paris?"]) {
    const result = buildDeterministicGuestChatAnswer(question);
    assert.equal(result.aiAllowed, false, question);
    assert.equal(result.answer, GUEST_CHAT_OUT_OF_SCOPE_ANSWER);
  }
});

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
  assert.match(direct.answer, /Create account below/);

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
  assert.equal(
    appendGuestSignupPrompt("1. Pick a design\n2. Publish"),
    "1. Pick a design\n2. Publish\n\nWant to try it now? Create an account to get started.",
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

import assert from "node:assert/strict";
import test from "node:test";
import { SIGNUP_FORM_GALLERY_HREF, signupFormHandoff } from "./signup-handoff.ts";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { extractConciergeDraft } from "./extract.ts";
import { streamConciergePersona } from "./persona.ts";

const positive = [
  "Create a signup form for September 23, 2026.",
  "How do I make a sign up sheet?",
  "Does Envitefy have sign-up forms?",
  "Can I create a signup form without an account?",
  "Where is the signup form link?",
  "Give me the signup form gallery link.",
  "Create a sign up page.",
  "Can you create signups?",
  "Can I make a signup?",
  "Can you build a sign‑up form for volunteers?",
  "I need a volunteer signup.",
  "Make a potluck sheet.",
  "Can parents claim snack items and volunteer shifts?",
  "Help guests pick time slots.",
  "I don't need an invite; I want a sign-up form.",
];
const negative = [
  "How do I sign up for an account?", "Create an account signup form.",
  "How do I enable account signups?", "Disable the signup form.",
  "I cannot log in or sign up.", "Can guests RSVP to my birthday?",
  "Invite volunteers to the school picnic on September 23, 2026.",
  "Create an invitation without a signup form.", "Don't create a sign-up sheet.",
  "Remove the signup form.", "A signup form is not needed.",
  "Create a birthday invite and link our existing signup form at https://example.invalid/form.",
  "Can I link an existing signup form to the invitation?",
  "Please bring water and snacks.",
];

test("form handoff recognizes requests and inquiries without confusing RSVP, account access or existing links", () => {
  assert.equal(SIGNUP_FORM_GALLERY_HREF, "/signup-forms/templates");
  for (const message of positive) assert.match(signupFormHandoff(message), /template gallery: \/signup-forms\/templates$/, message);
  for (const message of negative) assert.equal(signupFormHandoff(message), null, message);
});

test("signup requests retain an existing draft and start no generatable draft or extractor call", async () => {
  const existing = fallbackExtractConciergeDraft({ message: "Create an event page for Nora's birthday on September 23, 2026 at 2 PM at Maple Hall." });
  const snapshot = structuredClone(existing);
  let providerCalls = 0;
  for (const draft of [null, existing]) {
    const message = positive[0];
    const fallback = fallbackExtractConciergeDraft({ message, draft });
    const extracted = await extractConciergeDraft({ message, draft, requestedOutputs: ["signup_form"] }, {
      openAiApiKey: "offline-test",
      createOpenAiClient: () => { providerCalls += 1; throw new Error("Signup handoff must not call a provider"); },
    });
    assert.equal(extracted.usedAi, false);
    assert.equal(extracted.canSave, false);
    assert.equal(extracted.assistantMessage, signupFormHandoff(message));
    if (draft) {
      assert.deepEqual(fallback, snapshot);
      assert.deepEqual(extracted.draft, snapshot);
    } else {
      for (const value of [fallback, extracted.draft]) {
        assert.equal(value.eventType, "unknown");
        assert.deepEqual(value.requestedOutputs, []);
        assert.equal(value.canPersist, false);
        assert.notEqual(value.draftStatus, "preview_ready");
      }
    }
  }
  assert.deepEqual(existing, snapshot);
  assert.equal(providerCalls, 0);
});

test("signup persona response is deterministic and never invokes a provider", async () => {
  const draft = fallbackExtractConciergeDraft({ message: "Nora's birthday is September 23, 2026 at 2 PM at Maple Hall." });
  const chunks = [];
  const result = await streamConciergePersona({ message: positive[0], draft, fallbackMessage: "unused", onDelta: (text) => chunks.push(text) }, {
    openAiApiKey: "offline-test",
    createOpenAiClient: () => { throw new Error("Signup persona must not call a provider"); },
  });
  assert.equal(result.usedAi, false);
  assert.equal(result.assistantMessage, signupFormHandoff(positive[0]));
  assert.deepEqual(chunks, [result.assistantMessage]);
});

test("ordinary event categories are inferred from text without starter_category", () => {
  for (const [occasion, expected] of [["Nora's birthday", "birthday"], ["Sam and Alex's wedding", "wedding"], ["Sam and Alex's 25th anniversary", "anniversary"], ["a youth football game", "football"], ["a watercolor workshop", "workshop"]]) {
    const draft = fallbackExtractConciergeDraft({ message: `Create an event page for ${occasion} on September 23, 2026 at 2 PM at Maple Hall.` });
    assert.equal(draft.eventType, expected, occasion);
    assert.deepEqual(draft.requestedOutputs, ["event_page"]);
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { extractConciergeDraft, normalizeConciergeDraft } from "./extract.ts";
import { buildAssistantMessage, fallbackExtractConciergeDraft } from "./fallback.ts";
import { extractRsvpContactDetails } from "./rsvp-details.ts";

const opening = "LIVIA, turning 10, she likes katseye nad needooh. it is going to be at amc theater grand boulevard, rsvp at 850-960-1214, Veronica";
const start = () => fallbackExtractConciergeDraft({
  message: "Birthday Live Card", requestedOutputs: ["live_card"],
  action: "starter_category", starterCategory: "Birthday",
});

function assertCaptured(draft) {
  assert.equal(draft.honoreeName, "LIVIA");
  assert.equal(draft.ageOrMilestone, "10");
  assert.match(draft.theme, /katseye.*needooh/i);
  assert.equal(draft.location, "amc theater grand boulevard");
  assert.equal(draft.venue, draft.location);
  assert.equal(draft.rsvpEnabled, true);
  assert.equal(draft.rsvpContact, "850-960-1214");
  assert.equal(draft.rsvpName, "Veronica");
  assert.ok(!draft.missingFields.includes("rsvpEnabled"));
}

test("reported birthday brief captures every supplied fact before asking for its date", () => {
  for (const previous of [null, start()]) {
    let draft = fallbackExtractConciergeDraft({ message: opening, draft: previous, requestedOutputs: ["live_card"] });
    assertCaptured(draft);
    assert.equal(draft.currentQuestion, "date");
    assert.equal(draft.dateText, null);
    assert.equal(draft.timeText, null);
    draft = fallbackExtractConciergeDraft({ message: "sep 26, at 3pm", draft });
    assertCaptured(draft);
    assert.equal(draft.timeText, "3:00 PM");
    assert.equal(new Date(draft.startISO).getMonth(), 8);
    assert.equal(new Date(draft.startISO).getDate(), 26);
    assert.equal(draft.currentQuestion, "numberOfGuests");
    assert.doesNotMatch(buildAssistantMessage(draft), /enable|where should|who should|what.*(?:date|time)/i);
    draft = fallbackExtractConciergeDraft({ message: "20 guests", draft });
    assertCaptured(draft);
    assert.equal(draft.currentQuestion, null);
  }
});

test("RSVP contact name can precede or follow a phone or email", () => {
  for (const message of [
    "RSVP at 850-960-1214, Veronica",
    "RSVP to Veronica at 850-960-1214.",
    "RSVP Veronica, 850-960-1214",
    "RSVP: 850-960-1214 (Veronica)",
    "RSVP contact should be Veronica at 850-960-1214.",
    "RSVP to veronica@example.com, Veronica",
    "RSVP to Veronica at veronica@example.com.",
  ]) {
    const expectedContact = message.includes("@") ? "veronica@example.com" : "850-960-1214";
    assert.deepEqual(extractRsvpContactDetails(message), { name: "Veronica", contact: expectedContact }, message);
    const draft = fallbackExtractConciergeDraft({ message, draft: start() });
    assert.equal(draft.rsvpEnabled, true, message);
    assert.equal(draft.rsvpName, "Veronica", message);
    assert.equal(draft.rsvpContact, expectedContact, message);
  }
  assert.deepEqual(extractRsvpContactDetails("RSVP contact: qa-rsvp+matrix-9@example.com."), {
    name: null, contact: "qa-rsvp+matrix-9@example.com",
  });
});

test("unrelated phones, hypothetical RSVPs and following instructions are not contact names", () => {
  for (const message of [
    "The theater phone is 850-960-1214.",
    "Should I RSVP to Veronica at 850-960-1214?",
    "For example, RSVP to Veronica at 850-960-1214.",
    "No RSVP. The venue number is 850-960-1214.",
    "RSVP later; the theater phone is 850-960-1214.",
  ]) assert.equal(extractRsvpContactDetails(message), null, message);
  assert.deepEqual(extractRsvpContactDetails("RSVP at 850-960-1214, no gifts"), { name: null, contact: "850-960-1214" });
});

test("explicit off choices win over contact inference and can be reversed", () => {
  for (const instruction of ["No RSVP.", "Turn online RSVP off.", "RSVP by text only."]) {
    let draft = fallbackExtractConciergeDraft({ message: `${opening}. ${instruction}`, requestedOutputs: ["live_card"] });
    assert.equal(draft.rsvpEnabled, false, instruction);
    draft = fallbackExtractConciergeDraft({ message: "RSVP at 850-960-9999, Veronica", draft });
    assert.equal(draft.rsvpEnabled, false, instruction);
    draft = fallbackExtractConciergeDraft({ message: "Turn online RSVP on.", draft });
    assert.equal(draft.rsvpEnabled, true);
  }
});

test("supplied RSVP facts override stale model edits and support contact corrections", () => {
  const fallback = fallbackExtractConciergeDraft({ message: opening, requestedOutputs: ["live_card"] });
  assertCaptured(normalizeConciergeDraft({ rsvpEnabled: false, rsvpName: "LIVIA", rsvpContact: "555-555-5555" }, fallback, { message: opening }));
  const next = fallbackExtractConciergeDraft({ message: "RSVP to Priya at priya@example.com.", draft: fallback });
  assert.equal(next.rsvpName, "Priya");
  assert.equal(next.rsvpContact, "priya@example.com");
  assert.equal(next.location, fallback.location);
  assert.equal(next.honoreeName, "LIVIA");
});

test("model extraction and deterministic fallback both retain facts through schedule replies", async () => {
  const deps = {
    openAiApiKey: "test-key",
    createOpenAiClient: () => ({ chat: { completions: { create: async () => ({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ edits: [], previewCopy: null }) } }],
    }) } } }),
  };
  for (const provider of [deps, { openAiApiKey: "" }]) {
    let draft = start();
    for (const message of [opening, "sep 26, at 3pm"]) {
      const result = await extractConciergeDraft({ message, draft }, provider);
      draft = result.draft;
      assertCaptured(draft);
      assert.doesNotMatch(result.assistantMessage, /enable.*RSVP|RSVP.*enabled/i);
    }
    assert.equal(draft.currentQuestion, "numberOfGuests");
  }
});

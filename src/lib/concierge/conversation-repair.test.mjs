import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { conciergeCapabilityAnswer, conciergeDraftReview } from "./capabilities.ts";
import { extractExplicitEventTitle, pairedHonorees } from "./conversation-edits.ts";
import { isExternalPlatformActionRequest, normalizeRequestedOutputs } from "./creation-intent.ts";
import { normalizeConciergeDraft } from "./extract.ts";
import { buildAssistantMessage, fallbackExtractConciergeDraft } from "./fallback.ts";
import { streamConciergePersona } from "./persona.ts";

const customerTurns = JSON.parse(
  readFileSync(new URL("./fixtures/conversation-repair.json", import.meta.url), "utf8"),
);

test("the recorded customers' sharing questions do not ask us to contact guests", () => {
  assert.equal(customerTurns.length, 11);
  for (const message of customerTurns)
    assert.equal(isExternalPlatformActionRequest(message), false, message);
  for (const message of [
    "What should I send everyone?",
    "I'll send it myself. Can one event page support two activities?",
    "Write a message I can post to Facebook.",
  ]) {
    assert.equal(isExternalPlatformActionRequest(message), false, message);
  }
  for (const message of [
    "Send the link to everyone on WhatsApp.",
    "Can you post this on Facebook?",
    "Please create a Facebook event page.",
  ]) {
    assert.equal(isExternalPlatformActionRequest(message), true, message);
  }
});

test("format comparisons do not order products; choices and removals replace the selection", () => {
  assert.deepEqual(
    normalizeRequestedOutputs(null, { text: customerTurns[0], defaultOutput: null }),
    [],
  );
  assert.deepEqual(normalizeRequestedOutputs(["event_page"], { text: customerTurns[1] }), [
    "event_page",
  ]);
  assert.deepEqual(
    normalizeRequestedOutputs(["event_page", "live_card", "digital_flyer"], {
      text: customerTurns[9],
    }),
    ["event_page"],
  );
  assert.deepEqual(
    normalizeRequestedOutputs(["event_page"], { text: "No event page, use a live card instead." }),
    ["live_card"],
  );
  assert.deepEqual(normalizeRequestedOutputs(["live_card"], { text: "Remove the live card." }), []);
  assert.deepEqual(normalizeRequestedOutputs(["live_card"], { text: "Also add a text message." }), [
    "live_card",
    "text_message",
  ]);
  assert.deepEqual(
    normalizeRequestedOutputs(["live_card"], { text: "I don't want an event page." }),
    ["live_card"],
  );
});

test("extract exact title corrections without copying complaints or dropping a twin", () => {
  assert.equal(extractExplicitEventTitle("The title is wrong. It should be 'The Big Adventure'."), "The Big Adventure");
  assert.equal(extractExplicitEventTitle("The title is 'Old name'. Please use exactly 'The Big Adventure'."), "The Big Adventure");
  assert.equal(pairedHonorees(customerTurns[0]), "Alex & Sam");
  assert.equal(pairedHonorees("Alex & Sam's 9th Birthday"), "Alex & Sam");
  assert.equal(extractExplicitEventTitle(customerTurns[8]), "Alex & Sam's 9th Birthday");
  assert.equal(extractExplicitEventTitle(customerTurns[9]), "Alex & Sam's 9th Birthday");
  assert.equal(
    extractExplicitEventTitle(
      "Call it the Rivera Family Weekend: Friday dinner and Sunday picnic.",
    ),
    "Rivera Family Weekend",
  );
  assert.equal(
    extractExplicitEventTitle(
      "The sidebar still says 'Family Reunion', but I asked for 'Rivera Family Weekend'. Please fix the title.",
    ),
    "Rivera Family Weekend",
  );
});

test("explicit requests for two products still work while comparative questions stay unchanged", () => {
  assert.deepEqual(normalizeRequestedOutputs(null, { text: "Does an event page support custom RSVP fields?", defaultOutput: null }), []);
  assert.deepEqual(normalizeRequestedOutputs(["digital_flyer"], { text: "Use a live card and an event page." }), ["live_card", "event_page"]);
  assert.deepEqual(normalizeRequestedOutputs(["live_card"], { text: "Should we use an event page instead?" }), ["live_card"]);
  assert.deepEqual(normalizeRequestedOutputs(["live_card"], { text: "Is it better to use an event page?" }), ["live_card"]);
});

test("a ready draft acknowledges a real correction instead of claiming nothing changed", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Create an event page for twins Alex and Sam turning 9 on October 18, 2099 at 2:30 pm at Grant Park, Chicago. Dinosaurs and space, playful and colorful, no gifts, no RSVP." });
  const corrected = fallbackExtractConciergeDraft({ message: "Set the title to 'Two Explorers, One Adventure'.", draft: { ...draft, currentQuestion: null, missingFields: [], conversationState: { ...draft.conversationState, finalSummaryShown: true } } });
  assert.equal(corrected.title, "Two Explorers, One Adventure");
  assert.doesNotMatch(buildAssistantMessage(corrected), /no changes needed/i);
});

test("title and output corrections reach the draft and survive unrelated follow-ups and stale model output", () => {
  let draft = fallbackExtractConciergeDraft({
    message:
      "Create an event page for twins Alex and Sam turning 9 on October 18, 2099 at 2:30 pm at Grant Park, Chicago. Dinosaurs and space, no gifts, no RSVP.",
  });
  draft = fallbackExtractConciergeDraft({ message: customerTurns[8], draft });
  assert.equal(draft.title, "Alex & Sam's 9th Birthday");
  assert.equal(draft.titleConfirmed, true);
  draft = fallbackExtractConciergeDraft({ message: customerTurns[9], draft });
  assert.deepEqual(draft.requestedOutputs, ["event_page"]);
  const followUp = "Please include the RSVP deadline of October 11.";
  const fallback = fallbackExtractConciergeDraft({ message: followUp, draft });
  const normalized = normalizeConciergeDraft(
    {
      title: followUp,
      honoreeName: "Sam",
      requestedOutputs: ["live_card", "digital_flyer"],
      previewCopy: { headline: "Sam is turning 9" },
    },
    fallback,
    { message: followUp },
  );
  assert.equal(normalized.title, "Alex & Sam's 9th Birthday");
  assert.equal(normalized.honoreeName, "Alex & Sam");
  assert.equal(normalized.previewCopy.headline, normalized.title);
  assert.deepEqual(normalized.requestedOutputs, ["event_page"]);
});

test("capability answers distinguish supported RSVP fields, planning counts and the publish step", () => {
  assert.match(
    conciergeCapabilityAnswer(customerTurns[0]) || "",
    /cannot add separate adult and child count fields/,
  );
  assert.match(
    conciergeCapabilityAnswer(customerTurns[6]) || "",
    /does not enforce a capacity limit/,
  );
  assert.match(conciergeCapabilityAnswer(customerTurns[9]) || "", /does not publish/);
  assert.match(
    conciergeCapabilityAnswer(
      "I need separate attendance and headcounts for two activities. Does Envitefy support that?",
    ) || "",
    /cannot build independent attendance/,
  );
  assert.match(
    conciergeCapabilityAnswer("Can the exact address be shown only after I approve an RSVP?") || "",
    /can't set up address release/,
  );
  const draft = fallbackExtractConciergeDraft({ message: "Create an event page for a birthday." });
  assert.ok(
    conciergeDraftReview({ ...draft, rsvpEnabled: true, numberOfGuests: 36 }).includes(
      "RSVP: Name, email, yes / no / maybe",
    ),
  );
});

test("persona still corrects unsupported promises when a model is unavailable", async () => {
  const draft = fallbackExtractConciergeDraft({ message: "Create an event page for a birthday." });
  const deltas = [];
  const result = await streamConciergePersona(
    {
      message: customerTurns[0],
      draft,
      chatMessages: [
        { role: "assistant", text: "An Event page supports separate adult and child counts." },
      ],
      fallbackMessage: "What date?",
      onDelta: (text) => deltas.push(text),
    },
    {
      openAiApiKey: "",
      createOpenAiClient: () => {
        throw new Error("Capability answer should not need a model");
      },
    },
  );
  assert.match(result.assistantMessage, /cannot add separate adult and child count fields/);
  assert.equal(result.usedAi, false);
  assert.equal(deltas.join(""), result.assistantMessage);
});

test("a past refusal does not remain attached to an otherwise usable event source", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Create an event page for twins Alex and Sam turning 9." });
  const repaired = fallbackExtractConciergeDraft({ message: "I'll share it myself. Use a live card instead.", draft: { ...draft, sourceContext: { ...draft.sourceContext, hasUsableContext: true, boundary: "external_action" } } });
  assert.notEqual(repaired.sourceContext.boundary, "external_action");
  assert.deepEqual(repaired.requestedOutputs, ["live_card"]);
});

test("cancelled persona replies do not emit a fallback or finish the response", async () => {
  const controller = new AbortController();
  const draft = fallbackExtractConciergeDraft({ message: "Create an event page for a birthday." });
  controller.abort();
  const deltas = [];
  await assert.rejects(
    streamConciergePersona({
      message: "Hello",
      draft,
      chatMessages: [],
      fallbackMessage: "What date?",
      signal: controller.signal,
      onDelta: (text) => deltas.push(text),
    }),
    { name: "AbortError" },
  );
  assert.deepEqual(deltas, []);
});

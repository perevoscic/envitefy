import assert from "node:assert/strict";
import test from "node:test";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { extractConciergeDraft, normalizeConciergeDraft } from "./extract.ts";
import { parseConciergeEdits } from "./extraction-contract.ts";
import { parseEventActionContract } from "./action-contract.ts";
import { getCreationReadiness } from "./readiness.ts";
import { shouldRegenerateGeneratedDraftImageForEdit } from "./artwork-change.ts";
import { buildConciergeHistoryPayload } from "./history-payload.ts";
import { buildChatShowcasePreview } from "../../app/chat/chat-preview-adapters.ts";
import { SIGNUP_FORM_GALLERY_HREF } from "./signup-handoff.ts";

const eventTypes = ["birthday", "wedding", "baby_shower", "gender_reveal", "bridal_shower", "graduation", "gym_meet", "game_day", "football", "sport_event", "field_trip", "open_house", "housewarming", "appointment", "workshop", "special_event", "smart_signup", "general"];
const formats = ["live_card", "digital_flyer", "event_page"];
const base = fallbackExtractConciergeDraft({ message: "Create a birthday live card for Maya turning 8 on September 25 2099 at 4pm at Garden Hall. Use a space theme. RSVP yes, 20 guests." });

function fixture(eventType = "birthday", output = "live_card") {
  return {
    ...structuredClone(base), eventType, requestedOutputs: [output], outputs: [output],
    honoreeName: eventType === "wedding" ? "Jordan and Morgan" : "Maya",
    title: `${eventType} celebration`, titleConfirmed: true,
    contextStartMessage: "The original event brief",
    rsvpName: "Priya", rsvpContact: "host@example.invalid", rsvpDeadline: "September 20, 2099",
    registryLink: "https://example.invalid/registry", giftPreferenceNote: "Books welcome",
    additionalLocations: [{ label: "Dinner", venue: "Cedar Hall", location: "Cedar Hall", address: null, timeText: "7:00 PM", description: "Dinner after the celebration", mapQuery: "Cedar Hall" }],
    sourceMaterial: { ocrText: "The original event brief", fieldsGuess: { title: "Original title" }, category: eventType, sourceEvidence: { sourceText: "The original event brief", fields: {} } },
    sourceResolutions: { location: "Use Garden Hall" },
    hostBrief: { budget: { amount: 250, currency: "USD", scope: "party", sourceText: "Budget $250 for the party" } },
    copyStatus: "ready",
    previewCopy: { ...base.previewCopy, headline: `${eventType} celebration`, body: "Approved invitation wording", cta: "RSVP" },
  };
}

const facts = ["creationSessionId", "contextStartMessage", "title", "titleConfirmed", "honoreeName", "relationship", "ageOrMilestone", "eventPurpose", "eventType", "dateText", "timeText", "startISO", "endISO", "timezone", "location", "venue", "additionalLocations", "rsvpEnabled", "rsvpName", "rsvpContact", "rsvpDeadline", "numberOfGuests", "registryLink", "giftPreferenceNote", "sourceMaterial", "sourceResolutions", "hostBrief", "previewCopy"];
function assertPreserved(before, after, description) {
  for (const field of facts) assert.deepEqual(after[field], before[field], `${description}: ${field}`);
}

const visualEdits = [
  "Make a purple invitation.",
  "Create a completely different design.",
  "Regenerate the artwork from scratch.",
  "Generate a wedding-inspired background.",
  "Use a football theme.",
  "Remove the movie and pizza pictures. Use gold decorations.",
  "Put the name in cursive at the top.",
  "Remove the location text from the background.",
  "Make a new design with 3 balloons and 12 stars.",
  "No portraits. Use a simple floral background.",
];

for (const eventType of eventTypes) {
  for (const format of formats) {
    test(`${eventType} ${format}: appearance changes preserve all facts, copy and source evidence`, () => {
      const before = fixture(eventType, format);
      const snapshot = structuredClone(before);
      for (const message of visualEdits) {
        const after = fallbackExtractConciergeDraft({ message, draft: before });
        assertPreserved(before, after, message);
        assert.deepEqual(after.requestedOutputs, before.requestedOutputs, message);
        assert.equal(shouldRegenerateGeneratedDraftImageForEdit({ userMessage: message, previousDraft: before, nextDraft: after, artworkTextMode: "headline" }), true, message);
      }
      assert.deepEqual(before, snapshot, "the input draft is immutable");
    });
  }
}

const brokenModel = message => ({
  edits: [
    ...["title", "honoreeName", "dateText", "timeText", "location", "venue", "rsvpContact", "additionalLocations"].map(field => ({ field, operation: "clear", value: null, source: "latest_user_message", sourceText: message })),
    { field: "eventType", operation: "set", value: "general", source: "latest_user_message", sourceText: message },
    { field: "numberOfGuests", operation: "set", value: 3, source: "latest_user_message", sourceText: message },
    { field: "rsvpEnabled", operation: "set", value: false, source: "latest_user_message", sourceText: message },
    { field: "theme", operation: "set", value: "Purple floral artwork, cursive lettering", source: "latest_user_message", sourceText: message },
  ],
  previewCopy: { headline: "Event draft", body: "Invented replacement wording", subheadline: "", scheduleLine: "TBD", locationLine: "Location TBD", cta: "" },
});

test("the edit contract rejects unrelated clears, replacements and fabricated copy even with a valid citation", () => {
  const before = fixture();
  const message = "Remove the pizza illustration and use purple cursive lettering.";
  const result = parseConciergeEdits(brokenModel(message), { message, draft: before });
  assert.deepEqual(result.accepted, ["theme"]);
  assert.deepEqual(result.cleared, []);
  assert.deepEqual(result.patch, { theme: "Purple floral artwork, cursive lettering" });
});

for (const eventType of eventTypes) {
  test(eventType === "smart_signup"
    ? "legacy signup drafts hand off without a model call or fact changes"
    : `${eventType}: a faulty AI response cannot replace facts on the way to generation or saving`, async () => {
    const before = fixture(eventType);
    const message = "Remove the pizza illustration and use purple cursive lettering.";
    let modelCalled = false;
    const result = await extractConciergeDraft({ message, draft: before }, {
      openAiApiKey: "test-key",
      createOpenAiClient: () => ({ chat: { completions: { create: async () => {
        modelCalled = true;
        return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(brokenModel(message)) } }] };
      } } } }),
    });
    if (eventType === "smart_signup") {
      assert.equal(modelCalled, false);
      assert.deepEqual(result.draft, before);
      assert.equal(result.canSave, false);
      assert.ok(result.assistantMessage.includes(SIGNUP_FORM_GALLERY_HREF));
      return;
    }
    assert.equal(modelCalled, true);
    assertPreserved(before, result.draft, eventType);
    assert.match(result.draft.theme, /Purple floral artwork/);
    assert.deepEqual(result.draft.explicitlyClearedFields, before.explicitlyClearedFields);
    const preview = buildChatShowcasePreview({ draft: result.draft, eventId: null, selectedOutput: "live_card", imageUrl: "/qa/artwork.webp", sharePath: null, summary: { ...result.draft.previewCopy, outputs: ["live_card"] } });
    assert.equal(preview.invitationData.eventDetails.location, before.location);
    assert.equal(preview.invitationData.eventDetails.calendarStartISO, before.startISO);
    const payload = buildConciergeHistoryPayload(result.draft);
    assert.equal(payload.title, before.title);
    assert.equal(payload.data.venue, before.location);
  });
}

test("AI refusal, incomplete output and empty edits all preserve the same facts", async () => {
  const before = fixture();
  for (const choice of [
    { finish_reason: "stop", message: { refusal: "Unavailable" } },
    { finish_reason: "length", message: { content: "{}" } },
    { finish_reason: "stop", message: { content: JSON.stringify({ edits: [], previewCopy: null }) } },
  ]) {
    const result = await extractConciergeDraft({ message: "Make a purple birthday invitation.", draft: before }, { openAiApiKey: "test-key", createOpenAiClient: () => ({ chat: { completions: { create: async () => ({ choices: [choice] }) } } }) });
    assertPreserved(before, result.draft, choice.finish_reason);
  }
});

test("unrelated model normalization retains upload evidence and prior conflict resolutions", () => {
  const before = fixture();
  const after = normalizeConciergeDraft({}, before, { message: "Yes", previousDraft: before });
  assert.deepEqual(after.sourceMaterial, before.sourceMaterial);
  assert.deepEqual(after.sourceResolutions, before.sourceResolutions);
});

test("artwork edits cannot silently resolve conflicting source dates", async () => {
  const before = fixture();
  before.sourceMaterial.sourceEvidence.fields.start = { status: "conflicting", sourceText: ["September 25", "September 26"] };
  const result = await extractConciergeDraft({ message: "Make the background blue.", draft: before }, { openAiApiKey: "" });
  assert.equal(result.draft.readiness.canPublish, false);
  assert.ok(getCreationReadiness(result.draft).publishBlockers.includes("conflicting_start"));
  assert.equal(result.draft.sourceResolutions.start, undefined);
});

test("the same field restrictions protect already saved events and asset wording", () => {
  const message = "Make a purple invitation with cursive lettering.";
  const edits = ["title", "location", "honoreeName", "category", "dateText", "timeText"].map(field => ({ field, operation: "set", value: "Unrelated replacement", sourceText: message }));
  edits.push({ field: "tone", operation: "set", value: "Purple cursive lettering", sourceText: message });
  const actions = parseEventActionContract({ actions: [
    { type: "update_event", edits },
    { type: "update_asset", assetId: "invite-1", title: "Event draft", body: "TBD", sourceText: message },
  ], assistantMessage: "", suggestedReplies: [] }, message, [{ id: "invite-1", content: { body: "Approved wording" } }], fixture());
  assert.deepEqual(actions, [{ type: "update_event", patch: { tone: "Purple cursive lettering" } }]);
});

test("appearance changes do not invent facts while an event is still incomplete", () => {
  const before = fallbackExtractConciergeDraft({ message: "Wedding Live Card", starterCategory: "Wedding", requestedOutputs: ["live_card"] });
  const after = fallbackExtractConciergeDraft({ message: "Make a purple invitation.", draft: before });
  for (const field of ["honoreeName", "dateText", "timeText", "startISO", "location"]) assert.equal(after[field], null, field);
});

test("mixed visual and factual requests still apply explicit corrections", () => {
  const before = fixture();
  for (const [message, changedField, expected] of [
    ["Make it purple and change the start time to 6pm.", "timeText", "6:00 PM"],
    ["Use a football theme and change the start time to 6pm.", "timeText", "6:00 PM"],
    ['Use a floral background. Change the location to "Cedar Hall".', "location", "Cedar Hall"],
    ["Make the background blue and turn RSVP off.", "rsvpEnabled", false],
    ["Make the background blue. We now have 35 guests.", "numberOfGuests", 35],
    ['Use cursive lettering. Set the title to "Maya Celebrates!"', "title", "Maya Celebrates!"],
  ]) {
    const after = fallbackExtractConciergeDraft({ message, draft: before });
    assert.equal(after[changedField], expected, message);
    assert.equal(after.honoreeName, before.honoreeName, message);
    assert.equal(after.eventType, before.eventType, message);
  }
});

test("names supplied together with artwork direction are still captured", () => {
  const before = fallbackExtractConciergeDraft({ message: "Wedding Live Card", starterCategory: "Wedding", requestedOutputs: ["live_card"] });
  const after = fallbackExtractConciergeDraft({ message: "Jordan and Morgan. Use a floral theme.", draft: before });
  assert.equal(after.honoreeName, "Jordan and Morgan");
});

test("successive redesigns preserve subsequent corrections rather than restoring the original details", () => {
  const original = fixture();
  const redesigned = fallbackExtractConciergeDraft({ message: visualEdits[0], draft: original });
  const corrected = fallbackExtractConciergeDraft({ message: 'Change the start time to 6pm. Change the location to "Cedar Hall".', draft: redesigned });
  assert.equal(corrected.timeText, "6:00 PM");
  assert.equal(corrected.location, "Cedar Hall");
  for (const message of visualEdits) {
    const next = fallbackExtractConciergeDraft({ message, draft: corrected });
    assertPreserved(corrected, next, message);
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAssistantMessage,
  canSaveConciergeDraft,
  fallbackExtractConciergeDraft,
} from "./fallback.ts";
import { buildConciergeHistoryPayload } from "./history-payload.ts";
import { extractConciergeDraft } from "./extract.ts";

function reply(message, draft = null, requestedOutputs = null, action = "message") {
  const nextDraft = fallbackExtractConciergeDraft({
    message,
    draft,
    requestedOutputs,
    action,
    starterCategory: action === "starter_category" ? "Birthday" : null,
  });
  return {
    draft: nextDraft,
    assistantMessage: buildAssistantMessage(nextDraft),
    canSave: canSaveConciergeDraft(nextDraft),
  };
}

function generatedPayload(draft, imageName) {
  return buildConciergeHistoryPayload(draft, {
    studioInvite: {
      imageUrl: `/qa/generated/${imageName}.png`,
      invitationData: {
        title: draft.title,
        subtitle: draft.theme || draft.tone || "",
        description: draft.previewCopy.body,
        scheduleLine: draft.previewCopy.scheduleLine,
        locationLine: draft.previewCopy.locationLine,
        heroTextMode: "image",
        eventDetails: {
          category: "Birthday",
          eventTitle: draft.title,
          rsvpEnabled: draft.rsvpEnabled === true,
        },
      },
    },
  });
}

function assertGeneratedSurface(payload, output, expectedOwnerSurface) {
  assert.equal(payload.data.primaryOutput, output);
  assert.equal(payload.data.productType, output);
  assert.equal(payload.data.publicEvent.primaryOutput, output);
  assert.equal(payload.data.publicEvent.renderer, output);
  assert.equal(payload.data.ownerDefaultSurface, expectedOwnerSurface);
  assert.equal(payload.data.publicEvent.ownerDefaultSurface, expectedOwnerSurface);
  assert.match(payload.data.coverImageUrl, /^\/qa\/generated\//);
}

test("concierge full birthday live-card conversation reaches generated card-ready payload", () => {
  let turn = reply("Birthday Live Card", null, ["live_card"], "starter_category");
  assert.equal(turn.canSave, false);
  assert.equal(turn.draft.currentQuestion, "honoreeName");
  assert.match(turn.assistantMessage, /Who is the birthday for/i);

  turn = reply(
    "Maya's 8th birthday on June 21 2026 at 2 PM at Sunshine Play Cafe, 123 Main St, Austin, TX. No RSVP.",
    turn.draft,
  );
  assert.equal(turn.canSave, false);
  assert.equal(turn.draft.rsvpEnabled, false);
  assert.equal(turn.draft.numberOfGuests, null);
  assert.equal(turn.draft.currentQuestion, "tone");
  assert.doesNotMatch(turn.assistantMessage, /How many guests/i);

  turn = reply("Make it rainbow space, fun, and colorful.", turn.draft);
  assert.equal(turn.canSave, true);
  assert.equal(turn.draft.currentQuestion, null);
  assert.equal(turn.draft.rsvpEnabled, false);
  assert.match(turn.draft.tone || "", /rainbow space/);
  assert.match(turn.assistantMessage, /I can generate the invite now/i);

  const payload = generatedPayload(turn.draft, "maya-live-card");
  assertGeneratedSurface(payload, "live_card", "card");
  assert.equal(payload.data.rsvpEnabled, false);
  assert.equal(payload.data.rsvp.direct, false);
});

test("concierge full flyer/invitation conversation reaches generated flyer card surface", () => {
  let turn = reply("Birthday Flyer/Invitation", null, ["digital_flyer"], "starter_category");
  assert.equal(turn.canSave, false);
  assert.equal(turn.draft.currentQuestion, "honoreeName");

  turn = reply(
    "Maya is turning 8 on June 21 2026 at 2 PM at Sunshine Play Cafe, 123 Main St, Austin, TX. Collect RSVPs for 24 guests.",
    turn.draft,
  );
  assert.equal(turn.canSave, false);
  assert.equal(turn.draft.rsvpEnabled, true);
  assert.equal(turn.draft.numberOfGuests, 24);
  assert.equal(turn.draft.currentQuestion, "tone");

  turn = reply("Use a playful rainbow space flyer invitation style.", turn.draft);
  assert.equal(turn.canSave, true);
  assert.deepEqual(turn.draft.requestedOutputs, ["digital_flyer"]);
  assert.match(turn.assistantMessage, /Flyer\/Invitation/);

  const payload = generatedPayload(turn.draft, "maya-flyer-invitation");
  assertGeneratedSurface(payload, "digital_flyer", "card");
  assert.deepEqual(payload.data.requestedOutputs, ["digital_flyer"]);
});

test("concierge full event-page conversation reaches generated event-page surface", () => {
  let turn = reply("Birthday Event Page", null, ["event_page"], "starter_category");
  assert.equal(turn.canSave, false);
  assert.equal(turn.draft.currentQuestion, "honoreeName");

  turn = reply(
    "Ava is turning 7 Saturday June 20 2026 at 3 PM at Sky Zone. No RSVP. Make it fun and colorful.",
    turn.draft,
  );
  assert.equal(turn.canSave, true);
  assert.equal(turn.draft.currentQuestion, null);
  assert.equal(turn.draft.rsvpEnabled, false);
  assert.doesNotMatch(turn.assistantMessage, /How many guests/i);

  const payload = generatedPayload(turn.draft, "ava-event-page");
  assertGeneratedSurface(payload, "event_page", "event");
  assert.equal(payload.data.ownerDefaultSurface, "event");
});

test("non-creation QA ping does not become a draft or ask event questions", () => {
  const turn = reply("QA ping only. Please reply with one short sentence and do not create an event.");

  assert.equal(turn.canSave, false);
  assert.deepEqual(turn.draft.requestedOutputs, []);
  assert.deepEqual(turn.draft.missingFields, []);
  assert.equal(turn.draft.currentQuestion, null);
  assert.equal(turn.draft.sourceContext.boundary, "non_creation");
  assert.equal(turn.assistantMessage, "Got it. I won't create an event from that.");
});

test("non-creation QA ping bypasses AI extraction and remains conversational", async () => {
  const result = await extractConciergeDraft(
    {
      message: "QA ping only. Please reply with one short sentence and do not create an event.",
    },
    {
      openAiApiKey: "test-key",
      createOpenAiClient: () => {
        throw new Error("OpenAI should not run for non-creation pings");
      },
    },
  );

  assert.equal(result.usedAi, false);
  assert.equal(result.canSave, false);
  assert.equal(result.draft.sourceContext.boundary, "non_creation");
  assert.deepEqual(result.draft.requestedOutputs, []);
  assert.equal(result.assistantMessage, "Got it. I won't create an event from that.");
});

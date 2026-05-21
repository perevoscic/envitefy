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
  assert.match(turn.assistantMessage, /Optional: do you have a gift list/i);

  turn = reply("Skip gift link", turn.draft);
  assert.equal(turn.canSave, true);
  assert.equal(turn.draft.giftPromptDismissed, true);
  assert.match(turn.assistantMessage, /Your live card is ready to generate/i);

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
  assert.equal(turn.draft.currentQuestion, "rsvpName");

  turn = reply("Hosted by Priya", turn.draft);
  assert.equal(turn.canSave, false);
  assert.equal(turn.draft.rsvpName, "Priya");
  assert.equal(turn.draft.currentQuestion, "rsvpContact");

  turn = reply("priya@example.com", turn.draft);
  assert.equal(turn.canSave, false);
  assert.equal(turn.draft.rsvpContact, "priya@example.com");
  assert.equal(turn.draft.currentQuestion, "tone");

  turn = reply("Use a playful rainbow space flyer invitation style.", turn.draft);
  assert.equal(turn.canSave, true);
  assert.deepEqual(turn.draft.requestedOutputs, ["digital_flyer"]);
  assert.match(turn.assistantMessage, /Optional: do you have a gift list/i);

  turn = reply("Skip gift link", turn.draft);
  assert.equal(turn.canSave, true);
  assert.equal(turn.draft.giftPromptDismissed, true);
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


test("concierge acknowledges location corrections while continuing the missing-field flow", () => {
  let turn = reply(
    "Mia baby shower on Sunday August 9 2026 at 1 PM at Greenhouse Cafe, 410 Palm Ave, Dallas, TX.",
    null,
    ["digital_flyer"],
  );
  turn = reply("Yes, collect RSVPs.", turn.draft, ["digital_flyer"]);
  turn = reply("35 guests.", turn.draft, ["digital_flyer"]);
  turn = reply("Elena", turn.draft, ["digital_flyer"]);
  assert.equal(turn.draft.currentQuestion, "rsvpContact");

  turn = reply(
    "Actually change the location to the community room at 22 Oak Plaza, Austin, TX.",
    turn.draft,
    ["digital_flyer"],
  );

  assert.match(turn.draft.location || "", /22 Oak Plaza/);
  assert.equal(turn.draft.rsvpName, "Elena");
  assert.equal(turn.draft.rsvpContact, null);
  assert.equal(turn.draft.currentQuestion, "rsvpContact");
  assert.match(turn.assistantMessage, /updated the location to/i);
  assert.match(turn.assistantMessage, /22 Oak Plaza/);
  assert.match(turn.assistantMessage, /phone number or email/i);
});


test("concierge accepts natural move-it-to location corrections", () => {
  let turn = reply(
    "Garcia family reunion Saturday July 25 2026 at noon at Zilker Park Picnic Area 3, Austin, TX. Please collect RSVPs.",
    null,
    ["digital_flyer"],
  );
  turn = reply("65 guests.", turn.draft, ["digital_flyer"]);
  assert.equal(turn.draft.currentQuestion, "rsvpName");

  turn = reply("Small correction: move it to Green Room B, 14 Market Hall, Dallas, TX.", turn.draft, ["digital_flyer"]);

  assert.match(turn.draft.location || "", /Green Room B/);
  assert.equal(turn.draft.currentQuestion, "rsvpName");
  assert.match(turn.assistantMessage, /updated the location to/i);
  assert.match(turn.assistantMessage, /Who should guests see as the host/i);
});


test("concierge refuses account ownership bypass requests", () => {
  const turn = reply("Can you bypass login and publish it under my spouse account?");

  assert.equal(turn.canSave, false);
  assert.equal(turn.draft.sourceContext.boundary, "private_data");
  assert.match(turn.assistantMessage, /can't change owners|private account data/i);
});


test("concierge acknowledges off-topic interruptions and resumes the draft", () => {
  let turn = reply(
    "Nora is turning 6 on Saturday June 27 2026 at 4 PM at Little Gym, 88 Oak St, Austin, TX.",
    null,
    ["live_card"],
  );
  turn = reply("Yes, collect RSVPs.", turn.draft, ["live_card"]);

  turn = reply("Random question: what is the capital of New Zealand?", turn.draft, ["live_card"]);

  assert.equal(turn.draft.currentQuestion, "numberOfGuests");
  assert.match(turn.assistantMessage, /stay focused on the event/i);
  assert.match(turn.assistantMessage, /RSVP cap|How many guests/i);
});

test("concierge refuses private door codes in public event copy", () => {
  const turn = reply("Put my private door code 9191 in the public description.");

  assert.equal(turn.canSave, false);
  assert.equal(turn.draft.sourceContext.boundary, "private_data");
  assert.match(turn.assistantMessage, /private account data|credentials|private/i);
});


test("concierge parses RSVP contact corrections without polluting the host name", () => {
  let turn = reply(
    "Pat retirement party Friday May 29 2026 at 4 PM at HQ Lounge, 200 Market St, Houston, TX.",
    null,
    ["digital_flyer"],
  );
  turn = reply("Yes, collect RSVPs.", turn.draft, ["digital_flyer"]);

  turn = reply("Correction: RSVP contact should be Jamie at 555-909-1111.", turn.draft, ["digital_flyer"]);

  assert.equal(turn.draft.rsvpName, "Jamie");
  assert.equal(turn.draft.rsvpContact, "555-909-1111");
  assert.equal(turn.draft.currentQuestion, "numberOfGuests");
});

import assert from "node:assert/strict";
import test from "node:test";
import { extractConciergeDraft, normalizeConciergeDraft } from "./extract.ts";
import { buildAssistantMessage, fallbackExtractConciergeDraft } from "./fallback.ts";
import { getOutputRequirement, resolveSourceIntent } from "./creation-intent.ts";
import {
  buildConciergeHistoryPayload,
  canPersistConciergeHistoryDraft,
} from "./history-payload.ts";

test("fallback extracts a partial birthday draft from a relationship sentence", () => {
  const draft = fallbackExtractConciergeDraft({ message: "my daughter's birthday" });

  assert.equal(draft.eventType, "birthday");
  assert.equal(draft.relationship, "daughter");
  assert.equal(draft.honoreeName, null);
  assert.match(draft.missingFields.join(","), /honoreeName/);
  assert.match(draft.previewCopy.scheduleLine, /Date TBD/);
  assert.match(draft.previewCopy.locationLine, /Location TBD/);
});

test("birthday category starts with an oriented intake prompt", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Birthday" });
  const message = buildAssistantMessage(draft);

  assert.match(message, /birthday event page or digital flyer/i);
  assert.match(message, /Who is the guest of honor/i);
  assert.match(message, /What date, time, and location/i);
});

test("greeting does not default into live card creation flow", () => {
  const draft = fallbackExtractConciergeDraft({ message: "hi" });

  assert.equal(draft.intent, "unknown");
  assert.deepEqual(draft.requestedOutputs, []);
  assert.equal(draft.eventPurpose, null);
  assert.equal(draft.eventType, "unknown");
  assert.equal(draft.canPersist, false);
  assert.equal(draft.draftStatus, "needs_source_or_event");
});

test("greeting short-circuits AI extraction and stays conversational", async () => {
  let aiCalls = 0;
  const result = await extractConciergeDraft(
    { message: "hi" },
    {
      openAiApiKey: "test-key",
      createOpenAiClient: () =>
        ({
          chat: {
            completions: {
              create: async () => {
                aiCalls += 1;
                return { choices: [] };
              },
            },
          },
        }) as any,
    },
  );

  assert.equal(aiCalls, 0);
  assert.equal(result.usedAi, false);
  assert.equal(result.draft.intent, "unknown");
  assert.deepEqual(result.draft.requestedOutputs, []);
  assert.match(result.assistantMessage, /what would you like to create/i);
  assert.doesNotMatch(result.assistantMessage, /live card be for/i);
});

test("fast action flag lets OCR creation intake skip AI extraction", async () => {
  const previous = process.env.CONCIERGE_SKIP_AI_FAST_ACTIONS;
  process.env.CONCIERGE_SKIP_AI_FAST_ACTIONS = "1";
  let aiCalls = 0;
  try {
    const result = await extractConciergeDraft(
      {
        message: "Seed a draft from this upload.",
        action: "ocr_result",
        ocrContext: {
          ocrText: "Ava's Birthday Party\nSky Zone\nSaturday at 3",
          fieldsGuess: {
            title: "Ava's Birthday Party",
            location: "Sky Zone",
          },
          category: "Birthdays",
        },
      },
      {
        openAiApiKey: "test-key",
        createOpenAiClient: () =>
          ({
            chat: {
              completions: {
                create: async () => {
                  aiCalls += 1;
                  return { choices: [] };
                },
              },
            },
          }) as any,
      },
    );

    assert.equal(aiCalls, 0);
    assert.equal(result.usedAi, false);
    assert.equal(result.draft.title, "Ava's Birthday Party");
  } finally {
    if (previous === undefined) {
      delete process.env.CONCIERGE_SKIP_AI_FAST_ACTIONS;
    } else {
      process.env.CONCIERGE_SKIP_AI_FAST_ACTIONS = previous;
    }
  }
});

test("output-only live card prompt without context asks for purpose before date", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Make this a live card" });

  assert.equal(draft.intent, "create_output");
  assert.deepEqual(draft.requestedOutputs, ["live_card"]);
  assert.equal(draft.eventPurpose, null);
  assert.equal(draft.eventType, "unknown");
  assert.equal(draft.draftStatus, "needs_event_details");
  assert.equal(draft.canPersist, false);
  assert.equal(draft.missingFields[0], "eventPurpose");
  assert.match(draft.currentQuestion || "", /what_are_we_celebrating/);
});

test("output-specific prompt asks what a digital flyer promotes", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Make this a digital flyer" });

  assert.equal(draft.intent, "create_output");
  assert.deepEqual(draft.requestedOutputs, ["digital_flyer"]);
  assert.equal(draft.canPersist, false);
  assert.match(draft.missingFields.join(","), /eventPurpose/);
});

test("purpose reply after output-only shell stays drafting until preview details exist", () => {
  const first = fallbackExtractConciergeDraft({ message: "Make this a digital flyer" });
  const draft = fallbackExtractConciergeDraft({
    message: "A school fundraiser",
    draft: first,
  });

  assert.equal(draft.eventPurpose, "A school fundraiser");
  assert.equal(draft.sourceContext.hasUsableContext, false);
  assert.equal(draft.draftStatus, "drafting");
  assert.equal(draft.canPersist, true);
  assert.match(draft.missingFields.join(","), /date/);
  assert.match(draft.missingFields.join(","), /location/);
});

test("purpose plus concrete preview details can become preview ready", () => {
  const first = fallbackExtractConciergeDraft({ message: "Make this a digital flyer" });
  const draft = fallbackExtractConciergeDraft({
    message: "A school fundraiser Saturday at 3 at the gym",
    draft: first,
  });

  assert.equal(draft.eventPurpose, "A school fundraiser Saturday at 3 at the gym");
  assert.equal(draft.draftStatus, "preview_ready");
});

test("lowercase location reply fills location instead of repeating the question", () => {
  const first = fallbackExtractConciergeDraft({
    message: "A school fundraiser Saturday at 4",
  });
  const draft = fallbackExtractConciergeDraft({
    message: "at urban air",
    draft: first,
  });

  assert.equal(draft.location, "urban air");
  assert.equal(draft.venue, "urban air");
  assert.doesNotMatch(draft.missingFields.join(","), /location/);
  assert.notEqual(draft.currentQuestion, "location");
});

test("output-only RSVP page prompt stays unsaved until an event/source exists", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Create an RSVP page" });

  assert.equal(draft.intent, "create_output");
  assert.deepEqual(draft.requestedOutputs, ["rsvp_page"]);
  assert.equal(draft.eventType, "unknown");
  assert.equal(draft.draftStatus, "needs_event_details");
  assert.equal(draft.canPersist, false);
  assert.equal(canPersistConciergeHistoryDraft(draft), false);
  assert.throws(() => buildConciergeHistoryPayload(draft), /does not have enough source/);
});

test("output capability matrix gives output-specific first questions and CTAs", () => {
  assert.equal(
    getOutputRequirement("digital_flyer").firstQuestion,
    "What should this flyer promote?",
  );
  assert.equal(getOutputRequirement("whatsapp").previewCta, "Write copy");
});

test("source intent resolver returns confidence and confirmation flags", () => {
  const received = resolveSourceIntent({ text: "I got this invite from Sam" });
  assert.equal(received.detectedSourceIntent, "received_invite");
  assert.equal(received.confidence, "high");
  assert.equal(received.requiresUserConfirmation, false);

  const categoryOnly = resolveSourceIntent({ category: "Weddings" });
  assert.equal(categoryOnly.detectedSourceIntent, "unknown");
  assert.equal(categoryOnly.confidence, "low");
  assert.equal(categoryOnly.requiresUserConfirmation, true);
});

test("purpose can progress a draft while event type remains unknown", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "A school fundraiser for the basketball team",
  });

  assert.equal(draft.eventType, "unknown");
  assert.equal(draft.eventPurpose, "A school fundraiser for the basketball team");
  assert.equal(draft.title, "A school fundraiser for the basketball team");
  assert.equal(draft.draftStatus, "drafting");
  assert.equal(draft.canPersist, true);
  assert.notEqual(draft.missingFields[0], "eventPurpose");
});

test("active context resolves this when exactly one source exists", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "Make this a live card",
    activeContext: {
      route: "/chat",
      currentDraftId: "draft_123",
    },
  });

  assert.equal(draft.sourceContext.type, "current_draft");
  assert.equal(draft.sourceContext.hasUsableContext, true);
  assert.equal(draft.sourceContext.resolvedId, "draft_123");
});

test("ambiguous active context asks which source to use", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "Make this a live card",
    activeContext: {
      route: "/chat",
      currentEventId: "event_123",
      selectedUploadId: "upload_123",
    },
  });

  assert.equal(draft.sourceContext.ambiguity, "multiple");
  assert.equal(draft.draftStatus, "needs_source_or_event");
  assert.equal(draft.currentQuestion, "which_source");
  assert.equal(draft.missingFields[0], "sourceContext");
});

test("fallback updates birthday honoree, age, and theme from a short reply", () => {
  const first = fallbackExtractConciergeDraft({ message: "my daughter's birthday" });
  const draft = fallbackExtractConciergeDraft({
    message: "Ava turning 7 unicorn theme",
    draft: first,
  });

  assert.equal(draft.eventType, "birthday");
  assert.equal(draft.honoreeName, "Ava");
  assert.equal(draft.ageOrMilestone, "7");
  assert.equal(draft.theme, "unicorn");
  assert.equal(draft.previewCopy.headline, "Ava is turning 7");
});

test("new create request replaces restored draft details", () => {
  const restored = fallbackExtractConciergeDraft({
    message: "Create a live card for Ava's 7th birthday Saturday at 3 at Sky Zone",
  });
  const draft = fallbackExtractConciergeDraft({
    message:
      "Create a live card for Mia's 5th birthday on Saturday June 13 2026 at 2 PM at Play Cafe, 123 Main St, Austin, TX.",
    draft: restored,
  });

  assert.equal(draft.creationSessionId, restored.creationSessionId);
  assert.equal(draft.honoreeName, "Mia");
  assert.equal(draft.ageOrMilestone, "5");
  assert.equal(draft.title, "Mia is turning 5");
  assert.equal(draft.previewCopy.headline, "Mia is turning 5");
  assert.doesNotMatch(draft.previewCopy.body, /Ava|7/);
  assert.equal(draft.location, "Play Cafe, 123 Main St, Austin, TX");
  assert.equal(draft.venue, "Play Cafe, 123 Main St, Austin, TX");
  assert.doesNotMatch(draft.previewCopy.scheduleLine, /at 2:00 PM at 2:00 PM/);
  assert.equal(draft.previewCopy.locationLine, "Play Cafe, 123 Main St, Austin, TX");
});

test("fallback fills birthday honoree from a name reply", () => {
  const first = fallbackExtractConciergeDraft({
    message:
      "Create a live card for a birthday on Saturday June 20 2026 at 3:30 PM at Play Cafe, 123 Main St, Austin, TX.",
  });
  const draft = fallbackExtractConciergeDraft({
    message: "Her name is Nova and she is turning 6.",
    draft: first,
  });

  assert.equal(draft.honoreeName, "Nova");
  assert.equal(draft.ageOrMilestone, "6");
  assert.equal(draft.previewCopy.body, "Join us for Nova as they turn 6.");
  assert.equal(draft.location, "Play Cafe, 123 Main St, Austin, TX");
  assert.doesNotMatch(draft.previewCopy.scheduleLine, /at 3:30 PM at 3:30 PM/);
});

test("fallback extracts graduation date text from natural language", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "graduation party Saturday at 3",
  });

  assert.equal(draft.eventType, "graduation");
  assert.ok(draft.startISO);
  assert.match(draft.dateText || "", /Saturday/i);
});

test("fallback infers gym meet category from chat-first prompt", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "Create a gym meet event page for our team",
  });
  const message = buildAssistantMessage(draft);

  assert.equal(draft.eventType, "gym_meet");
  assert.match(message, /gym meet event page or digital flyer/i);
});

test("upload OCR context can seed a draft", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "",
    ocrContext: {
      ocrText: "Ava's Birthday Party\nSky Zone\nRainbow unicorn fun",
      fieldsGuess: {
        title: "Ava's Birthday Party",
        start: "2026-06-06T20:00:00.000Z",
        location: "Sky Zone",
      },
      category: "Birthdays",
    },
  });

  assert.equal(draft.source, "upload");
  assert.equal(draft.eventType, "birthday");
  assert.equal(draft.title, "Ava's Birthday Party");
  assert.equal(draft.location, "Sky Zone");
  assert.equal(draft.startISO, "2026-06-06T20:00:00.000Z");
});

test("OpenAI extraction path normalizes to the same draft shape", async () => {
  const result = await extractConciergeDraft(
    { message: "baby shower brunch" },
    {
      openAiApiKey: "test-key",
      createOpenAiClient: () =>
        ({
          chat: {
            completions: {
              create: async () => ({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        intent: "create_event",
                        eventType: "baby_shower",
                        title: "Baby shower brunch",
                        outputs: ["rsvp_page"],
                        previewCopy: {
                          headline: "Baby shower brunch",
                          subheadline: "Details coming soon",
                          body: "Join us for this baby shower.",
                          scheduleLine: "Date TBD",
                          locationLine: "Location TBD",
                          cta: "RSVP",
                        },
                      }),
                    },
                  },
                ],
              }),
            },
          },
        }) as any,
    },
  );

  assert.equal(result.usedAi, true);
  assert.equal(result.draft.eventType, "baby_shower");
  assert.deepEqual(result.draft.outputs, ["live_card", "rsvp_page"]);
  assert.equal(result.draft.previewCopy.locationLine, "Location TBD");
});

test("OpenAI readiness is downgraded when source and purpose are missing", async () => {
  const result = await extractConciergeDraft(
    { message: "Make this a live card" },
    {
      openAiApiKey: "test-key",
      createOpenAiClient: () =>
        ({
          chat: {
            completions: {
              create: async () => ({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        intent: "create_output",
                        requestedOutputs: ["live_card"],
                        eventType: "general",
                        title: "",
                        draftStatus: "preview_ready",
                        missingFields: [],
                        previewCopy: {
                          headline: "Live card",
                          subheadline: "Details coming soon",
                          body: "Details coming soon.",
                          scheduleLine: "Date TBD",
                          locationLine: "Location TBD",
                          cta: "RSVP",
                        },
                      }),
                    },
                  },
                ],
              }),
            },
          },
        }) as any,
    },
  );

  assert.equal(result.usedAi, true);
  assert.equal(result.draft.intent, "create_output");
  assert.equal(result.draft.eventType, "unknown");
  assert.equal(result.draft.draftStatus, "needs_event_details");
  assert.equal(result.canSave, false);
  assert.equal(result.draft.missingFields[0], "eventPurpose");
});

test("save payload stores concierge drafts as owned My Events rows", () => {
  const draft = normalizeConciergeDraft(
    {
      eventType: "birthday",
      title: "Ava is turning 7",
      honoreeName: "Ava",
      ageOrMilestone: "7",
      outputs: ["live_card"],
      previewCopy: {
        headline: "Ava is turning 7",
        subheadline: "Unicorn theme",
        body: "Join us for Ava.",
        scheduleLine: "Date TBD",
        locationLine: "Location TBD",
        cta: "RSVP",
      },
    },
    fallbackExtractConciergeDraft({ message: "Ava turning 7" }),
  );
  const payload = buildConciergeHistoryPayload(draft);

  assert.equal(payload.data.ownership, "owned");
  assert.equal(payload.data.createdVia, "concierge");
  assert.equal(payload.data.status, "draft");
  assert.equal(payload.data.invitedFromScan, false);
  assert.equal(payload.data.conciergeDraft.title, "Ava is turning 7");
  assert.equal(payload.data.rsvp.direct, true);
  assert.equal(payload.data.publicEvent.renderer, "live_card");
  assert.equal(payload.data.liveCard.scheduleLine, "Date TBD");
  assert.equal(payload.data.liveCard.locationLine, "Location TBD");
});

test("save payload splits combined venue and address for public live cards", () => {
  const draft = fallbackExtractConciergeDraft({
    message:
      "Create a live card for Mia's 5th birthday on Saturday June 13 2026 at 2 PM at Play Cafe, 123 Main St, Austin, TX.",
  });
  const payload = buildConciergeHistoryPayload(draft);

  assert.equal(payload.data.venue, "Play Cafe");
  assert.equal(payload.data.location, "123 Main St, Austin, TX");
  assert.equal(payload.data.placeName, "Play Cafe");
  assert.equal(payload.data.locationLabel, "Play Cafe, 123 Main St, Austin, TX");
  assert.equal(payload.data.liveCard.locationLine, "Play Cafe, 123 Main St, Austin, TX");
});

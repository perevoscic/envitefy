import assert from "node:assert/strict";
import test from "node:test";
import { getOutputRequirement, resolveSourceIntent } from "./creation-intent.ts";
import { extractConciergeDraft, normalizeConciergeDraft } from "./extract.ts";
import { buildAssistantMessage, fallbackExtractConciergeDraft } from "./fallback.ts";
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

  assert.match(message, /Let's start small/i);
  assert.match(message, /Let's start small\.\nWho is the birthday for/i);
  assert.match(message, /Who is the birthday for/i);
  assert.match(message, /\nWhen and where/i);
  assert.ok((message.match(/\?/g) || []).length <= 2);
});

test("starter category uses the selected/default product and asks for event details", async () => {
  const result = await extractConciergeDraft({
    message: "Birthday",
    action: "starter_category",
  });

  assert.equal(result.usedAi, false);
  assert.equal(result.draft.eventType, "birthday");
  assert.deepEqual(result.draft.requestedOutputs, ["live_card"]);
  assert.doesNotMatch(result.assistantMessage, /would you like that to be/i);
  assert.match(result.assistantMessage, /Who is the birthday for/i);
});

test("starter category and product text asks for event details immediately", async () => {
  const result = await extractConciergeDraft({
    message: "Birthday Event Page",
    action: "starter_category",
  });

  assert.equal(result.usedAi, false);
  assert.equal(result.draft.eventType, "birthday");
  assert.deepEqual(result.draft.requestedOutputs, ["event_page"]);
  assert.doesNotMatch(result.assistantMessage, /would you like that to be/i);
  assert.match(result.assistantMessage, /Who is the birthday for/i);
});

test("starter category and product text skips OpenAI extraction", async () => {
  for (const { message, requestedOutputs, eventType } of [
    {
      message: "Birthday Live Card",
      requestedOutputs: ["live_card"] as const,
      eventType: "birthday",
    },
    {
      message: "Birthday Event Page",
      requestedOutputs: ["event_page"] as const,
      eventType: "birthday",
    },
    {
      message: "Wedding Invitation",
      requestedOutputs: ["invitation"] as const,
      eventType: "wedding",
    },
  ] as const) {
    let aiCalls = 0;
    const result = await extractConciergeDraft(
      {
        message,
        action: "starter_category",
        requestedOutputs: [...requestedOutputs],
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

    assert.equal(aiCalls, 0, message);
    assert.equal(result.usedAi, false, message);
    assert.equal(result.draft.eventType, eventType, message);
    assert.deepEqual(result.draft.requestedOutputs, [...requestedOutputs], message);
  }
});

test("structured starter category can skip OpenAI when the message only names the product", async () => {
  let aiCalls = 0;
  const result = await extractConciergeDraft(
    {
      message: "Live Card",
      action: "starter_category",
      requestedOutputs: ["live_card"],
      starterCategory: "Birthday",
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
  assert.equal(result.draft.eventType, "birthday");
  assert.deepEqual(result.draft.requestedOutputs, ["live_card"]);
});

test("main-page category/product selection suppresses the format question", async () => {
  const result = await extractConciergeDraft({
    message: "Wedding Invitation",
    action: "starter_category",
    requestedOutputs: ["invitation"],
  });

  assert.equal(result.usedAi, false);
  assert.equal(result.draft.eventType, "wedding");
  assert.deepEqual(result.draft.requestedOutputs, ["invitation"]);
  assert.doesNotMatch(result.assistantMessage, /would you like that to be/i);
  assert.match(result.assistantMessage, /What wedding event is this for/i);
});

test("visible starter categories map to first-class concierge event types", () => {
  const cases = [
    ["Game Day Live Card", "game_day", /team, game, or watch party/i],
    ["Bridal Shower Invitation", "bridal_shower", /bridal shower for/i],
    ["Field Trip/Day Event Page", "field_trip", /field trip or school day/i],
    ["Open House Event Page", "open_house", /open house/i],
    ["Housewarming Invitation", "housewarming", /housewarming/i],
    ["Gender Reveal Invitation", "gender_reveal", /gender reveal/i],
  ] as const;

  for (const [message, eventType, prompt] of cases) {
    const draft = fallbackExtractConciergeDraft({
      message,
      action: "starter_category",
    });

    assert.equal(draft.eventType, eventType);
    assert.notEqual(draft.eventType, "unknown");
    assert.match(buildAssistantMessage(draft), prompt);
  }
});

test("wedding event pages require couple names before ready", () => {
  let draft = fallbackExtractConciergeDraft({
    message: "Wedding Event Page",
    action: "starter_category",
  });

  assert.equal(draft.eventType, "wedding");
  assert.equal(draft.currentQuestion, "honoreeName");
  assert.match(buildAssistantMessage(draft), /whose names should be featured/i);

  draft = fallbackExtractConciergeDraft({
    message: "Sara and Daniel wedding reception Saturday at 5 at The Pearl",
    draft,
  });

  assert.equal(draft.honoreeName, "Sara and Daniel");
  assert.match(draft.title || "", /Sara and Daniel/i);
  assert.doesNotMatch(draft.missingFields.join(","), /honoreeName/);
  assert.equal(draft.location, "The Pearl");
});

test("category intake prompts stay short", () => {
  for (const prompt of ["Birthday", "Wedding", "Baby shower", "Graduation", "Gym meet"]) {
    const message = buildAssistantMessage(fallbackExtractConciergeDraft({ message: prompt }));
    const lines = message.split("\n").filter(Boolean);

    assert.equal(lines[0], "Let's start small.");
    assert.ok(lines.length <= 3, message);
    assert.ok(
      lines.slice(1).every((line) => line.endsWith("?")),
      message,
    );
    assert.ok((message.match(/\?/g) || []).length <= 2, message);
    assert.doesNotMatch(message, /To get started|please share a few details|Once I have/i);
  }
});

test("received birthday invite request asks for invite source instead of host authoring", () => {
  const result = fallbackExtractConciergeDraft({
    message: "I received a birthday invite and want to save it.",
  });
  const message = buildAssistantMessage(result);

  assert.equal(result.eventType, "birthday");
  assert.equal(result.sourceContext.detectedSourceIntent, "received_invite");
  assert.equal(result.ownership, "invited");
  assert.equal(result.currentQuestion, "invite_source");
  assert.equal(result.canPersist, false);
  assert.equal(canPersistConciergeHistoryDraft(result), false);
  assert.match(result.missingFields[0], /sourceContext/);
  assert.match(message, /saving a birthday invite you received/i);
  assert.match(message, /upload[\s\S]+paste[\s\S]+exact/i);
  assert.doesNotMatch(message, /craft an elegant/i);
  assert.doesNotMatch(message, /guest of honor/i);
  assert.doesNotMatch(message, /color palette|vibe/i);
});

test("received invite with concrete details stays invited and can become ready", () => {
  const result = fallbackExtractConciergeDraft({
    message:
      "I received a birthday invite for Ava turning 7 Saturday at 3 at Sky Zone and want to save it.",
  });
  const message = buildAssistantMessage(result);

  assert.equal(result.eventType, "birthday");
  assert.equal(result.sourceContext.detectedSourceIntent, "received_invite");
  assert.equal(result.ownership, "invited");
  assert.equal(result.honoreeName, "Ava");
  assert.equal(result.ageOrMilestone, "7");
  assert.equal(result.location, "Sky Zone");
  assert.equal(result.canPersist, true);
  assert.equal(result.draftStatus, "preview_ready");
  assert.match(message, /Details are ready/);
  assert.match(message, /Product: Live card/);
  assert.match(message, /Event: Ava is turning 7/);
  assert.match(message, /Location: Sky Zone/);
  assert.match(message, /I can generate the invite now/);
  assert.doesNotMatch(message, /workspace/i);
});

test("birthday turns phrasing fills honoree and age", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "Ava turns 7 Saturday at 3 at Sky Zone",
  });

  assert.equal(draft.eventType, "birthday");
  assert.equal(draft.honoreeName, "Ava");
  assert.equal(draft.ageOrMilestone, "7");
  assert.equal(draft.location, "Sky Zone");
});

test("received invite follow-up details preserve invited ownership", () => {
  const first = fallbackExtractConciergeDraft({
    message: "I received a birthday invite and want to save it.",
  });
  const result = fallbackExtractConciergeDraft({
    message: "Ava turning 7 Saturday at 3 at Sky Zone",
    draft: first,
  });

  assert.equal(result.sourceContext.detectedSourceIntent, "received_invite");
  assert.equal(result.ownership, "invited");
  assert.equal(result.honoreeName, "Ava");
  assert.equal(result.ageOrMilestone, "7");
  assert.equal(result.location, "Sky Zone");
  assert.equal(result.draftStatus, "preview_ready");
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
  assert.match(result.assistantMessage, /what are we celebrating/i);
  assert.doesNotMatch(result.assistantMessage, /live card be for/i);
});

test("source-only received invite request short-circuits AI extraction", async () => {
  let aiCalls = 0;
  const result = await extractConciergeDraft(
    { message: "I received a birthday invite and want to save it." },
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
  assert.equal(result.draft.sourceContext.detectedSourceIntent, "received_invite");
  assert.equal(result.draft.currentQuestion, "invite_source");
  assert.match(result.assistantMessage, /upload[\s\S]+paste[\s\S]+exact/i);
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

test("obvious starter creation prompt skips AI extraction", async () => {
  let aiCalls = 0;
  const result = await extractConciergeDraft(
    { message: "Create a birthday live card with RSVP." },
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
  assert.equal(result.draft.eventType, "birthday");
  assert.deepEqual(result.draft.requestedOutputs, ["live_card", "rsvp_page"]);
  assert.ok(result.draft.missingFields.includes("date"));
  assert.ok(result.draft.missingFields.includes("honoreeName"));
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
  assert.equal(draft.currentQuestion, "tone");
});

test("fallback asks RSVP guest count before vibe and stores both replies", () => {
  let draft = fallbackExtractConciergeDraft({
    message: "Create a birthday live card with RSVP.",
  });
  draft = fallbackExtractConciergeDraft({ message: "Ava, 7", draft });
  draft = fallbackExtractConciergeDraft({ message: "Saturday at 3 at Sky Zone", draft });

  assert.equal(draft.currentQuestion, "numberOfGuests");
  assert.equal(draft.missingFields[0], "numberOfGuests");
  assert.match(buildAssistantMessage(draft), /how many guests/i);

  draft = fallbackExtractConciergeDraft({ message: "23", draft });

  assert.equal(draft.numberOfGuests, 23);
  assert.equal(draft.currentQuestion, "tone");
  assert.equal(draft.missingFields[0], "tone");
  assert.match(buildAssistantMessage(draft), /vibe/i);

  draft = fallbackExtractConciergeDraft({ message: "fun and colorful", draft });

  assert.equal(draft.tone, "fun and colorful");
  assert.doesNotMatch(draft.missingFields.join(","), /tone/);
  assert.match(buildAssistantMessage(draft), /details are ready/i);
  assert.match(buildAssistantMessage(draft), /Product: Live card/);
  assert.match(buildAssistantMessage(draft), /Event: Ava is turning 7/);
  assert.match(buildAssistantMessage(draft), /Location: Sky Zone/);
  assert.match(buildAssistantMessage(draft), /RSVP guest count: 23/);
  assert.doesNotMatch(buildAssistantMessage(draft), /\*\*\*/);
});

test("birthday live cards ask whether to collect RSVPs before vibe", () => {
  let draft = fallbackExtractConciergeDraft({
    message: "Create a birthday live card.",
  });
  draft = fallbackExtractConciergeDraft({ message: "Ava, 7", draft });
  draft = fallbackExtractConciergeDraft({ message: "Saturday at 3 at Sky Zone", draft });

  assert.equal(draft.currentQuestion, "rsvpEnabled");
  assert.match(buildAssistantMessage(draft), /collect RSVPs/i);

  draft = fallbackExtractConciergeDraft({ message: "yes", draft });
  assert.equal(draft.rsvpEnabled, true);
  assert.equal(draft.currentQuestion, "numberOfGuests");
  assert.match(buildAssistantMessage(draft), /how many guests/i);
});

test("birthday live cards can skip RSVP collection and continue to vibe", () => {
  let draft = fallbackExtractConciergeDraft({
    message: "Create a birthday live card.",
  });
  draft = fallbackExtractConciergeDraft({ message: "Ava, 7", draft });
  draft = fallbackExtractConciergeDraft({ message: "Saturday at 3 at Sky Zone", draft });
  draft = fallbackExtractConciergeDraft({ message: "no", draft });

  assert.equal(draft.rsvpEnabled, false);
  assert.equal(draft.currentQuestion, "tone");
  assert.doesNotMatch(draft.missingFields.join(","), /numberOfGuests/);
  assert.match(buildAssistantMessage(draft), /vibe/i);
});

test("RSVP intent replies are not stored as vibe answers", () => {
  let draft = fallbackExtractConciergeDraft({
    message: "Create a game day live card for the Tigers watch party Saturday at 6 at Stadium Bar",
  });

  assert.equal(draft.eventType, "game_day");
  assert.equal(draft.currentQuestion, "rsvpEnabled");

  draft = fallbackExtractConciergeDraft({ message: "Yes collect RSVPs", draft });

  assert.equal(draft.rsvpEnabled, true);
  assert.notEqual(draft.tone, "Yes collect RSVPs");
  assert.equal(draft.currentQuestion, "numberOfGuests");
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

test("bare location reply fills the active location slot instead of repeating the question", () => {
  const first = fallbackExtractConciergeDraft({
    message: "A school fundraiser Saturday at 4",
  });
  const draft = fallbackExtractConciergeDraft({
    message: "the venue",
    draft: first,
  });

  assert.equal(first.currentQuestion, "location");
  assert.equal(draft.location, "the venue");
  assert.equal(draft.venue, "the venue");
  assert.doesNotMatch(draft.missingFields.join(","), /location/);
  assert.notEqual(buildAssistantMessage(draft), "Where should guests go?");
});

test("short birthday follow-ups fill name and age slots", () => {
  const first = fallbackExtractConciergeDraft({
    message: "my daughter's birthday Saturday at 4 at home",
  });
  const named = fallbackExtractConciergeDraft({
    message: "ava",
    draft: first,
  });
  const aged = fallbackExtractConciergeDraft({
    message: "7",
    draft: named,
  });

  assert.equal(named.honoreeName, "Ava");
  assert.equal(aged.ageOrMilestone, "7");
  assert.doesNotMatch(aged.missingFields.join(","), /honoreeName|ageOrMilestone/);
});

test("typo-like date replies are confirmed before moving to location", () => {
  const first = fallbackExtractConciergeDraft({
    message: "Birthday Live Card for Ava turning 7 with a lot of flower",
  });
  const draft = fallbackExtractConciergeDraft({
    message: "my 23d",
    draft: first,
  });
  const message = buildAssistantMessage(draft);

  assert.equal(first.currentQuestion, "date");
  assert.equal(draft.currentQuestion, "date_confirmation");
  assert.equal(draft.missingFields[0], "date");
  assert.match(draft.dateText || "", /May 23rd/);
  assert.match(message, /did you mean May 23rd, or another date/i);
  assert.doesNotMatch(message, /Where should guests go/i);

  const confirmed = fallbackExtractConciergeDraft({
    message: "yes",
    draft,
  });

  assert.notEqual(confirmed.currentQuestion, "date_confirmation");
  assert.doesNotMatch(confirmed.missingFields.join(","), /date/);
  assert.equal(confirmed.dateText, draft.dateText);
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
    "What should this flyer invite be for?",
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
    message: "A school fundraiser for the drama club",
  });

  assert.equal(draft.eventType, "unknown");
  assert.equal(draft.eventPurpose, "A school fundraiser for the drama club");
  assert.equal(draft.title, "A school fundraiser for the drama club");
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
  assert.match(message, /team, gym, or meet name/i);
  assert.ok((message.match(/\?/g) || []).length <= 2);
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

test("OpenAI normalization treats nested eventData venue as satisfying location", () => {
  const fallback = fallbackExtractConciergeDraft({
    message: "A school fundraiser Saturday at 4",
  });
  const draft = normalizeConciergeDraft(
    {
      eventData: {
        venue: "the venue",
      },
      missingFields: ["location"],
    },
    fallback,
  );

  assert.equal(fallback.currentQuestion, "location");
  assert.equal(draft.location, "the venue");
  assert.equal(draft.venue, "the venue");
  assert.doesNotMatch(draft.missingFields.join(","), /location/);
  assert.notEqual(buildAssistantMessage(draft), "Where should guests go?");
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

test("save payload stores generated concierge products as owned My Events rows", () => {
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
  assert.equal(payload.data.status, "published");
  assert.equal(payload.data.draftStatus, "published");
  assert.equal(payload.data.primaryOutput, "live_card");
  assert.equal(payload.data.productType, "live_card");
  assert.equal(payload.data.ownerDefaultSurface, "card");
  assert.equal(payload.data.invitedFromScan, false);
  assert.equal(payload.data.conciergeDraft.title, "Ava is turning 7");
  assert.equal(payload.data.coverImageUrl, "/studio/birthday.webp");
  assert.equal(payload.data.heroTextMode, "image");
  assert.equal(payload.data.rsvp.direct, false);
  assert.equal(payload.data.publicEvent.renderer, "live_card");
  assert.equal(payload.data.publicEvent.primaryOutput, "live_card");
  assert.equal(payload.data.liveCard.scheduleLine, "Date TBD");
  assert.equal(payload.data.liveCard.locationLine, "Location TBD");
  assert.equal(payload.data.studioCard.imageUrl, "/studio/birthday.webp");
  assert.equal(payload.data.studioCard.invitationData.title, "Ava is turning 7");
  assert.equal(payload.data.studioCard.invitationData.heroTextMode, "image");
  assert.equal(payload.data.studioCard.invitationData.eventDetails.category, "Birthday");
});

test("save payload preserves event page as the primary product", () => {
  const draft = fallbackExtractConciergeDraft({
    message:
      "Create an event page for Sara and Daniel wedding reception Saturday at 5 at The Pearl",
    requestedOutputs: ["event_page"],
  });
  const payload = buildConciergeHistoryPayload(draft);

  assert.deepEqual(draft.requestedOutputs, ["event_page"]);
  assert.equal(payload.data.publicEvent.primaryOutput, "event_page");
  assert.equal(payload.data.publicEvent.renderer, "event_page");
  assert.doesNotMatch(JSON.stringify(payload.data.requestedOutputs), /live_card/);
});

test("save payload preserves flyer invite as the primary product", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "Create a digital flyer for an open house Saturday at 1 at 123 Main St",
    requestedOutputs: ["digital_flyer"],
  });
  const payload = buildConciergeHistoryPayload(draft);

  assert.deepEqual(draft.requestedOutputs, ["digital_flyer"]);
  assert.equal(payload.data.publicEvent.primaryOutput, "digital_flyer");
  assert.equal(payload.data.publicEvent.renderer, "digital_flyer");
  assert.doesNotMatch(JSON.stringify(payload.data.requestedOutputs), /live_card/);
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
  assert.equal(payload.data.locationText, "Play Cafe, 123 Main St, Austin, TX");
  assert.equal(payload.data.locationLabel, "Play Cafe, 123 Main St, Austin, TX");
  assert.equal(payload.data.liveCard.locationLine, "Play Cafe, 123 Main St, Austin, TX");
});

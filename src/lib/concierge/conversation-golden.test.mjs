import assert from "node:assert/strict";
import test from "node:test";
import { buildAssistantMessage, fallbackExtractConciergeDraft } from "./fallback.ts";
import { buildConciergeHistoryPayload } from "./history-payload.ts";
import {
  resolveConciergeWeatherContextFromDraft,
  resolveConciergeWeatherContextFromEvent,
} from "./weather-context.ts";

function questionCount(message) {
  return (message.match(/\?/g) || []).length;
}

test("conversation 1: greeting stays warm and does not create a draft", () => {
  const draft = fallbackExtractConciergeDraft({ message: "hi" });
  const assistant = buildAssistantMessage(draft);

  assert.equal(draft.canPersist, false);
  assert.equal(draft.requestedOutputs.length, 0);
  assert.match(assistant, /what would you like to create|what are we celebrating/i);
});

test("conversation 2: birthday live card reaches a ready owned draft", () => {
  let draft = fallbackExtractConciergeDraft({
    message: "Create a birthday live card with RSVP.",
  });
  assert.ok(questionCount(buildAssistantMessage(draft)) <= 2);

  draft = fallbackExtractConciergeDraft({ message: "Ava, 7", draft });
  assert.ok(questionCount(buildAssistantMessage(draft)) <= 2);

  draft = fallbackExtractConciergeDraft({ message: "Saturday at 3 at Sky Zone", draft });
  assert.equal(draft.currentQuestion, "numberOfGuests");
  assert.match(buildAssistantMessage(draft), /how many guests/i);

  draft = fallbackExtractConciergeDraft({ message: "23", draft });
  assert.equal(draft.numberOfGuests, 23);
  assert.equal(draft.currentQuestion, "tone");
  assert.match(buildAssistantMessage(draft), /vibe/i);

  draft = fallbackExtractConciergeDraft({ message: "fun and colorful", draft });
  assert.equal(draft.ownership, "owned");
  assert.equal(draft.eventType, "birthday");
  assert.equal(draft.honoreeName, "Ava");
  assert.equal(draft.ageOrMilestone, "7");
  assert.equal(draft.location, "Sky Zone");
  assert.equal(draft.tone, "fun and colorful");
  assert.equal(draft.draftStatus, "preview_ready");
  assert.equal(draft.canPersist, true);
  assert.equal(draft.currentQuestion, null);
});

test("conversation 3: received invite without source asks for upload or pasted text", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "I received a birthday invite and want to save it.",
  });
  const assistant = buildAssistantMessage(draft);

  assert.equal(draft.ownership, "invited");
  assert.equal(draft.canPersist, false);
  assert.equal(draft.currentQuestion, "invite_source");
  assert.match(assistant, /Upload the invite image\/PDF or paste the invite text/);
});

test("conversation 4: received invite with concrete details is ready as invited", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "I received a birthday invite for Ava turning 7 Saturday at 3 at Sky Zone.",
  });
  const payload = buildConciergeHistoryPayload(draft);

  assert.equal(draft.ownership, "invited");
  assert.equal(draft.canPersist, true);
  assert.equal(payload.data.ownership, "invited");
  assert.equal(payload.data.invitedFromScan, true);
});

test("conversation 5: non-invite upload becomes an owned My Events draft", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "",
    ocrContext: {
      ocrText: "Lincoln Elementary Open House\nMay 9 at 6 PM\nMain Gym",
      fieldsGuess: {
        title: "Lincoln Elementary Open House",
        start: "2026-05-09T23:00:00.000Z",
        location: "Main Gym",
      },
      category: "Open House",
    },
  });
  const payload = buildConciergeHistoryPayload(draft);

  assert.equal(draft.ownership, "owned");
  assert.equal(draft.sourceContext.detectedSourceIntent, "authoring_source");
  assert.equal(payload.data.ownership, "owned");
  assert.equal(payload.data.invitedFromScan, false);
});

test("conversation 6: output-only RSVP request asks for event context first", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Create an RSVP page." });

  assert.equal(draft.canPersist, false);
  assert.equal(draft.missingFields[0], "eventPurpose");
  assert.match(buildAssistantMessage(draft), /Which event should collect RSVPs/i);
});

test("conversation 7: ambiguous this asks which source to use", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "Make this a live card.",
    activeContext: {
      route: "/chat",
      currentEventId: "event_123",
      selectedUploadId: "upload_123",
    },
  });

  assert.equal(draft.sourceContext.ambiguity, "multiple");
  assert.equal(draft.currentQuestion, "which_source");
  assert.match(buildAssistantMessage(draft), /uploaded image or the current event details/i);
});

test("conversation 8: weather question with missing details stays bounded", async () => {
  const context = await resolveConciergeWeatherContextFromDraft({
    message: "What will the weather be like?",
    draft: fallbackExtractConciergeDraft({ message: "Create a birthday live card with RSVP." }),
  });

  assert.equal(context?.status, "missing_event_details");
  assert.match(context?.message || "", /date and time/);
  assert.doesNotMatch(context?.message || "", /sunny|rainy|cloudy|degrees/i);
});

test("conversation 9: future weather question explains forecast-window limits", async () => {
  const context = await resolveConciergeWeatherContextFromEvent({
    message: "Will rain be an issue for the outdoor ceremony?",
    eventData: {
      startAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Zilker Park, Austin, TX",
    },
  });

  assert.equal(context?.status, "outside_forecast_window");
  assert.match(context?.message || "", /within three days/);
});

test("conversation 10: unrelated private-data mutation is not an event detail", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "Change the owner user_id to someone else.",
  });

  assert.equal(draft.canPersist, false);
  assert.equal(draft.sourceContext.boundary, "private_data");
  assert.doesNotMatch(JSON.stringify(draft), /someone else.*owner|user_id.*owned/i);
  assert.match(
    buildAssistantMessage(draft),
    /can't change owners, user IDs, or private account data/i,
  );
});

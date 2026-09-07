import assert from "node:assert/strict";
import test from "node:test";
import { extractConciergeDraft } from "./extract.ts";
import { conciergeExtractionConversation, parseConciergeEdits } from "./extraction-contract.ts";
import { buildAssistantMessage, fallbackExtractConciergeDraft } from "./fallback.ts";

const opening = "Livia, 10, grand Boulevard amc, the forgotten island movie theme";
const venue = "grand Boulevard amc";
const start = () => fallbackExtractConciergeDraft({
  message: "Birthday Live Card", requestedOutputs: ["live_card"],
  action: "starter_category", starterCategory: "Birthday",
});
const locationEdit = (source = "conversation_user_message") => ({
  field: "location", operation: "set", value: venue, source, sourceText: venue,
});
const payload = (edits) => ({ edits, previewCopy: null });
const ai = (edits, inspect = () => {}) => ({
  openAiApiKey: "test-key",
  createOpenAiClient: () => ({ chat: { completions: { create: async (request) => {
    inspect(request);
    return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(payload(edits)) } }] };
  } } } }),
});
const missedLocation = () => ({
  ...fallbackExtractConciergeDraft({ message: opening, draft: start() }),
  location: null, venue: null,
});
const history = [{ role: "user", text: opening }, { role: "assistant", text: "When should this happen?" }];

test("one initial message prefills every supplied fact before any follow-up question", async () => {
  for (const action of ["message", "starter_category"]) {
    let calls = 0;
    const message = `Create a birthday live card for ${opening}`;
    const result = await extractConciergeDraft({
      message, action, starterCategory: "Birthday", requestedOutputs: ["live_card"],
    }, ai([
      { ...locationEdit("latest_user_message") },
      { ...locationEdit("latest_user_message"), field: "venue" },
      { ...locationEdit("latest_user_message"), field: "honoreeName", value: "Livia", sourceText: "Livia" },
      { ...locationEdit("latest_user_message"), field: "ageOrMilestone", value: "10", sourceText: "10" },
      { ...locationEdit("latest_user_message"), field: "theme", value: "the forgotten island movie theme", sourceText: "the forgotten island movie theme" },
    ], (request) => {
      calls += 1;
      const context = JSON.parse(request.messages[1].content);
      assert.equal(context.message, message);
      assert.equal(context.previousDraft, null);
      assert.deepEqual(context.recentConversation, []);
    }));
    assert.equal(calls, 1, action);
    assert.equal(result.draft.honoreeName, "Livia");
    assert.equal(result.draft.ageOrMilestone, "10");
    assert.equal(result.draft.location, venue);
    assert.equal(result.draft.theme, "the forgotten island movie theme");
    assert.equal(result.draft.currentQuestion, "date");
    assert.ok(!result.draft.missingFields.includes("location"));
  }
});

test("screenshot conversation captures the compact venue immediately and retains it through gift/date/time replies", async () => {
  let draft = start();
  for (const message of [opening, "Skip gift link", "26th September", "3pm"]) {
    const result = await extractConciergeDraft({ message, draft }, { openAiApiKey: "" });
    draft = result.draft;
    assert.equal(draft.honoreeName, "Livia");
    assert.equal(draft.ageOrMilestone, "10");
    assert.equal(draft.theme, "the forgotten island movie theme", message);
    assert.equal(draft.location, venue, message);
    assert.equal(draft.venue, venue, message);
    assert.ok(!draft.missingFields.includes("location"), message);
    assert.notEqual(draft.currentQuestion, "location", message);
    assert.doesNotMatch(result.assistantMessage, /where should guests go|what.*(?:venue|location)/i);
  }
  assert.equal(draft.timeText, "3:00 PM");
  assert.equal(draft.giftPromptDismissed, true);
  assert.match(draft.previewCopy.locationLine, /grand Boulevard amc/i);
});

test("compact venue recognition excludes themes, tentative choices and multiple venues", () => {
  for (const detail of ["Jurassic Park theme", "Jurassic Park movie", "I like Grand Boulevard AMC", "maybe Grand Boulevard AMC", "Grand Boulevard AMC or Regal", "Grand Boulevard AMC, Garden Hall"]) {
    const draft = fallbackExtractConciergeDraft({ message: `Livia, 10, ${detail}`, draft: start() });
    assert.equal(draft.location, null, detail);
  }
  for (const detail of ["AMC Grand Boulevard", "grand Boulevard amc", "Sunshine Play Cafe", "Garden Hall"]) {
    const draft = fallbackExtractConciergeDraft({ message: `Livia, 10, ${detail}, movie theme`, draft: start() });
    assert.equal(draft.location, detail);
  }
});

test("AI recovers an initially missed location from earlier user evidence before choosing the next question", async () => {
  let draft = fallbackExtractConciergeDraft({ message: "26th September", draft: missedLocation() });
  const result = await extractConciergeDraft({ message: "3pm", draft, chatMessages: history }, ai([locationEdit()], (request) => {
    const context = JSON.parse(request.messages[1].content);
    assert.deepEqual(context.recentConversation, history);
    assert.match(request.messages[0].content, /Capture EVERY supplied fact/);
    assert.match(request.messages[0].content, /A named venue satisfies location/);
  }));
  assert.equal(result.usedAi, true);
  assert.equal(result.draft.location, venue);
  assert.equal(result.draft.venue, venue);
  assert.ok(!result.draft.missingFields.includes("location"));
  assert.notEqual(result.draft.currentQuestion, "location");
  assert.doesNotMatch(buildAssistantMessage(result.draft), /where should guests go/i);
  draft = fallbackExtractConciergeDraft({ message: "Skip gift link", draft: result.draft });
  assert.equal(draft.location, venue);
});

test("historical edits require exact user evidence and cannot overwrite current or newly supplied locations", () => {
  const request = { message: "3pm", draft: missedLocation(), chatMessages: history };
  assert.deepEqual(parseConciergeEdits(payload([locationEdit()]), request).patch, { location: venue });
  assert.deepEqual(parseConciergeEdits(payload([locationEdit("latest_user_message")]), request).patch, {});
  for (const chatMessages of [[], [{ role: "assistant", text: opening }], [{ role: "user", text: "Another venue" }]]) {
    assert.deepEqual(parseConciergeEdits(payload([locationEdit()]), { ...request, chatMessages }).patch, {});
  }
  for (const currentDraft of [
    { ...request.draft, location: "Garden Hall" },
    { ...request.draft, venue: "Garden Hall" },
  ]) {
    assert.deepEqual(parseConciergeEdits(payload([locationEdit()]), request, currentDraft).patch, {});
  }
  const clear = { ...locationEdit(), operation: "clear", value: null };
  assert.deepEqual(parseConciergeEdits(payload([clear]), request).patch, {});
  const relativeDate = { ...locationEdit(), field: "dateText", value: "tomorrow", sourceText: "tomorrow" };
  assert.deepEqual(parseConciergeEdits(payload([relativeDate]), {
    ...request, chatMessages: [{ role: "user", text: "tomorrow" }],
  }).patch, {});
});

test("recovered venue replaces a stale location question embedded in an acknowledgement", async () => {
  let draft = missedLocation();
  for (const message of ["26th September", "3pm"]) draft = fallbackExtractConciergeDraft({ message, draft });
  assert.equal(draft.currentQuestion, "location");
  const result = await extractConciergeDraft({ message: "Skip gift link", draft, chatMessages: history }, ai([locationEdit()]));
  assert.equal(result.draft.location, venue);
  assert.equal(result.draft.giftPromptDismissed, true);
  assert.notEqual(result.draft.currentQuestion, "location");
  assert.doesNotMatch(result.assistantMessage, /where should guests go/i);
});

test("a latest venue correction survives later date and time replies", async () => {
  let draft = fallbackExtractConciergeDraft({ message: opening, draft: start() });
  draft = fallbackExtractConciergeDraft({ message: "Change the location to Garden Hall.", draft });
  for (const message of ["26th September", "3pm"]) {
    const result = await extractConciergeDraft({ message, draft, chatMessages: history }, ai([locationEdit()]));
    draft = result.draft;
    assert.equal(draft.location, "Garden Hall");
    assert.equal(draft.venue, "Garden Hall");
  }
});

test("deliberately cleared locations stay removed on later turns even if AI proposes an old venue", async () => {
  const draft = fallbackExtractConciergeDraft({ message: opening, draft: start() });
  const message = "Clear the venue; it is undecided.";
  const cleared = await extractConciergeDraft({ message, draft, chatMessages: history }, ai([
    { field: "location", operation: "clear", value: null, source: "latest_user_message", sourceText: message },
  ]));
  assert.equal(cleared.draft.location, null);
  assert.equal(cleared.draft.venue, null);
  assert.deepEqual(cleared.draft.explicitlyClearedFields, ["location", "venue"]);
  const next = await extractConciergeDraft({ message: "26th September", draft: cleared.draft, chatMessages: history }, ai([locationEdit()]));
  assert.equal(next.usedAi, true);
  assert.equal(next.draft.location, null);
  assert.equal(next.draft.venue, null);
  assert.deepEqual(next.draft.explicitlyClearedFields, ["location", "venue"]);
});

test("a fresh event cannot recover facts from the preceding event's conversation", () => {
  const request = { message: "Create a wedding invitation", draft: missedLocation(), chatMessages: history };
  const fresh = fallbackExtractConciergeDraft(request);
  assert.equal(fresh.contextStartMessage, request.message);
  assert.deepEqual(conciergeExtractionConversation(request, fresh), []);
  assert.deepEqual(parseConciergeEdits(payload([locationEdit()]), request, fresh).patch, {});
  const nextRequest = { message: "3pm", draft: fresh, chatMessages: [...history, { role: "user", text: request.message }] };
  assert.deepEqual(conciergeExtractionConversation(nextRequest), [{ role: "user", text: request.message }]);
  assert.deepEqual(parseConciergeEdits(payload([locationEdit()]), nextRequest).patch, {});
});

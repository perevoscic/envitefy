import assert from "node:assert/strict";
import test from "node:test";
import { extractConciergeDraft, normalizeConciergeDraft } from "./extract.ts";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { streamConciergePersona } from "./persona.ts";
import { hasRequiredCopyLanguages, invitationCopyAnswer, nextPendingReply } from "./copy-workflow.ts";

const opening = "I'm planning Elena's 60th birthday in Chicago. Our budget is $600 for food and decorations. Some relatives read English, some Spanish. I'm doing this on my own. No gifts. Keep the exact address private. I'll collect replies privately. Include vegetarian meal requests.";
function briefDraft() { return fallbackExtractConciergeDraft({ message: opening }); }
function writingDraft() { return fallbackExtractConciergeDraft({ message: "Please write the invitation now.", draft: briefDraft() }); }

test("a later invitation request remembers both languages and produces useful TBC copy without AI", () => {
  const draft = writingDraft();
  assert.equal(draft.copyStatus, "provisional");
  assert.match(draft.previewCopy.body, /English\n.*Elena/s);
  assert.match(draft.previewCopy.body, /Español\n.*Elena/s);
  assert.match(draft.previewCopy.body, /adults and children/);
  assert.match(draft.previewCopy.body, /adultos y niños/);
  assert.match(draft.previewCopy.scheduleLine, /TBC/);
  assert.doesNotMatch(draft.previewCopy.body, /\$600|on my own/);
});

test("an incomplete model translation cannot replace the bilingual starting copy", () => {
  const fallback = writingDraft();
  const draft = normalizeConciergeDraft({ previewCopy: { body: "English\nJoin us to celebrate Elena." } }, fallback, { message: "Write the invitation." });
  assert.equal(draft.copyStatus, "provisional");
  assert.equal(hasRequiredCopyLanguages(draft.previewCopy.body, draft), true);
});

test("unrelated model extraction cannot rewrite approved invitation prose", () => {
  const previous = { ...writingDraft(), copyStatus: "ready" };
  const fallback = fallbackExtractConciergeDraft({ message: "The date is October 24, 2099 at 4 pm.", draft: previous });
  const draft = normalizeConciergeDraft({ previewCopy: { body: "A completely different invitation." } }, fallback, { message: "The date is October 24, 2099 at 4 pm.", previousDraft: previous });
  assert.equal(draft.previewCopy.body, previous.previewCopy.body);
  assert.equal(draft.copyStatus, "ready");
  assert.equal(draft.location, previous.location);
});

test("a new language preference refreshes starting copy and marks approved prose for revision", () => {
  const original = writingDraft();
  const starting = fallbackExtractConciergeDraft({ message: "Use only English now.", draft: original });
  assert.deepEqual(starting.hostBrief.languages.values, ["English"]);
  assert.doesNotMatch(starting.previewCopy.body, /Español|Acompáñanos/);
  assert.equal(starting.copyStatus, "provisional");
  assert.doesNotMatch(invitationCopyAnswer(starting), /Cuándo|Dónde/);
  const approved = fallbackExtractConciergeDraft({ message: "Use only English now.", draft: { ...original, copyStatus: "ready" } });
  assert.equal(approved.copyStatus, "needs_update");
});

test("a bare date response never becomes the missing venue", () => {
  const previous = { ...writingDraft(), hostBrief: {}, location: null, venue: null, currentQuestion: "location", missingFields: ["location"] };
  const corrected = fallbackExtractConciergeDraft({ message: "October 24, 2099 at 4 pm", draft: previous });
  assert.equal(corrected.location, null);
});

test("model language blocks must be complete and cannot retain a removed language", () => {
  const bilingual = writingDraft();
  assert.equal(hasRequiredCopyLanguages("English\nEspañol\nAcompáñanos a celebrar a Elena.", bilingual), false);
  const englishOnly = fallbackExtractConciergeDraft({ message: "Use English only.", draft: { ...bilingual, copyStatus: "ready" } });
  const normalized = normalizeConciergeDraft({ previewCopy: bilingual.previewCopy }, englishOnly, { message: "Use English only." });
  assert.equal(normalized.copyStatus, "provisional");
  assert.doesNotMatch(normalized.previewCopy.body, /Español|Acompáñanos/);
});

test("unfinished writing survives unrelated replies and clears only when completed or cancelled", () => {
  const pending = { message: "Write the invitation." };
  for (const unavailable of [false, true]) assert.deepEqual(nextPendingReply(pending, { message: "The date is October 24.", unavailable, copyStatus: "provisional" }), pending);
  assert.equal(nextPendingReply(pending, { message: pending.message, retryReply: true, copyStatus: "ready" }), null);
  assert.deepEqual(nextPendingReply(pending, { message: "Please rewrite the invitation.", unavailable: true, copyStatus: "provisional" }), { message: "Please rewrite the invitation." });
  assert.equal(nextPendingReply(pending, { message: "Cancel the unfinished answer.", copyStatus: "provisional" }), null);
});

test("retrying an interrupted answer uses current facts rather than reapplying the original edits", async () => {
  const current = { ...writingDraft(), title: "Elena's Garden Gathering", titleConfirmed: true, location: "Chicago — exact address shared privately", venue: "Chicago — exact address shared privately" };
  const result = await extractConciergeDraft({
    message: "Set the title to 'Old title'. Set the location to 'Old address'. Please write the invitation.",
    retryReply: true, draft: current,
  }, { openAiApiKey: "" });
  assert.equal(result.draft.title, current.title);
  assert.equal(result.draft.location, current.location);
  assert.deepEqual(result.draft.hostBrief, current.hostBrief);
});

test("an AI retry cannot overwrite current logistics with stale preview fields", async () => {
  const current = { ...writingDraft(), title: "Elena's Garden Gathering", titleConfirmed: true, location: "Chicago — exact address shared privately", venue: "Chicago — exact address shared privately", dateText: "October 24, 2099", timeText: "4 pm" };
  const result = await extractConciergeDraft({ message: "Set the location to 'Old address'. Please write the invitation.", retryReply: true, draft: current }, {
    openAiApiKey: "test-key", createOpenAiClient: () => ({ chat: { completions: { create: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ edits: [{ field: "location", operation: "set", value: "Old address", source: "latest_user_message", sourceText: "Old address" }], previewCopy: { body: current.previewCopy.body, locationLine: "Old address", scheduleLine: "Old date", headline: "Old title", subheadline: "", cta: "View details" } }) } }] }) } } }),
  });
  assert.equal(result.usedAi, true);
  assert.equal(result.draft.previewCopy.locationLine, current.location);
  assert.equal(result.draft.previewCopy.headline, current.title);
  assert.match(result.draft.previewCopy.scheduleLine, /October 24, 2099/);
  assert.doesNotMatch(result.draft.previewCopy.scheduleLine, /Old date/);
});

test("the chat appends the exact canonical wording after contextual planning advice", async () => {
  const draft = writingDraft();
  let payload;
  const deltas = [];
  async function* stream() { yield { choices: [{ delta: { content: "A live card will keep this manageable." } }] }; }
  const result = await streamConciergePersona({ message: "Please write the invitation and help me choose a format.", draft, chatMessages: [], fallbackMessage: "What date?", onDelta: (text) => deltas.push(text) }, {
    openAiApiKey: "test-key", createOpenAiClient: () => ({ chat: { completions: { create: async (request) => { payload = request; return stream(); } } } }),
  });
  assert.equal(result.assistantMessage, `A live card will keep this manageable.\n\n${invitationCopyAnswer(draft)}`);
  assert.equal(deltas.join(""), result.assistantMessage);
  assert.equal(JSON.parse(payload.messages.at(-1).content).invitationWordingWillBeAppended, true);
});

test("a provider outage keeps useful starting copy and makes the interruption recoverable", async () => {
  const draft = writingDraft();
  const result = await streamConciergePersona({ message: "Write the invitation.", draft, chatMessages: [], fallbackMessage: "What date?", onDelta: () => {} }, { openAiApiKey: "" });
  assert.equal(result.unavailable, true);
  assert.match(result.assistantMessage, /Español/);
  assert.doesNotMatch(result.assistantMessage, /What date/);
});

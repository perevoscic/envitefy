import assert from "node:assert/strict";
import test from "node:test";
import { publicContentForDraft } from "./public-content.ts";
import fs from "node:fs";
import ts from "typescript";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { extractConciergeDraft } from "./extract.ts";
import { buildConciergeHistoryPayload } from "./history-payload.ts";
import { buildChatShowcasePreview } from "../../app/chat/chat-preview-adapters.ts";

const logistics = "we going to celebrate at AMC theater Grand Boulevard at 4:00 going to watch forgotten Island then we're going to have pizza at Parkside Santa Rosa beach. She likes purple color she wants a simple birthday background";
const artworkCorrection = "Remove Pizza and forgotten Alien just make a birthday purplish background with a lot of decoration keep it simple and right Livia name in cursive";
function birthdayDraft() {
  let draft = fallbackExtractConciergeDraft({
    message: "Livia, 10 years old, on September 25th 2099",
    starterCategory: "Birthday", requestedOutputs: ["live_card"],
  });
  for (const message of [logistics, "Yes RSVP, 4 people"]) {
    draft = fallbackExtractConciergeDraft({ message, draft });
  }
  return draft;
}

function assertFactsPreserved(before, after) {
  for (const field of ["creationSessionId", "contextStartMessage", "title", "honoreeName", "ageOrMilestone", "eventType", "dateText", "timeText", "startISO", "endISO", "timezone", "location", "venue", "additionalLocations", "rsvpEnabled", "numberOfGuests"]) {
    assert.deepEqual(after[field], before[field], field);
  }
  assert.match(after.previewCopy.headline, /Livia/);
  assert.match(after.previewCopy.scheduleLine, /September 25th.*4:00 PM/);
  assert.equal(after.previewCopy.locationLine, "AMC theater Grand Boulevard");
  assert.doesNotMatch(JSON.stringify(after.previewCopy), /Birthday draft|Location TBD|Por confirmar/);
}

test("the reported itinerary keeps the theater, time and pizza stop as distinct facts", () => {
  const draft = birthdayDraft();
  assert.equal(draft.honoreeName, "Livia");
  assert.equal(draft.timeText, "4:00 PM");
  assert.equal(draft.location, "AMC theater Grand Boulevard");
  assert.equal(draft.venue, draft.location);
  assert.equal(draft.additionalLocations.length, 1);
  assert.equal(draft.additionalLocations[0].label, "Pizza");
  assert.equal(draft.additionalLocations[0].location, "Parkside Santa Rosa beach");
  assert.equal(draft.numberOfGuests, 4);
  assert.equal(draft.rsvpEnabled, true);
  assert.doesNotMatch(draft.theme, /forgotten Island then/);
});

test("the exact screenshot artwork correction retains every event fact through fallback and AI extraction", async () => {
  const before = birthdayDraft();
  const snapshot = structuredClone(before);
  const deterministic = await extractConciergeDraft({ message: artworkCorrection, draft: before }, { openAiApiKey: "" });
  assertFactsPreserved(before, deterministic.draft);
  assert.match(deterministic.draft.theme, /Remove Pizza.*purplish.*Livia.*cursive/);
  let called = false;
  const ai = await extractConciergeDraft({ message: artworkCorrection, draft: before }, {
    openAiApiKey: "test-key",
    createOpenAiClient: () => ({ chat: { completions: { create: async (request) => {
      called = true;
      const input = JSON.parse(request.messages[1].content);
      assertFactsPreserved(before, input.fallbackDraft);
      return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ edits: [
        { field: "theme", operation: "set", value: "Simple purple birthday decorations; no pizza or movie imagery. Livia in cursive.", source: "latest_user_message", sourceText: artworkCorrection },
      ], previewCopy: null }) } }] };
    } } } }),
  });
  assert.equal(called, true);
  assertFactsPreserved(before, ai.draft);
  assert.deepEqual(before, snapshot);

  const preview = buildChatShowcasePreview({ draft: ai.draft, eventId: null, selectedOutput: "live_card", imageUrl: "/qa/birthday.webp", sharePath: null, summary: { ...ai.draft.previewCopy, outputs: ["live_card"] } });
  assert.equal(preview.invitationData.eventDetails.location, before.location);
  assert.equal(preview.invitationData.eventDetails.rsvpEnabled, true);
  assert.equal(preview.invitationData.eventDetails.calendarStartISO, before.startISO);
  const payload = buildConciergeHistoryPayload(ai.draft);
  assert.match(payload.title, /Livia/);
  assert.equal(payload.data.venue, before.location);
  assert.equal(payload.data.liveCard.locationLine, before.location);
});

test("new visual designs never imply a new event even with make, create or generate", () => {
  const before = birthdayDraft();
  for (const message of [
    "Just make a simple purple birthday background.",
    "Create a new birthday design with purple balloons.",
    "Generate a birthday image with Livia in cursive.",
    "Make a different birthday background, no pizza or movie imagery.",
    artworkCorrection,
  ]) assertFactsPreserved(before, fallbackExtractConciergeDraft({ message, draft: before }));
});

test("explicit new events still start with their own facts", () => {
  const before = birthdayDraft();
  for (const message of [
    "Create a wedding invitation with a floral background.",
    "Create another birthday party invitation with a blue background.",
  ]) {
    const next = fallbackExtractConciergeDraft({ message, draft: before });
    assert.equal(next.honoreeName, null);
    assert.equal(next.dateText, null);
    assert.equal(next.location, null);
    assert.equal(next.contextStartMessage, message);
  }
  const next = fallbackExtractConciergeDraft({ message: "Create a birthday invitation for Noah turning 8 with a blue background.", draft: before });
  assert.equal(next.honoreeName, "Noah");
  assert.equal(next.ageOrMilestone, "8");
  assert.equal(next.dateText, null);
  assert.equal(next.location, null);
});

test("artwork edits leave missing logistics unresolved rather than inventing them", () => {
  const before = fallbackExtractConciergeDraft({ message: "Livia is turning 10. Create a birthday live card." });
  const next = fallbackExtractConciergeDraft({ message: artworkCorrection, draft: before });
  assert.equal(next.honoreeName, "Livia");
  assert.equal(next.dateText, null);
  assert.equal(next.startISO, null);
  assert.equal(next.location, null);
});

test("venue extraction removes following clock times without cutting numbered addresses", () => {
  for (const [message, location] of [
    ["Celebrate at AMC Grand Boulevard at 4:00 then pizza at Parkside.", "AMC Grand Boulevard"],
    ["Celebrate at Garden Hall at 4 pm then dinner at Parkside.", "Garden Hall"],
    ["Celebrate at Garden Hall at 12 Main Street.", "Garden Hall at 12 Main Street"],
  ]) assert.equal(fallbackExtractConciergeDraft({ message, starterCategory: "Birthday" }).location, location);
});

test("the chat image request receives the preserved facts and latest artwork direction", () => {
  const source = fs.readFileSync(new URL("../../app/chat/ConciergeChatClient.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("chat.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = new Set(["draftHeadline", "draftSubheadline", "uniqueDisplayLine", "additionalLocationLine", "additionalLocationNarrative", "studioCategoryForDraft", "dateInputFromDraft", "localDateInputFromIso", "timeInputFromDraft", "draftVisualDirection", "buildStudioDetailsFromDraft"]);
  const helpers = ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.has(node.name?.text));
  assert.equal(helpers.length, names.size);
  const build = new Function("stringValue", "createInitialDetails", "skinLabelForDraft", "publicContentForDraft", `${ts.transpile(helpers.map(node => node.getText(ast)).join("\n"))}; return buildStudioDetailsFromDraft;`)(
    value => typeof value === "string" ? value.trim() || null : null, () => ({}), () => "Birthday", publicContentForDraft,
  );
  const draft = fallbackExtractConciergeDraft({ message: artworkCorrection, draft: birthdayDraft() });
  const details = build(draft);
  assert.equal(details.eventTitle, "Livia is turning 10");
  assert.equal(details.name, "Livia");
  assert.equal(details.age, "10");
  assert.equal(details.eventDate, "2099-09-25");
  assert.equal(details.startTime, "16:00");
  assert.equal(details.venueName, "AMC theater Grand Boulevard");
  assert.equal(details.location, details.venueName);
  assert.equal(details.additionalLocations[0].location, "Parkside Santa Rosa beach");
  assert.match(details.theme, /Remove Pizza.*purplish.*Livia.*cursive/);
  assert.doesNotMatch(JSON.stringify(details), /Birthday draft|Location TBD|Por confirmar/);
});

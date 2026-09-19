import assert from "node:assert/strict";
import test from "node:test";
import { fallbackExtractConciergeDraft, parseChrono } from "./fallback.ts";
import { normalizeConciergeDraft } from "./extract.ts";
import { publicContentForDraft, updatePublicContent } from "./public-content.ts";
import { shouldRegenerateGeneratedDraftImageForEdit } from "./artwork-change.ts";
import { parseConciergeEdits } from "./extraction-contract.ts";
import { buildConciergeHistoryPayload } from "./history-payload.ts";
import { conciergeCapabilityAnswer, CONCIERGE_CAPABILITIES } from "./capabilities.ts";
import { guestRsvpGuessRules } from "../guest-rsvp.ts";

const make = (message, draft) => fallbackExtractConciergeDraft({ message, draft, requestedOutputs: draft?.requestedOutputs || ["event_page"] });
const opening = "Create an event page. Title: 'Community Swim Practice'. September 23, 2026. Practice starts at 2 PM at Maple Pool, Austin, TX. Bring goggles and a towel. No diving. Beginners ages 13+ welcome.";

test("Live Card questions distinguish the separate signup builder without changing the selected product", () => {
  assert.match(CONCIERGE_CAPABILITIES.formats["Live card"], /not a Sign-up Form/);
  const previous = fallbackExtractConciergeDraft({
    message: "Create a live card for a workshop on September 23, 2026 at 2 PM at Maple Center.",
    requestedOutputs: ["live_card"],
  });
  for (const message of ["Can a Live Card be a sign-up form?", "Is a livecard a signup sheet?", "What is the difference between a live card and a sign up form?"]) {
    const answer = conciergeCapabilityAnswer(message);
    assert.match(answer, /not a Sign-up Form/);
    assert.match(answer, /separate Sign-up Form builder/);
    const next = make(message, previous);
    assert.deepEqual(next.requestedOutputs, previous.requestedOutputs);
    assert.equal(next.eventType, previous.eventType);
    assert.equal(next.title, previous.title);
  }
});

test("download Q&A promises an image only after acceptance and preserves existing event facts", () => {
  const message = "Can I download this flyer?";
  const answer = conciergeCapabilityAnswer(message);
  assert.match(answer, /Once the artwork is generated and accepted/);
  assert.match(answer, /Download.*image/);
  assert.match(answer, /no working RSVP buttons.*published event link/);
  assert.doesNotMatch(answer, /PDF|download is ready|already (?:saved|generated)/i);
  const previous = make(opening);
  const next = make(message, previous);
  for (const field of ["title", "startISO", "endISO", "eventPurpose"])
    assert.equal(next[field], previous[field], field);
  assert.deepEqual(next.requestedOutputs, previous.requestedOutputs);
});

test("capability registry agrees with default gender guess requirements without promising custom forms", () => {
  assert.equal(guestRsvpGuessRules("Gender Reveal", "yes").required, true);
  assert.match(CONCIERGE_CAPABILITIES.standardRsvp, /requires a guess for Yes.*starts enabled/);
  assert.match(conciergeCapabilityAnswer("Can guests guess boy or girl in RSVP?"), /requires a guess for Yes.*starts enabled/);
  assert.match(CONCIERGE_CAPABILITIES.customForms, /cannot configure arbitrary RSVP questions/);
});

test("polite public-copy edits are applied while capability questions remain read-only", () => {
  let draft = make(opening);
  draft = make("Can you add that guests must bring water?", draft);
  assert.ok(publicContentForDraft(draft).guestInstructions.includes("guests must bring water."));
  const source = draft.publicContent.items.find((item) => item.text === "guests must bring water.");
  assert.equal(source.sourceText, "Can you add that guests must bring water?");
  draft = make("Could you include the exact line 'Ready, set, celebrate!'?", draft);
  assert.ok(publicContentForDraft(draft).requiredArtworkLines.includes("Ready, set, celebrate!"));
  draft = make("Could you remove the line 'Ready, set, celebrate!'?", draft);
  assert.ok(!publicContentForDraft(draft).requiredArtworkLines.includes("Ready, set, celebrate!"));
  const before = draft.publicContent;
  draft = make("Can guests RSVP?", draft);
  assert.deepEqual(draft.publicContent, before);
});

test("a date followed by a labelled start uses the supplied clock and never invents an end", () => {
  const draft = make(opening);
  assert.equal(draft.startISO, "2026-09-23T19:00:00.000Z");
  assert.equal(draft.timeText, "2:00 PM");
  assert.equal(draft.endISO, null);
});

test("date-only intake does not fabricate noon or a duration", () => {
  const schedule = parseChrono("September 23, 2026");
  assert.equal(schedule.startISO, null);
  assert.equal(schedule.endISO, null);
  assert.equal(schedule.timeText, null);
});

test("date-only correction retains the existing local clock and explicit end", () => {
  const previous = { ...make(opening), startISO: "2026-09-22T19:00:00.000Z", endISO: "2026-09-22T21:00:00.000Z", timeText: "2:00 PM", timezone: "America/Chicago" };
  const next = make("Change the date to September 23, 2026.", previous);
  assert.equal(next.startISO, "2026-09-23T19:00:00.000Z");
  assert.equal(next.endISO, "2026-09-23T21:00:00.000Z");
});

test("arrival does not replace an explicitly labelled primary clock", () => {
  const schedule = parseChrono("September 23, 2026. Arrive at 1:30 PM. Kickoff at 2 PM. Ends at 4 PM.");
  assert.equal(schedule.startISO, "2026-09-23T19:00:00.000Z");
  assert.equal(schedule.endISO, "2026-09-23T21:00:00.000Z");
});

test("logistics corrections preserve event purpose and selected output", () => {
  const initial = make("Create an event page for a neighborhood tea gathering on September 23, 2026 at 2 PM at Maple Hall.");
  for (const message of ["It ends at 4 PM.", "The RSVP contact is Priya at priya@example.invalid.", "Change the location to Oak Hall, Austin, TX."]) {
    const next = make(message, initial);
    assert.equal(next.eventPurpose, initial.eventPurpose, message);
    assert.deepEqual(next.requestedOutputs, ["event_page"]);
  }
});

test("anniversary retains both people and milestone without birthday semantics", () => {
  const draft = make("Create an event page for Sam and Alex's 25th anniversary on September 23, 2026 at 2 PM at Maple Hall.");
  assert.equal(draft.eventType, "anniversary");
  assert.match(draft.title, /Sam and Alex/);
  assert.match(draft.title, /25/);
  assert.doesNotMatch(JSON.stringify(draft.previewCopy), /turning|birthday/);
});

test("a stated workshop title and audience do not become a placeholder or honoree", () => {
  const draft = make("Create a workshop event page called 'Watercolor Afternoon'. Adults and teens ages 13+ welcome. September 23, 2026 at 2 PM at Maple Hall. Materials are provided.");
  assert.equal(draft.title, "Watercolor Afternoon");
  assert.equal(draft.honoreeName, null);
  assert.equal(draft.ageOrMilestone, null);
});

test("negated private instructions do not block creation or discard the output", () => {
  const draft = make("Create an event page for a housewarming on September 23, 2026 at 2 PM at Maple Hall. Do not add a door code.");
  assert.equal(draft.sourceContext.boundary, null);
  assert.deepEqual(draft.requestedOutputs, ["event_page"]);
  const unsafe = make("Add the door code 12345.", draft);
  assert.equal(unsafe.sourceContext.boundary, "private_data");
  assert.deepEqual(unsafe.requestedOutputs, ["event_page"]);
});

test("public safety, equipment and eligibility are separate sourced content across subsequent turns", () => {
  let draft = make(opening);
  const initial = draft.publicContent;
  for (const message of ["It ends at 4 PM.", "Will guests see the instructions?", "Keep all event facts. Make the artwork navy and silver."]) draft = make(message, draft);
  assert.deepEqual(draft.publicContent, initial);
  const content = publicContentForDraft(draft);
  assert.ok(content.guestInstructions.includes("Bring goggles and a towel."));
  assert.ok(content.guestInstructions.includes("No diving."));
  assert.ok(content.guestInstructions.includes("Beginners ages 13+ welcome."));
  assert.equal(content.semanticKind, "practice");
  for (const item of draft.publicContent.items) assert.ok(item.sourceMessage.includes(item.sourceText));
});

test("requirements deduplicate, replace and remove without leaking private direction or hypotheses", () => {
  let content = updatePublicContent(null, "Keep the exact line 'Practice with confidence'. Bring water. My budget is $20. Maybe bring snacks? Do not add a door code. Draw players wearing goggles.");
  content = updatePublicContent(content, "Bring water.");
  assert.equal(content.items.filter(item => item.text === "Bring water.").length, 1);
  assert.equal(content.revision, 1);
  content = updatePublicContent(content, "Replace the exact line 'Practice with confidence' with 'Train together'.");
  content = updatePublicContent(content, "Remove the instruction 'Bring water'.");
  assert.deepEqual(content.items.map(item => item.text), ["Train together"]);
});

test("faulty extraction cannot turn a location correction into identity or implied gift facts", () => {
  const previous = make(opening);
  const message = "Change the location to Oak Pool, Austin, TX.";
  const fallback = make(message, previous);
  const next = normalizeConciergeDraft({ eventType: "birthday", eventPurpose: message, title: "Birthday draft", honoreeName: "Teens", ageOrMilestone: "13", giftNote: "Your presence is the best gift.", timeText: "12 PM", startISO: "2026-09-23T17:00:00.000Z", endISO: "2026-09-23T19:00:00.000Z" }, fallback, { message, previousDraft: previous });
  for (const field of ["eventType", "title", "honoreeName", "ageOrMilestone", "eventPurpose", "startISO", "endISO", "timeText"]) assert.equal(next[field], fallback[field], field);
  assert.equal(next.giftNote, null);
  assert.deepEqual(next.publicContent, previous.publicContent);
});

test("manual host contact survives an explicit online RSVP-off choice", () => {
  const message = "Create an appointment event page titled 'Family Portraits' on September 23, 2026 at 2 PM at Maple Studio. No online RSVP. RSVP by email only at portraits@example.invalid.";
  const fallback = make(message);
  const draft = normalizeConciergeDraft({}, fallback, { message });
  assert.equal(draft.rsvpEnabled, false);
  assert.equal(draft.rsvpContact, "portraits@example.invalid");
});

test("exact-line changes redraw headline artwork and update Event Page HTML without redrawing a text-free hero", () => {
  const previousDraft = make(opening);
  const userMessage = "Please keep the exact line 'Practice with confidence'.";
  const nextDraft = make(userMessage, previousDraft);
  for (const artworkTextMode of ["headline", "complete_invitation", "none"]) {
    assert.equal(shouldRegenerateGeneratedDraftImageForEdit({ userMessage, previousDraft, nextDraft, artworkTextMode }), artworkTextMode !== "none");
  }
});

test("an exact citation does not authorize unrelated clears or changes made by a question", () => {
  const draft = make(opening);
  for (const message of ["Remove the footer illustration.", "Can guests see the title and location?"]) {
    const edits = ["title", "location", "giftNote"].map(field => ({ field, operation: "clear", value: null, source: "latest_user_message", sourceText: message }));
    const result = parseConciergeEdits({ edits, previewCopy: null }, { message, draft }, draft);
    assert.deepEqual(result.accepted, []);
  }
  const message = "Remove the location.";
  const result = parseConciergeEdits({ edits: [{ field: "location", operation: "clear", value: null, source: "latest_user_message", sourceText: message }], previewCopy: null }, { message, draft }, draft);
  assert.deepEqual(result.accepted, ["location"]);
});

test("an explicit IANA zone resolves the wall clock independently of the machine zone", () => {
  const draft = make("Create an event page titled 'Afternoon Practice' on September 23, 2026 at 2 PM America/New_York at Maple Pool.");
  assert.equal(draft.timezone, "America/New_York");
  assert.equal(draft.startISO, "2026-09-23T18:00:00.000Z");
  assert.equal(draft.endISO, null);
});

test("long required wording and guest instructions in the creation sentence are not silently dropped", () => {
  const exact = `Safety instructions: ${"Stay with your assigned adult and bring a reusable water bottle. ".repeat(12).trim()}`;
  const content = updatePublicContent(null, `Keep the exact wording '${exact}'.`);
  assert.deepEqual(content.items.map(item => item.text), [exact]);
  const inline = updatePublicContent(null, "Create a workshop event page for September 23, 2026 and guests must bring safety goggles.");
  assert.deepEqual(inline.items.map(item => item.text), ["guests must bring safety goggles."]);
  const contraction = updatePublicContent(null, "Keep the exact line 'Don't forget your child's water bottle!'.");
  assert.deepEqual(contraction.items.map(item => item.text), ["Don't forget your child's water bottle!"]);
});

test("saved local event dates and clocks do not move to the next UTC day", () => {
  const draft = make("Create an event page titled 'Late Practice' on September 23, 2026 at 11 PM America/Los_Angeles at Maple Pool.");
  const details = buildConciergeHistoryPayload(draft).data.studioCard.invitationData.eventDetails;
  assert.equal(details.eventDate, "2026-09-23");
  assert.equal(details.startTime, "11:00 PM");
  assert.equal(details.calendarStartISO, "2026-09-24T06:00:00.000Z");
});

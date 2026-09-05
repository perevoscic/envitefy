import assert from "node:assert/strict";
import test from "node:test";
import { extractExplicitEventLocation, extractExplicitEventTitle, hasStalePreviewFacts } from "./conversation-edits.ts";
import { fallbackExtractConciergeDraft } from "./fallback.ts";

const opening = "I'm a bit overwhelmed. I'm organising my mum Elena's 60th, about 28 people in Chicago, and I want her to feel celebrated without it looking like a kids' birthday. She loves gardens and old jazz records. Some relatives read Spanish, some English. I've got about $600 for food and decorations, and I'm doing this on my own. I need something I can share in our family WhatsApp group myself. I haven't picked a date or venue. Please help me work out a sensible starting point rather than ask me a whole form of questions.";
const correction = "Keep only the live card and title it exactly 'Elena, 60 años de alegría'. Move it to Saturday October 24, 2026, 4 to 7 pm; October 18 is cancelled. Keep 'Chicago — exact address shared privately' as the location. Turn the online RSVP off: I'll collect replies myself. No gifts, garden and vintage jazz, and equal English and Spanish text. Please write the invitation now, including a request for a private reply with the number coming and vegetarian meals needed.";

function existingDraft() {
  return fallbackExtractConciergeDraft({
    message: "Create a live card for Elena's 60th birthday on October 18, 2026, from 4 to 7 pm at My home in Chicago. Garden and vintage jazz, elegant. Collect RSVPs for 28 guests. No gifts.",
  });
}

test("a worried host's introduction becomes event facts rather than the whole draft title", () => {
  const draft = fallbackExtractConciergeDraft({ message: opening });
  assert.equal(draft.eventType, "birthday");
  assert.equal(draft.honoreeName, "Elena");
  assert.equal(draft.ageOrMilestone, "60");
  assert.equal(draft.relationship, "mum");
  assert.match(draft.title, /Elena.*60/);
  assert.ok(draft.title.length < 80);
  assert.doesNotMatch(draft.title, /overwhelmed|organising|questions/);
});

test("unknown events never use a long conversational introduction as a canonical title", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "I need an event page. I'm feeling overwhelmed and trying to get everyone together. There are a lot of things to decide and I don't have a name yet. We are getting together in Chicago with friends and neighbours to reconnect after being apart for a long time.",
  });
  assert.ok(!draft.title || draft.title.length <= 140);
  assert.doesNotMatch(draft.title || "", /I'm feeling|I need|We are getting/);
});

test("exact titles support natural imperative wording, punctuation and apostrophes", () => {
  for (const message of [
    "Title it exactly 'Elena, 60 años de alegría'.",
    "Keep the title as ‘Elena, 60 años de alegría’. No gifts.",
    "Change the title to exactly \"Elena, 60 años de alegría\".",
  ]) assert.equal(extractExplicitEventTitle(message), "Elena, 60 años de alegría");
  assert.equal(extractExplicitEventTitle("Title it exactly 'Mum's Garden Party'. Keep it simple."), "Mum's Garden Party");
});

test("one natural correction independently updates title, schedule, location and RSVP", () => {
  const draft = fallbackExtractConciergeDraft({ message: correction, draft: existingDraft() });
  assert.equal(draft.title, "Elena, 60 años de alegría");
  assert.equal(draft.titleConfirmed, true);
  assert.deepEqual(draft.requestedOutputs, ["live_card"]);
  assert.equal(draft.location, "Chicago — exact address shared privately");
  assert.equal(draft.rsvpEnabled, false);
  assert.equal(draft.numberOfGuests, 28);
  assert.ok(!draft.missingFields.includes("rsvpContact"));
  const start = new Date(draft.startISO);
  const end = new Date(draft.endISO);
  assert.equal(start.getMonth(), 9);
  assert.equal(start.getDate(), 24);
  assert.equal(start.getHours(), 16);
  assert.equal(end.getHours(), 19);
});

test("moving the date does not overwrite the venue even when a later clause mentions location", () => {
  const previous = existingDraft();
  for (const message of [
    "Move it to October 24, 2026 at 4 pm. Keep the location the same.",
    "Actually move it to Saturday October 24, 2026, 4 to 7 pm; the location is unchanged.",
  ]) {
    const draft = fallbackExtractConciergeDraft({ message, draft: previous });
    assert.equal(draft.location, previous.location);
    assert.equal(new Date(draft.startISO).getDate(), 24);
  }
});

test("location changes stop at the next instruction and allow exact quoted names", () => {
  assert.equal(extractExplicitEventLocation("The location should say only 'Chicago — exact address shared privately'; the date is October 24."), "Chicago — exact address shared privately");
  for (const [message, location] of [
    ["Move it to Grant Park, Chicago.", "Grant Park, Chicago"],
    ["Actually move it to Grant Park, Chicago. No gifts.", "Grant Park, Chicago"],
    ["Change the location to Grant Park, Chicago; turn online RSVP off.", "Grant Park, Chicago"],
    ["Set the venue to \"St. Mary's Garden, Chicago\". Keep the same date.", "St. Mary's Garden, Chicago"],
  ]) assert.equal(fallbackExtractConciergeDraft({ message, draft: existingDraft() }).location, location);
});

test("a date or title correction preserves approved bilingual guest prose", () => {
  const previous = existingDraft();
  previous.copyStatus = "ready";
  previous.previewCopy.body = "Celebrate Elena with garden flowers and vintage jazz. Celebremos a Elena entre flores y jazz clásico.";
  const draft = fallbackExtractConciergeDraft({ message: correction.split("Please write")[0], draft: previous });
  assert.equal(draft.previewCopy.body, previous.previewCopy.body);
  assert.equal(draft.previewCopy.headline, "Elena, 60 años de alegría");
  assert.equal(draft.previewCopy.locationLine, "Chicago — exact address shared privately");
  assert.match(draft.previewCopy.scheduleLine, /October 24/);
});

test("explicit RSVP toggles take precedence over stale extracted values and remain reversible", () => {
  for (const message of ["Turn the online RSVP off.", "Switch off the RSVP.", "Disable online RSVPs.", "Set RSVP to off.", "Can you turn online RSVP off, please?"]) {
    const draft = fallbackExtractConciergeDraft({ message, draft: existingDraft(), ocrContext: { fieldsGuess: { rsvpEnabled: true } } });
    assert.equal(draft.rsvpEnabled, false, message);
    const restored = fallbackExtractConciergeDraft({ message: "Turn online RSVP on.", draft });
    assert.equal(restored.rsvpEnabled, true);
  }
});

test("removing host contact information clears previously saved contact fields", () => {
  const previous = { ...existingDraft(), rsvpContact: "elena-host@example.com", rsvpName: "Host", rsvpDeadline: "October 11" };
  const draft = fallbackExtractConciergeDraft({ message: "Turn online RSVP off. No host phone or email on the card.", draft: previous });
  assert.equal(draft.rsvpContact, null);
  assert.equal(draft.rsvpName, null);
  assert.equal(draft.rsvpDeadline, null);
  assert.equal(draft.numberOfGuests, 28);
});

test("saved prose cannot retain a removed host contact or the superseded event date", () => {
  for (const body of [
    "Celebrate Elena on October 18, 2026. Celebremos a Elena el 18 de octubre de 2026.",
    "Celebrate Elena. Reply to elena-host@example.com.",
  ]) {
    const previous = { ...existingDraft(), rsvpContact: "elena-host@example.com" };
    previous.previewCopy.body = body;
    const draft = fallbackExtractConciergeDraft({ message: `${correction} No host phone or email on the card.`, draft: previous });
    assert.doesNotMatch(draft.previewCopy.body, /October 18|18 de octubre|elena-host@example.com/);
  }
});

test("the factual guard accepts corrected prose and unrelated dates and bilingual style", () => {
  const previous = existingDraft();
  const next = fallbackExtractConciergeDraft({ message: correction, draft: previous });
  assert.equal(hasStalePreviewFacts("Celebrate Elena on October 24, 2026. Celebremos a Elena el 24 de octubre de 2026.", previous, next), false);
  assert.equal(hasStalePreviewFacts("Celebrate Elena with vintage jazz. Celebremos a Elena con jazz clásico. Bring a favorite memory from June 3.", previous, next), false);
  assert.equal(hasStalePreviewFacts("Celebremos a Elena el 18 de octubre de 2026.", previous, next), true);
});

test("stale copy checks project ISO facts into the event timezone rather than server time", () => {
  for (const [timezone, oldTime, newTime] of [
    ["America/Chicago", "4 pm", "5 pm"],
    ["Asia/Tokyo", "6 am", "7 am"],
  ]) {
    const previous = { ...existingDraft(), timezone, startISO: "2026-10-18T21:00:00Z", endISO: "2026-10-19T00:00:00Z" };
    const next = { ...previous, startISO: "2026-10-18T22:00:00Z", endISO: "2026-10-19T01:00:00Z" };
    assert.equal(hasStalePreviewFacts(`Join us at ${oldTime}.`, previous, next), true, timezone);
    assert.equal(hasStalePreviewFacts(`Join us at ${newTime}.`, previous, next), false, timezone);
  }
  const previous = { ...existingDraft(), timezone: "America/Chicago", startISO: "2026-10-19T01:00:00Z", endISO: "2026-10-19T03:00:00Z" };
  const next = { ...previous, startISO: "2026-10-25T01:00:00Z", endISO: "2026-10-25T03:00:00Z" };
  assert.equal(hasStalePreviewFacts("Celebrate on October 18.", previous, next), true);
  assert.equal(hasStalePreviewFacts("Celebrate on October 24.", previous, next), false);
  const later = { ...previous, startISO: previous.endISO, endISO: "2026-10-19T04:00:00Z" };
  assert.equal(hasStalePreviewFacts("Join us at 10 pm.", previous, later), false);
});

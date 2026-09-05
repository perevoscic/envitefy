import assert from "node:assert/strict";
import test from "node:test";
import { applyHostPrivacy } from "./host-privacy.ts";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { normalizeConciergeDraft } from "./extract.ts";

function draftWithAddress() {
  const draft = fallbackExtractConciergeDraft({ message: "Create a live card for Elena's 60th birthday on October 18, 2099 from 4 to 7 pm at 123 Example Street, Chicago. No gifts. No RSVP." });
  return { ...draft, location: "123 Example Street, Chicago", venue: "123 Example Street, Chicago", copyStatus: "ready", previewCopy: { ...draft.previewCopy, locationLine: "123 Example Street, Chicago" } };
}
function privateDraft(previous) {
  return { ...previous, hostBrief: { privacyPreferences: [{ kind: "address_private", sourceText: "Keep the exact address private." }] } };
}

test("a privacy instruction protects canonical fields even if the preview was already masked", () => {
  const previous = draftWithAddress();
  const draft = privateDraft(previous);
  draft.previewCopy = { ...draft.previewCopy, locationLine: "Exact address shared privately" };
  const result = applyHostPrivacy(draft, previous);
  assert.equal(result.location, "Exact address shared privately");
  assert.equal(result.venue, result.location);
  assert.equal(result.previewCopy.locationLine, result.location);
  assert.equal(result.previewCopy.body, draft.previewCopy.body);
  assert.equal(result.copyStatus, "ready");
  assert.equal(previous.location, "123 Example Street, Chicago");
});

test("an intentional coarse location survives but adding 'private' cannot conceal a street address", () => {
  const previous = draftWithAddress();
  const coarse = { ...privateDraft(previous), location: "Chicago — exact address shared privately", venue: "Chicago — exact address shared privately" };
  assert.equal(applyHostPrivacy(coarse, previous).location, coarse.location);
  const unsafe = { ...privateDraft(previous), location: "123 Example Street, Chicago — exact address shared privately" };
  assert.equal(applyHostPrivacy(unsafe).location, "Exact address shared privately");
});

test("additional stops retain their sequence and time but lose private address and map fields", () => {
  const draft = privateDraft(draftWithAddress());
  draft.additionalLocations = [{ label: "Dinner", timeText: "7 pm", venue: "456 Sample Road", location: "456 Sample Road, Chicago", address: "456 Sample Road", mapQuery: "456 Sample Road Chicago", description: "Dinner at 456 Sample Road." }];
  const result = applyHostPrivacy(draft);
  assert.equal(result.additionalLocations[0].label, "Dinner");
  assert.equal(result.additionalLocations[0].timeText, "7 pm");
  assert.equal(result.additionalLocations[0].location, "Exact address shared privately");
  for (const field of ["venue", "address", "mapQuery", "description"]) assert.equal(result.additionalLocations[0][field], null);
});

test("removed private address paragraphs cannot survive in approved bilingual guest prose", () => {
  const previous = draftWithAddress();
  const draft = privateDraft(previous);
  draft.previewCopy = { ...draft.previewCopy, body: "English\nCelebrate Elena with vintage jazz.\nJoin us at 123 Example Street.\n\nEspañol\nCelebremos a Elena con jazz clásico.\nNos vemos en 123 Example Street, Chicago." };
  const result = applyHostPrivacy(draft, previous);
  assert.doesNotMatch(result.previewCopy.body, /123 Example Street/);
  assert.match(result.previewCopy.body, /Celebrate Elena with vintage jazz/);
  assert.match(result.previewCopy.body, /Celebremos a Elena con jazz clásico/);
  assert.equal(result.copyStatus, "needs_update");
});

test("confirmed contact privacy removes saved and stale prose contacts while keeping schedule facts", () => {
  const previous = { ...draftWithAddress(), rsvpContact: "(312) 555-0123" };
  const draft = { ...previous, rsvpContact: null, hostBrief: { privacyPreferences: [{ kind: "contact_private", sourceText: "No host phone or email on the card." }] } };
  draft.previewCopy = { ...draft.previewCopy, body: "Celebrate Elena.\nCall 312-555-0123.\nEmail host@example.com.\nOctober 18, 2099, 4–7 pm." };
  const result = applyHostPrivacy(draft, previous);
  assert.equal(result.rsvpContact, null);
  assert.doesNotMatch(result.previewCopy.body, /555|example.com/);
  assert.match(result.previewCopy.body, /October 18/);
  assert.equal(result.location, previous.location);
  assert.equal(result.copyStatus, "needs_update");
});

test("missing privacy preferences and explicit retractions do not redact public event details", () => {
  const previous = draftWithAddress();
  assert.equal(applyHostPrivacy(previous), previous);
  const retracted = { ...previous, hostBrief: { privacyPreferences: [] } };
  assert.equal(applyHostPrivacy(retracted, privateDraft(previous)), retracted);
});

test("all-private guest prose becomes empty and needs review rather than invented replacement wording", () => {
  const draft = privateDraft(draftWithAddress());
  draft.previewCopy = { ...draft.previewCopy, body: "Join us at 123 Example Street, Chicago." };
  const result = applyHostPrivacy(draft);
  assert.equal(result.previewCopy.body, "");
  assert.equal(result.copyStatus, "needs_update");
});

test("privacy is enforced through fallback and AI normalization, including stale model fields", () => {
  const previous = draftWithAddress();
  const fallback = fallbackExtractConciergeDraft({ message: "Keep the exact address private. Please write the invitation.", draft: previous });
  assert.doesNotMatch(fallback.location, /123 Example/);
  const normalized = normalizeConciergeDraft({ location: previous.location, venue: previous.venue, previewCopy: { body: "Join us at 123 Example Street, Chicago." } }, fallback, { previousDraft: previous });
  assert.doesNotMatch(JSON.stringify([normalized.location, normalized.venue, normalized.previewCopy]), /123 Example/);
});

test("online RSVP can stay enabled without repeatedly demanding a hidden host contact", () => {
  const previous = { ...draftWithAddress(), rsvpEnabled: true, numberOfGuests: 28, rsvpName: "Ana", rsvpContact: "host@example.com", tone: "warm and elegant" };
  const result = fallbackExtractConciergeDraft({ message: "Keep online RSVP on, but no host phone or email on the card.", draft: previous });
  assert.equal(result.rsvpEnabled, true);
  assert.equal(result.rsvpContact, null);
  assert.notEqual(result.currentQuestion, "rsvpContact");
  assert.equal(result.missingFields.includes("rsvpContact"), false);
});

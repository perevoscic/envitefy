import assert from "node:assert/strict";
import test from "node:test";
import { fallbackExtractConciergeDraft } from "../../lib/concierge/fallback.ts";
import { buildChatShowcasePreview } from "./chat-preview-adapters.ts";

const draft = () => ({
  ...fallbackExtractConciergeDraft({
    message: "Birthday Live Card", requestedOutputs: ["live_card"],
    action: "starter_category", starterCategory: "Birthday",
  }),
  title: "Livia is turning 10", honoreeName: "Livia", ageOrMilestone: "10",
  location: "grand Boulevard amc", venue: "grand Boulevard amc",
  startISO: "2026-09-27T01:30:00.000Z", endISO: "2026-09-27T03:00:00.000Z",
  timezone: "America/Chicago", timeText: "8:30 PM", dateText: "26th September",
  rsvpEnabled: true, registryLink: "https://example.com/gifts",
});
const build = (eventDraft, eventId = null) => buildChatShowcasePreview({
  draft: eventDraft, eventId, selectedOutput: "live_card", imageUrl: "/studio/birthday.webp",
  sharePath: eventId ? `/event/${eventId}` : null,
  summary: { headline: "Livia is turning 10", subheadline: "Movie night", scheduleLine: "September 26 at 8:30 PM", locationLine: "grand Boulevard amc", outputs: ["live_card"] },
});

test("live preview prefills guest actions from the current draft before publication", () => {
  const preview = build(draft());
  const details = preview.invitationData.eventDetails;
  assert.equal(preview.sharePath, undefined);
  assert.equal(details.eventId, "");
  assert.equal(details.location, "grand Boulevard amc");
  assert.equal(details.rsvpEnabled, true);
  assert.equal(details.rsvpMode, "envitefy");
  assert.equal(details.registryLink, "https://example.com/gifts");
  assert.equal(details.rsvpUrl, "");
});

test("calendar actions preserve the event timezone and actual start/end instants", () => {
  const details = build(draft()).invitationData.eventDetails;
  assert.equal(details.eventDate, "2026-09-26");
  assert.equal(details.startTime, "20:30");
  assert.equal(details.endTime, "22:00");
  assert.equal(details.calendarStartISO, "2026-09-27T01:30:00.000Z");
  assert.equal(details.calendarEndISO, "2026-09-27T03:00:00.000Z");
});

test("disabled RSVP and skipped gift links do not become live-card actions", () => {
  const details = build({ ...draft(), rsvpEnabled: false, registryLink: null }).invitationData.eventDetails;
  assert.equal(details.rsvpMode, "");
  assert.equal(details.rsvpName, "");
  assert.equal(details.rsvpContact, "");
  assert.equal(details.registryLink, "");
});

test("a date-only draft does not present an invented start time for calendar actions", () => {
  const details = build({ ...draft(), timeText: null }).invitationData.eventDetails;
  assert.equal(details.startTime, "");
  assert.equal(details.calendarStartISO, "");
});

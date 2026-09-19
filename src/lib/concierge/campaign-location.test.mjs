import assert from "node:assert/strict";
import test from "node:test";
import { fallbackExtractConciergeDraft } from "./fallback.ts";

const originalLocation = "Maple Community Center, Room A, 100 Example Lane, Austin, TX";
const correctedLocation = "Maple Community Center, Room B, 100 Example Lane, Austin, TX";
const opening = () => fallbackExtractConciergeDraft({
  message: `Create a birthday live card for Nora turning 7 on October 30, 2026 at 2:00 PM at ${originalLocation}. No gifts.`,
  requestedOutputs: ["live_card"],
});

test("comma-separated time and venue facts keep only the complete venue in location", () => {
  for (const clock of ["2:00 PM", "2pm", "14:00"]) {
    const draft = fallbackExtractConciergeDraft({
      message: `Create a birthday live card for Nora turning 7 on October 30, 2026 at ${clock}, ${originalLocation}. No gifts.`,
      requestedOutputs: ["live_card"],
    });
    assert.equal(draft.location, originalLocation, clock);
  }
});

test("explicit venue corrections retain the complete address and omit the old venue and instructions", () => {
  for (const message of [
    `One correction: the venue is ${correctedLocation}, not ${originalLocation}. Please keep the other details exactly as we agreed.`,
    `Actually the location should be ${correctedLocation}. Please keep the other details.`,
    `Change the venue to ${correctedLocation}; turn online RSVP off.`,
  ]) {
    const before = opening();
    const after = fallbackExtractConciergeDraft({ message, draft: before });
    assert.equal(after.location, correctedLocation, message);
    assert.equal(after.venue, correctedLocation, message);
    assert.equal(after.previewCopy.locationLine, correctedLocation, message);
    assert.equal(after.honoreeName, before.honoreeName);
    assert.equal(after.startISO, before.startISO);
    const artworkEdit = fallbackExtractConciergeDraft({ message: "Make the background darker and lettering larger. Keep this same event and all the facts.", draft: after });
    assert.equal(artworkEdit.location, correctedLocation);
  }
});

test("unquoted corrections preserve named venues, abbreviations and comma-separated addresses", () => {
  const location = "St. Mary's Hall, Room B, 100 Example Dr., Austin, TX";
  const after = fallbackExtractConciergeDraft({ message: `The venue is ${location}. Keep the date the same.`, draft: opening() });
  assert.equal(after.location, location);
  const quoted = fallbackExtractConciergeDraft({ message: `Set the venue to "${location}". Keep the date the same.`, draft: opening() });
  assert.equal(quoted.location, location);
});

test("time-only corrections cannot become locations with or without an existing venue", () => {
  const before = opening();
  for (const message of [
    "The bus returns at 3:00 PM, not 2:30 PM.",
    "It ends at 4:00 PM, not 3:00 PM.",
    "3:00 PM, not 2:30 PM",
    "At 3:00PM, not 2:30PM.",
  ]) {
    assert.equal(fallbackExtractConciergeDraft({ message, draft: before }).location, before.location, message);
    const missing = { ...before, location: null, venue: null, missingFields: ["location"], currentQuestion: "location" };
    assert.equal(fallbackExtractConciergeDraft({ message, draft: missing }).location, null, message);
  }
});

test("a place supplied alongside a corrected time is still captured", () => {
  const before = { ...opening(), location: null, venue: null, missingFields: ["location"], currentQuestion: "location" };
  const after = fallbackExtractConciergeDraft({ message: "The bus returns at 3:00 PM at Maple Community Center, Room B.", draft: before });
  assert.equal(after.location, "Maple Community Center, Room B");
});

test("coarse Game Day picker context cannot replace a known sports category during fact corrections", () => {
  for (const eventType of ["football", "gym_meet", "sport_event"]) {
    const before = { ...opening(), eventType, title: "Cedar Hawks vs Maple Bears", honoreeName: null, ageOrMilestone: null };
    for (const categoryContext of [{ activeContext: { selectedCategory: "Game Day" } }, { starterCategory: "Game Day" }]) {
      const after = fallbackExtractConciergeDraft({
        message: `One correction: the venue is ${correctedLocation}, not ${originalLocation}. Please keep the other details exactly as we agreed.`,
        draft: before, ...categoryContext,
      });
      assert.equal(after.eventType, eventType);
      assert.equal(after.location, correctedLocation);
      assert.equal(after.title, before.title);
      assert.equal(after.startISO, before.startISO);
      assert.equal(after.endISO, before.endISO);
    }
  }
});

test("venue names cannot reclassify the event but explicit category changes still work", () => {
  const before = { ...opening(), eventType: "football", title: "Cedar Hawks vs Maple Bears", honoreeName: null, ageOrMilestone: null };
  const venueEdit = fallbackExtractConciergeDraft({ message: "The venue is Wedding Hall, 100 Example Lane, Austin, TX. Keep the other details.", draft: before });
  assert.equal(venueEdit.eventType, "football");
  assert.equal(venueEdit.location, "Wedding Hall, 100 Example Lane, Austin, TX");
  const categoryEdit = fallbackExtractConciergeDraft({ message: "Change the event category to wedding. The venue is Garden Hall.", draft: before });
  assert.equal(categoryEdit.eventType, "wedding");
});

test("a schedule-only correction preserves distinct venue name and street address", () => {
  const before = { ...opening(), eventType: "field_trip", title: "Grade Two Nature Museum Trip", location: "300 Example Lane, Austin, TX", venue: "Example Nature Museum", honoreeName: null, ageOrMilestone: null };
  for (const message of [
    "It ends at 2:30 PM. All times are America/Chicago.",
    "Small correction: the bus returns at 3:00 PM, not 2:30 PM. That is also the end of the trip. The departure time and museum location stay the same.",
  ]) {
    const after = fallbackExtractConciergeDraft({ message, draft: before });
    assert.equal(after.location, before.location);
    assert.equal(after.venue, before.venue);
    assert.equal(after.eventType, before.eventType);
  }
});

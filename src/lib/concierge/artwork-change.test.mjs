import assert from "node:assert/strict";
import test from "node:test";
import { shouldRegenerateGeneratedDraftImageForEdit as redraw } from "./artwork-change.ts";

const draft = { title: "LIVIA IS TURNING 10!", honoreeName: "Livia", ageOrMilestone: "10", eventType: "birthday", theme: "Toy concert", tone: "playful", dateText: "October 24", timeText: "4 PM", venue: "Hall", location: "Austin", rsvpEnabled: true };
const edit = (changes, userMessage, artworkTextMode = "headline") => redraw({ previousDraft: draft, nextDraft: { ...draft, ...changes }, userMessage, artworkTextMode });
test("headline artwork stays intact across changes to panel details", () => {
  for (const changes of [{ dateText: "October 25", startISO: "2026-10-25T16:00:00" }, { timeText: "5 PM" }, { venue: "New Hall", location: "Dallas" }, { rsvpEnabled: false }, { rsvpDeadline: "October 20" }]) {
    assert.equal(edit(changes, "Update the event details"), false);
  }
});
test("explicitly preserving artwork does not trigger a new image", () => {
  for (const userMessage of ["Keep the artwork unchanged; update the date", "Leave the design exactly the same. Move it to Sunday", "Don't change the image, update the time", "Do not regenerate the artwork. Use 5 PM."]) {
    assert.equal(edit({ timeText: "5 PM" }, userMessage), false, userMessage);
  }
});
test("visual and printed wording changes redraw the appropriate products", () => {
  assert.equal(edit({}, "Make the background purple"), true);
  assert.equal(edit({ theme: "Space" }, "Use a space theme"), true);
  assert.equal(edit({ title: "LIVIA IS 11!" }, "Change the headline"), true);
  assert.equal(edit({ timeText: "5 PM" }, "Change the time", "complete_invitation"), true);
  assert.equal(edit({ rsvpName: "Sam" }, "RSVP contact is Sam", "complete_invitation"), true);
  assert.equal(redraw({ previousDraft: draft, nextDraft: { ...draft, timeText: "5 PM" }, userMessage: "Change the time" }), true);
  assert.equal(edit({ title: "New title", timeText: "5 PM" }, "Update the details", "none"), false);
});

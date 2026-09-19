import assert from "node:assert/strict";
import test from "node:test";
import { buildGuestRsvpSubmission, guestRsvpCategory, guestRsvpGuessRules } from "./guest-rsvp.ts";
import { parseGenderRevealConfig } from "./gender-reveal.ts";
const guest = { name: "Taylor QA", email: "qa@example.com", category: "Gender Reveal" };
test("accepted generated Baby Shower visual keeps Gender Reveal validation through eventKind", () => {
  const category = guestRsvpCategory({ category: "Baby Shower", eventKind: "gender_reveal" });
  assert.equal(category, "Gender Reveal");
  assert.throws(() => buildGuestRsvpSubmission({ ...guest, category, response: "yes" }), /Team Pink/);
  assert.deepEqual(buildGuestRsvpSubmission({ ...guest, category, response: "yes", genderGuess: "pink" }).answersJson, { genderGuess: "pink" });
  assert.equal(guestRsvpCategory({ category: "Baby Shower", eventKind: "baby_shower" }), "Baby Shower");
});
test("guest submission sends the answer shape required by gender-reveal API", () => {
  assert.throws(() => buildGuestRsvpSubmission({ ...guest, response: "yes" }), /Team Pink/);
  assert.deepEqual(buildGuestRsvpSubmission({ ...guest, response: "yes", genderGuess: "blue" }).answersJson, { genderGuess: "blue" });
  assert.equal(buildGuestRsvpSubmission({ ...guest, response: "no" }).answersJson, undefined);
  assert.equal(buildGuestRsvpSubmission({ ...guest, response: "maybe" }).answersJson, undefined);
});
test("disabled or locked guesses are not requested or sent by guest clients", () => {
  for (const genderRevealConfig of [parseGenderRevealConfig({ genderReveal: { guessesEnabled: false } }), parseGenderRevealConfig({ genderReveal: { revealed: true } })]) {
    assert.equal(guestRsvpGuessRules("Gender Reveal", "yes", genderRevealConfig).collect, false);
    assert.equal(buildGuestRsvpSubmission({ ...guest, response: "yes", genderGuess: "pink", genderRevealConfig }).answersJson, undefined);
  }
});

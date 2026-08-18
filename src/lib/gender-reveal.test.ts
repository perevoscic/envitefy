import assert from "node:assert/strict";
import test from "node:test";

import {
  areGenderRevealGuessesLocked,
  buildGenderRevealLiveStrip,
  buildGenderRevealRsvpAnswers,
  canGuestSeeGenderRevealTally,
  genderRevealMemoryLine,
  isGenderRevealEventData,
  isGenderRevealGuessRequired,
  normalizeGenderRevealGuess,
  parseGenderRevealConfig,
  shouldCollectGenderRevealGuess,
  tallyGenderRevealGuesses,
} from "./gender-reveal.ts";

test("normalizes Team Pink / Team Blue aliases", () => {
  assert.equal(normalizeGenderRevealGuess("Team Pink"), "pink");
  assert.equal(normalizeGenderRevealGuess("girl"), "pink");
  assert.equal(normalizeGenderRevealGuess("team_blue"), "blue");
  assert.equal(normalizeGenderRevealGuess("boy"), "blue");
  assert.equal(normalizeGenderRevealGuess("yellow"), null);
});

test("detects gender reveal events from category or nested config", () => {
  assert.equal(isGenderRevealEventData({ category: "Gender Reveal" }), true);
  assert.equal(isGenderRevealEventData({ genderReveal: { guessesEnabled: true } }), true);
  assert.equal(isGenderRevealEventData({ category: "Baby Showers" }), false);
});

test("Yes requires a guess, Maybe is optional, No skips it", () => {
  const config = parseGenderRevealConfig({
    genderReveal: { guessesEnabled: true, tallyVisibility: "live" },
  });
  assert.equal(isGenderRevealGuessRequired({ config, response: "yes" }), true);
  assert.equal(shouldCollectGenderRevealGuess({ config, response: "maybe" }), true);
  assert.equal(isGenderRevealGuessRequired({ config, response: "maybe" }), false);
  assert.equal(shouldCollectGenderRevealGuess({ config, response: "no" }), false);
});

test("hide-until-reveal keeps the guest tally private until the host flips it", () => {
  const hidden = parseGenderRevealConfig({
    genderReveal: { tallyVisibility: "hidden" },
  });
  assert.equal(canGuestSeeGenderRevealTally(hidden), false);
  const revealed = parseGenderRevealConfig({
    genderReveal: { tallyVisibility: "hidden", revealed: true, revealedResult: "pink" },
  });
  assert.equal(canGuestSeeGenderRevealTally(revealed), true);
});

test("lock_at_deadline freezes guesses after the RSVP date", () => {
  const config = parseGenderRevealConfig({
    genderReveal: { tallyVisibility: "lock_at_deadline" },
  });
  const now = new Date("2026-08-18T12:00:00Z");
  assert.equal(areGenderRevealGuessesLocked(config, "2026-08-10", now), true);
  assert.equal(areGenderRevealGuessesLocked(config, "2026-08-20", now), false);
  assert.equal(
    shouldCollectGenderRevealGuess({ config, response: "yes", deadline: "2026-08-10", now }),
    false,
  );
});

test("tallies pink/blue guesses and builds the live strip", () => {
  const counts = tallyGenderRevealGuesses([
    { answersJson: { genderGuess: "pink" } },
    { answersJson: { genderGuess: "blue" } },
    { answersJson: { genderGuess: "girl" } },
    { answersJson: {} },
  ]);
  assert.deepEqual(counts, { pink: 2, blue: 1, total: 3 });
  assert.deepEqual(
    buildGenderRevealLiveStrip({
      yes: 54,
      filled: 62,
      numberOfGuests: 70,
      guesses: counts.total,
    }),
    { coming: 54, pending: 8, guesses: 3 },
  );
});

test("stores RSVP answers as a first-class genderGuess field", () => {
  assert.deepEqual(
    buildGenderRevealRsvpAnswers({
      genderGuess: "Team Blue",
      giftNote: "Bringing diapers",
      bringingGift: true,
      partySize: 2,
    }),
    {
      genderGuess: "blue",
      giftNote: "Bringing diapers",
      bringingGift: true,
      partySize: 2,
    },
  );
});

test("memory line names the winning guess after the reveal", () => {
  const config = parseGenderRevealConfig({
    genderReveal: { revealed: true, revealedResult: "pink" },
  });
  assert.equal(
    genderRevealMemoryLine({ config, counts: { pink: 28, blue: 21, total: 49 } }),
    "The room guessed girl — 28 of 49 guesses.",
  );
});

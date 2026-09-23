import assert from "node:assert/strict";
import test from "node:test";
import { createLiveCardForm } from "./livecard-builder.ts";
import {
  applyLiveCardProofread,
  liveCardWording,
  liveCardWordingKey,
  mergeLiveCardProofread,
  normalizeInvitationCapitalization,
} from "./livecard-wording.ts";

test("known brand and acronym capitalization never changes URLs or email addresses", () => {
  assert.equal(
    normalizeInvitationCapitalization(
      "rsvp for amc imax on envitefy: amc@example.com, https://amc.com/rsvp, amc.com/rsvp.",
    ),
    "RSVP for AMC IMAX on Envitefy: amc@example.com, https://amc.com/rsvp, amc.com/rsvp.",
  );
  const before = fixture();
  const next = applyLiveCardProofread(before, liveCardWording(before));
  assert.equal(next.title, "Movie night at AMC");
  assert.equal(next.locations[0].venue, "AMC");
});

function fixture() {
  const form = createLiveCardForm();
  return {
    ...form,
    title: "Movie night at amc",
    overview:
      "Meet you're freinds at amc at 4 PM. Email mia@example.com. See https://example.com/Event.",
    date: "2026-09-26",
    hostName: "mia",
    hostEmail: "mia@example.com",
    hostPhone: "850-555-0199",
    locations: [
      {
        ...form.locations[0],
        venue: "amc",
        address: "465 Grand Boulevard",
        placeId: "amc-original",
        timezone: "America/Chicago",
        resolution: "verified" as const,
      },
    ],
  };
}

test("automatic corrections include AMC, preserve contacts and retain location metadata", () => {
  const before = fixture();
  const wording = liveCardWording(before);
  const next = applyLiveCardProofread(before, {
    ...wording,
    title: "Movie Night at AMC",
    overview: before.overview.replace("you're freinds", "your friends").replace("amc", "AMC"),
    hostName: "Mia",
    locations: [
      { ...wording.locations[0], venue: "AMC", address: "Wrong address", timezone: "UTC" },
    ],
    date: "2027-01-01",
    hostPhone: "999",
  });
  assert.equal(next.title, "Movie Night at AMC");
  assert.match(next.overview, /your friends at AMC at 4 PM/);
  assert.equal(next.hostName, "Mia");
  assert.equal(next.date, before.date);
  assert.equal(next.hostPhone, before.hostPhone);
  assert.deepEqual(next.locations[0], { ...before.locations[0], venue: "AMC" });
});

test("automatic corrections reject changed facts, cleared wording and substituted venues", () => {
  const before = fixture();
  const wording = liveCardWording(before);
  for (const overview of [
    before.overview.replace("4 PM", "4 AM"),
    before.overview.replace("4 PM", "5 PM"),
    before.overview.replace("mia@", "other@"),
    before.overview.replace("/Event", "/event"),
    "",
  ])
    assert.throws(() => applyLiveCardProofread(before, { ...wording, overview }));
  assert.throws(() => applyLiveCardProofread(before, { ...wording, locations: [] }));
  assert.throws(() =>
    applyLiveCardProofread(before, {
      ...wording,
      locations: [{ ...wording.locations[0], venue: "Regal" }],
    }),
  );
  assert.throws(() => applyLiveCardProofread(before, { ...wording, hostName: "Nia" }));
  assert.throws(() =>
    applyLiveCardProofread(before, { ...wording, instructions: "Bring snacks." }),
  );
});

test("late proofreading keeps newer manual wording and location edits, and requires checking them", () => {
  const before = fixture();
  const corrected = applyLiveCardProofread(before, {
    ...liveCardWording(before),
    title: "Movie Night at AMC",
    overview: before.overview.replace("amc", "AMC"),
  });
  const current = {
    ...before,
    overview: "Our new plan at amc.",
    date: "2026-10-04",
    locations: [{ ...before.locations[0], venue: "Regal", address: "New address" }],
  };
  const next = mergeLiveCardProofread(current, before, corrected);
  assert.equal(next.title, corrected.title);
  assert.equal(next.overview, current.overview);
  assert.equal(next.date, current.date);
  assert.deepEqual(next.locations, current.locations);
  assert.notEqual(liveCardWordingKey(next), liveCardWordingKey(corrected));
  assert.equal(
    liveCardWordingKey(corrected),
    liveCardWordingKey({ ...corrected, format: "digital_flyer", design: "New design" }),
  );
});

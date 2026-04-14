import assert from "node:assert/strict";
import test from "node:test";

import { buildLiveCardDetailsWelcomeMessage } from "./live-card-event-details.ts";

test("birthday welcome includes ordinal age and venue", () => {
  const msg = buildLiveCardDetailsWelcomeMessage(
    {
      category: "Birthday",
      name: "Lara",
      age: "7",
      venueName: "The Park Cafe",
      eventDate: "2026-05-23",
      startTime: "12:00",
    },
    "Lara's Birthday",
  );
  assert.equal(
    msg,
    "Join us to celebrate Lara's 7th birthday at The Park Cafe on Saturday, May 23rd at 12PM.",
  );
});

test("birthday welcome parses honoree from card title when name missing", () => {
  const msg = buildLiveCardDetailsWelcomeMessage(
    {
      category: "Birthday",
      age: "30",
      venueName: "Riverside Hall",
      eventDate: "2026-07-10",
      startTime: "6:30 PM",
    },
    "Sam's Birthday",
  );
  assert.equal(
    msg,
    "Join us to celebrate Sam's 30th birthday at Riverside Hall on Friday, July 10th at 6:30PM.",
  );
});

test("birthday without honoree returns null", () => {
  assert.equal(
    buildLiveCardDetailsWelcomeMessage({
      category: "Birthday",
      age: "5",
      venueName: "Home",
    }),
    null,
  );
});

test("non-birthday uses headline and venue", () => {
  const msg = buildLiveCardDetailsWelcomeMessage(
    {
      category: "Party",
      eventTitle: "Summer BBQ",
      venueName: "Backyard",
      eventDate: "2026-08-01",
    },
    "Summer BBQ",
  );
  assert.equal(msg, "You're invited to Summer BBQ at Backyard on Saturday, August 1st.");
});

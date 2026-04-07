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
    },
    "Lara's Birthday",
  );
  assert.equal(msg, "Join us to celebrate Lara's 7th birthday at The Park Cafe.");
});

test("birthday welcome parses honoree from card title when name missing", () => {
  const msg = buildLiveCardDetailsWelcomeMessage(
    {
      category: "Birthday",
      age: "30",
      venueName: "Riverside Hall",
    },
    "Sam's Birthday",
  );
  assert.equal(msg, "Join us to celebrate Sam's 30th birthday at Riverside Hall.");
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
    },
    "Summer BBQ",
  );
  assert.equal(msg, "You're invited to Summer BBQ at Backyard.");
});

import assert from "node:assert/strict";
import test from "node:test";

import { buildLiveCardDetailsWelcomeMessage, buildLiveCardOverviewNotes } from "./live-card-event-details.ts";

test("overview removes repeated birthday introductions while preserving the actual plan", () => {
  assert.deepEqual(buildLiveCardOverviewNotes({
    title: "Livia is turning 10",
    welcome: "Join us to celebrate Livia's 10th birthday.",
    descriptions: [
      "Join us to celebrate Livia turning 10. Movie at AMC Grand Blvd, followed by dinner at Pazzo SRB.",
      "Join us to celebrate Livia's 10th birthday.",
    ],
    instructions: ["Please bring socks.", "Please bring socks!", "No gifts, please."],
  }), ["Movie at AMC Grand Blvd, followed by dinner at Pazzo SRB.", "Please bring socks.", "No gifts, please."]);
});

test("overview preserves meaningful custom wording and additional timing", () => {
  assert.deepEqual(buildLiveCardOverviewNotes({
    title: "Summer BBQ",
    welcome: "We'd love for you to join us for Summer BBQ.",
    descriptions: ["We'd love for you to join us for Summer BBQ. Dinner is at 6:30 PM. Bring a side dish.", "Dinner is at 6:30 PM."],
    instructions: ["Pickup is at 8 PM.", "Tell the host about allergies."],
  }), ["Dinner is at 6:30 PM. Bring a side dish.", "Pickup is at 8 PM.", "Tell the host about allergies."]);
});

test("birthday welcome includes ordinal age without repeating venue and time", () => {
  const msg = buildLiveCardDetailsWelcomeMessage(
    {
      category: "Birthday",
      name: "Lara",
      age: "7",
      venueName: "The Park Cafe",
      location: "123 Main Street, Chicago, IL",
      eventDate: "2026-05-23",
      startTime: "12:00",
    },
    "Lara's Birthday",
  );
  assert.equal(
    msg,
    "Join us to celebrate Lara's 7th birthday.",
  );
});

test("birthday welcome ignores inline venue because overview renders location separately", () => {
  const msg = buildLiveCardDetailsWelcomeMessage(
    {
      category: "Birthday",
      name: "Lara",
      age: "7",
      location: "AMC Boulevard 10 465 Grand Boulevard, Miramar Beach, FL",
      eventDate: "2026-05-23",
      startTime: "13:00",
    },
    "Lara's Birthday",
  );
  assert.equal(
    msg,
    "Join us to celebrate Lara's 7th birthday.",
  );
});

test("birthday welcome does not include address fallback", () => {
  const msg = buildLiveCardDetailsWelcomeMessage(
    {
      category: "Birthday",
      name: "Lara",
      age: "7",
      location: "465 Grand Boulevard, Miramar Beach, FL",
      eventDate: "2026-05-23",
      startTime: "13:00",
    },
    "Lara's Birthday",
  );
  assert.equal(
    msg,
    "Join us to celebrate Lara's 7th birthday.",
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
    "Join us to celebrate Sam's 30th birthday.",
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

test("non-birthday uses headline without repeating venue and time", () => {
  const msg = buildLiveCardDetailsWelcomeMessage(
    {
      category: "Party",
      eventTitle: "Summer BBQ",
      venueName: "Backyard",
      eventDate: "2026-08-01",
    },
    "Summer BBQ",
  );
  assert.equal(msg, "We'd love for you to join us for Summer BBQ.");
});

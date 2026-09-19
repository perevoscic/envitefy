import assert from "node:assert/strict";
import test from "node:test";
import { buildLiveCardCalendarLinks } from "./live-card-calendar.ts";
import { composeGuestLocation, formatGuestSchedule, isPropertyOpenHouse, publicGuestInstructions } from "./guest-event-details.ts";

test("one guest projection retains venue, room, instructions and event zone for every calendar", () => {
  const links = buildLiveCardCalendarLinks("Lantern workshop", {
    description: "Join us.",
    eventDetails: {
      eventDate: "2026-09-23", startTime: "2 PM", endTime: "4 PM", timezone: "America/Chicago",
      venueName: "Maple Community Center", location: "Maple Community Center, Room B, 23 Oak Street",
      guestInstructions: ["Bring goggles.", "No gifts, please."],
      giftNote: "No gifts, please.",
    },
  }, "America/Los_Angeles");
  assert.ok(links);
  const google = new URL(links.google).searchParams;
  const outlook = new URL(links.outlook).searchParams;
  const ics = new URL(links.appleInline, "https://envitefy.com").searchParams;
  assert.equal(google.get("dates"), "20260923T190000Z/20260923T210000Z");
  assert.equal(google.get("ctz"), "America/Chicago");
  for (const params of [google, outlook, ics]) {
    assert.equal(params.get("location"), "Maple Community Center, Room B, 23 Oak Street");
    const description = params.get("details") || params.get("body") || params.get("description");
    assert.match(description, /Bring goggles\./);
    assert.equal(description.split("No gifts, please.").length, 2);
  }
});

test("canonical instants work before hydration and do not require a display clock", () => {
  const links = buildLiveCardCalendarLinks("Meet", { eventDetails: {
    timezone: "America/Chicago", calendarStartISO: "2026-09-23T19:00:00.000Z", calendarEndISO: "2026-09-23T21:00:00.000Z",
  } }, null);
  assert.ok(links);
  assert.equal(new URL(links.google).searchParams.get("dates"), "20260923T190000Z/20260923T210000Z");
});

test("guest summaries preserve supplied end times and exact public copy without duplicates", () => {
  assert.equal(composeGuestLocation("Maple Community Center", "Maple Community Center, Room B, 23 Oak Street"), "Maple Community Center, Room B, 23 Oak Street");
  assert.equal(composeGuestLocation("Room B", "23 Oak Street"), "Room B, 23 Oak Street");
  assert.match(formatGuestSchedule({ eventDate: "2026-09-23", startTime: "14:00", endTime: "16:00" }), /2:00 PM.*4:00 PM/);
  assert.doesNotMatch(formatGuestSchedule({ eventDate: "2026-09-23", startTime: "14:00" }), /4:00/);
  assert.deepEqual(publicGuestInstructions({ guestInstructions: ["Bring goggles.", "No gifts, please."], giftNote: "No gifts, please." }), ["Bring goggles.", "No gifts, please."]);
});

test("school open houses never receive property/realtor actions from the category alone", () => {
  assert.equal(isPropertyOpenHouse({ category: "Open House", occasion: "School open house for teachers and families" }), false);
  assert.equal(isPropertyOpenHouse({ category: "Open House", semanticKind: "school_open_house" }), false);
  assert.equal(isPropertyOpenHouse({ category: "Open House", listingUrl: "https://example.com/listing" }), true);
  assert.equal(isPropertyOpenHouse({ category: "Open House", semanticKind: "real_estate_open_house" }), true);
});

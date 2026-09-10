import assert from "node:assert/strict";
import test from "node:test";
import { buildCalendarLinks } from "./calendar-links.ts";

test("calendar links retain offsets regardless of the server's local timezone", () => {
  const links = buildCalendarLinks({
    title: "Event",
    description: "Details",
    location: "Venue",
    startIso: "2026-09-26T15:00:00-05:00",
    endIso: "2026-09-26T17:00:00-05:00",
    allDay: false,
    reminders: [15],
    recurrence: "FREQ=WEEKLY;COUNT=2",
  });
  assert.equal(
    new URL(links.google).searchParams.get("dates"),
    "20260926T200000Z/20260926T220000Z",
  );
  assert.equal(new URL(links.outlook).searchParams.get("startdt"), "2026-09-26T20:00:00.000Z");
  const apple = new URL(links.appleDownload, "http://localhost").searchParams;
  assert.equal(apple.get("floating"), "0");
  assert.equal(apple.get("start"), "2026-09-26T15:00:00-05:00");
  assert.equal(apple.get("reminders"), "15");
  assert.equal(apple.get("recurrence"), "FREQ=WEEKLY;COUNT=2");
});

test("all-day links carry dates and the all-day flag without timezone shifts", () => {
  const links = buildCalendarLinks({
    title: "Event",
    description: "",
    location: "",
    startIso: "2026-09-26",
    endIso: "2026-09-27",
    allDay: true,
    reminders: null,
    recurrence: null,
  });
  assert.equal(new URL(links.google).searchParams.get("dates"), "20260926/20260927");
  const outlook = new URL(links.outlook).searchParams;
  assert.equal(outlook.get("allday"), "true");
  assert.equal(outlook.get("startdt"), "2026-09-26");
  const apple = new URL(links.appleInline, "http://localhost").searchParams;
  assert.equal(apple.get("allDay"), "true");
  assert.equal(apple.get("start"), "2026-09-26");
});

test("Google, Outlook, and Apple links omit repeated fields while preserving useful notes", () => {
  const links = buildCalendarLinks({
    title: "ENT appointment",
    description:
      "Event details\nEvent: ENT appointment\nDate: Monday, November 2, 2026\nStarts: 8:10 AM CST\nLocation: 123 Main St\nCategory: Medical Appointments\n\nPatient: Sam Example\nBring your referral.\n\nView on Envitefy:\nhttps://envitefy.com/event/example-appointment",
    location: "123 Main St",
    startIso: "2026-11-02T08:10:00-06:00",
    endIso: "2026-11-02T09:10:00-06:00",
    timezone: "America/Chicago",
    allDay: false,
    reminders: null,
    recurrence: null,
  });
  const expected =
    "Patient: Sam Example\nBring your referral.\n\nView on Envitefy:\nhttps://envitefy.com/event/example-appointment";
  assert.equal(new URL(links.google).searchParams.get("details"), expected);
  assert.equal(new URL(links.outlook).searchParams.get("body"), expected);
  for (const link of [links.appleInline, links.appleDownload]) {
    assert.equal(new URL(link, "http://localhost").searchParams.get("description"), expected);
  }
  assert.equal(new URL(links.google).searchParams.get("text"), "ENT appointment");
  assert.equal(new URL(links.google).searchParams.get("location"), "123 Main St");
  assert.equal(
    new URL(links.google).searchParams.get("dates"),
    "20261102T141000Z/20261102T151000Z",
  );
});

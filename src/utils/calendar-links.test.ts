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

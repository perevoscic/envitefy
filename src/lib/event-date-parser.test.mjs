import assert from "node:assert/strict";
import test from "node:test";
import { parseEventDates, normalizeExtractedEventDate } from "./event-date-parser.ts";
import { inferEventYear } from "./event-date-year.mjs";
import { parseChrono, fallbackExtractConciergeDraft } from "./concierge/fallback.ts";
import { resolveScheduleCorrection } from "./creation/calendar-validation.ts";

const now = new Date("2026-09-22T23:00:00Z");
const zone = "America/Chicago";
const date = (text, anchor = now, timezone = zone) => {
  const part = parseEventDates(text, anchor, timezone)[0]?.start;
  return part ? [part.get("year"), part.get("month"), part.get("day")] : null;
};

test("all twelve months follow the month-only year rule", () => {
  for (let month = 1; month <= 12; month++) {
    assert.equal(inferEventYear(month, new Date(2026, 8, 22)), month < 9 ? 2027 : 2026);
    assert.equal(inferEventYear(month, new Date(2026, 8, 22), 2030), 2030);
  }
  assert.deepEqual(date("September 24"), [2026, 9, 24]);
  assert.deepEqual(date("September 1 at 9 AM"), [2026, 9, 1]);
  assert.deepEqual(date("September 22 at 9 AM"), [2026, 9, 22]);
  assert.deepEqual(date("August 31"), [2027, 8, 31]);
  assert.deepEqual(date("October 1"), [2026, 10, 1]);
});

test("explicit years and relative years are authoritative", () => {
  assert.deepEqual(date("September 24, 2029"), [2029, 9, 24]);
  assert.deepEqual(date("August 24, 2028"), [2028, 8, 24]);
  assert.deepEqual(date("2028-02-29"), [2028, 2, 29]);
  assert.deepEqual(date("September 24 next year"), [2027, 9, 24]);
  assert.deepEqual(date("August 24 this year"), [2026, 8, 24]);
  assert.deepEqual(date("tomorrow"), [2026, 9, 23]);
  assert.deepEqual(date("January 1", new Date("2026-12-31T18:00:00Z")), [2027, 1, 1]);
});

test("month/year boundaries use the event's local date", () => {
  const boundary = new Date("2026-10-01T00:30:00Z");
  assert.deepEqual(date("September 24", boundary, "America/Chicago"), [2026, 9, 24]);
  assert.deepEqual(date("September 24", boundary, "Asia/Tokyo"), [2027, 9, 24]);
});

test("cross-year ranges keep their end year and invalid dates are rejected", () => {
  const result = parseEventDates("December 31 - January 2", now, zone)[0];
  assert.equal(result.start.get("year"), 2026);
  assert.equal(result.end.get("year"), 2027);
  assert.deepEqual(date("February 29, 2028"), [2028, 2, 29]);
  assert.equal(date("February 30"), null);
});

test("AI date normalization corrects an inferred year and preserves the supplied year", () => {
  assert.equal(normalizeExtractedEventDate("2027-09-24", "Sep 24th", zone, now), "2026-09-24");
  assert.equal(normalizeExtractedEventDate("2026-08-24", "August 24", zone, now), "2027-08-24");
  assert.equal(
    normalizeExtractedEventDate("2026-09-24", "September 24, 2029", zone, now),
    "2029-09-24",
  );
  assert.equal(
    normalizeExtractedEventDate("2028-09-24", "Make the design blue", zone, now),
    "2028-09-24",
  );
});

test("chat intake and corrections use the same year rule for every category", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  for (const category of [
    "Birthday",
    "Wedding",
    "Anniversary",
    "Baby shower",
    "Gender reveal",
    "Bridal shower",
    "Graduation",
    "Housewarming",
    "Game day",
    "Open house",
    "General event",
  ]) {
    const draft = fallbackExtractConciergeDraft({
      message: `${category} on September 1 at 4 PM.`,
      starterCategory: category,
    });
    assert.equal(new Date(draft.startISO).getUTCFullYear(), 2026, category);
  }
  assert.match(parseChrono("August 24 at 4 PM").startISO, /^2027-08-24/);
  assert.match(parseChrono("September 24, 2029 at 4 PM").startISO, /^2029-09-24/);
  assert.match(
    resolveScheduleCorrection({ dateText: "September 1", timeText: "4 PM", timezone: zone })
      .startISO,
    /^2026-09-01/,
  );
});

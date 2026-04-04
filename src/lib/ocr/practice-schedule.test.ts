import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDayCode,
  parsePracticeScheduleHeuristics,
  parsePracticeTimeRange,
  parseTimeTo24h,
} from "./practice-schedule.ts";

test("parseDayCode normalizes weekday variants", () => {
  assert.deepEqual(parseDayCode("Thursday"), { index: 4, code: "TH" });
  assert.deepEqual(parseDayCode("TUES"), { index: 2, code: "TU" });
});

test("parseTimeTo24h handles 12-hour inputs", () => {
  assert.deepEqual(parseTimeTo24h("4:15 pm"), { hour: 16, minute: 15 });
  assert.deepEqual(parseTimeTo24h("12:00 am"), { hour: 0, minute: 0 });
});

test("parsePracticeTimeRange keeps trailing note text", () => {
  assert.deepEqual(parsePracticeTimeRange("4:15-6:00 rec"), {
    startHour: 16,
    startMinute: 15,
    endHour: 18,
    endMinute: 0,
    note: "rec",
  });
});

test("parsePracticeScheduleHeuristics extracts group rows", () => {
  const lines = [
    "Team Practice Schedule",
    "2025-2026 School Year",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Level 3 Group",
    "4:15-6:00 rec",
    "OFF",
    "4:15-6:00 rec",
    "OFF",
    "4:15-6:00 rec",
  ];
  const parsed = parsePracticeScheduleHeuristics(lines, "America/Chicago");
  assert.ok(parsed);
  assert.equal(parsed?.groups.length, 1);
  assert.equal(parsed?.groups[0].name, "Level 3 Group");
  assert.ok((parsed?.groups[0].sessions.filter((session) => session.hasPractice).length || 0) >= 1);
});

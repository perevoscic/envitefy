import assert from "node:assert/strict";
import test from "node:test";
import { extractEventWebsiteSchedule } from "./event-website-schedule.ts";

test("current event schedules retain details independently of the retired creator", () => {
  const [item] = extractEventWebsiteSchedule({ publicEvent: { scheduleItems: [{
    title: "Movie time", startAt: "2026-09-26T15:00:00-05:00", timezone: "America/Chicago",
    locationText: "AMC Grand Boulevard", notes: "Meet in the lobby",
  }] } });
  assert.equal(item.title, "Movie time");
  assert.equal(item.startAt, "2026-09-26T20:00:00.000Z");
  assert.equal(item.timezone, "America/Chicago");
  assert.equal(item.locationText, "AMC Grand Boulevard");
  assert.equal(item.notes, "Meet in the lobby");
});

test("stored schedule aliases remain supported and an explicitly empty public schedule wins", () => {
  const data = { scheduleHub: { occurrences: [{ name: "Lunch", startISO: "2026-09-26T12:00:00Z", venue: "Cafe" }] } };
  assert.equal(extractEventWebsiteSchedule(data)[0].locationText, "Cafe");
  assert.deepEqual(extractEventWebsiteSchedule({ ...data, publicEvent: { scheduleItems: [] } }), []);
});

test("untrusted schedules discard malformed entries and retain the complete public list", () => {
  assert.deepEqual(extractEventWebsiteSchedule(null), []);
  assert.deepEqual(extractEventWebsiteSchedule({ scheduleItems: [null, "x", [], {}] }), []);
  const rows = extractEventWebsiteSchedule({ scheduleItems: Array.from({ length: 40 }, () => ({ label: "  Lunch  ", start: "invalid" })) });
  assert.equal(rows.length, 40);
  assert.equal(rows[0].title, "Lunch");
  assert.equal(rows[0].startAt, null);
});

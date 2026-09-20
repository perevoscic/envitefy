import assert from "node:assert/strict";
import test from "node:test";
import { buildCalendarHandoffPath, parseCalendarHandoff } from "./calendar-handoff.ts";
import { buildCalendarLinks, type CalendarLinkArgs } from "./calendar-links.ts";

const event: CalendarLinkArgs = {
  title: "Livia’s birthday 🎈", description: "Movie, then dinner.\nMeet at the entrance.",
  location: "AMC Grand Blvd", startIso: "2026-09-26T16:00:00-05:00", endIso: null,
  timezone: "America/Chicago", allDay: false, reminders: [30], recurrence: "FREQ=YEARLY",
};
const query = (path: string) => new URL(path, "https://envitefy.com").searchParams;

test("email links preserve complete event data for every provider without inventing an end", () => {
  for (const provider of ["apple", "google", "microsoft"] as const) {
    const path = buildCalendarHandoffPath(event, provider);
    assert.ok(path.startsWith("/calendar/add?"));
    const parsed = parseCalendarHandoff(query(path));
    assert.ok(parsed);
    assert.equal(parsed.provider, provider);
    assert.equal(parsed.event.startIso, "2026-09-26T21:00:00.000Z");
    assert.equal(parsed.event.endIso, null);
    assert.equal(parsed.event.title, event.title);
    assert.equal(parsed.event.location, event.location);
    assert.equal(parsed.event.timezone, event.timezone);
    assert.deepEqual(parsed.event.reminders, [30]);
    assert.equal(parsed.event.recurrence, event.recurrence);
    assert.deepEqual(buildCalendarLinks(parsed.event), buildCalendarLinks({ ...event, startIso: parsed.event.startIso }));
  }
});

test("provided ends and all-day dates survive handoff", () => {
  for (const value of [
    { ...event, endIso: "2026-09-26T19:00:00-05:00" },
    { ...event, allDay: true, startIso: "2026-09-26", endIso: "2026-09-28" },
  ]) {
    const parsed = parseCalendarHandoff(query(buildCalendarHandoffPath(value, "apple")));
    assert.ok(parsed);
    assert.equal(parsed.event.allDay, value.allDay);
    assert.equal(parsed.event.endIso, new Date(value.endIso).toISOString());
  }
});

test("untrusted URLs cannot redirect or inject calendar fields", () => {
  const params = query(buildCalendarHandoffPath(event, "microsoft"));
  params.set("url", "https://attacker.example");
  params.set("outlook", "javascript:alert(1)");
  const parsed = parseCalendarHandoff(params);
  assert.ok(parsed);
  assert.equal(new URL(buildCalendarLinks(parsed.event).outlook).hostname, "outlook.live.com");
  for (const [key, value] of [["provider", "other"], ["start", "2026-02-30"], ["end", "2025-01-01"], ["reminders", "NaN"], ["recurrence", "FREQ=YEARLY\nATTENDEE:bad"], ["title", "a".repeat(2001)]]) {
    const invalid = new URLSearchParams(params);
    invalid.set(key, value);
    assert.equal(parseCalendarHandoff(invalid), null, key);
  }
});

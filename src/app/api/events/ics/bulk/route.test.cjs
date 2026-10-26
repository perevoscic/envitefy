const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../../../../../scripts/lib/event-messages-test-loader.cjs");

const { POST } = loadTs("src/app/api/events/ics/bulk/route.ts", {
  "next/server": { NextResponse: Response },
  "@/lib/calendar-description": { buildCalendarDescription: (event) => event.description || "" },
});

async function exportEvents(events) {
  const response = await POST(new Request("https://envitefy.example/api/events/ics/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  }));
  assert.equal(response.status, 200);
  return (await response.text()).replace(/\r\n[ \t]/g, "");
}

test("selected school dates export as civil dates with an exclusive range end", async () => {
  const ics = await exportEvents([
    { title: "Spirit Week", start: "2026-10-26", end: "2026-10-31", allDay: true, timezone: "Pacific/Kiritimati", uid: "memo%3Aspirit@envitefy.com" },
    { title: "Bible test", start: "2026-10-30", end: "2026-10-31", allDay: true, timezone: "Pacific/Honolulu", uid: "memo%3Abible@envitefy.com" },
  ]);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.match(ics, /DTSTART;VALUE=DATE:20261026\r\nDTEND;VALUE=DATE:20261031/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261030\r\nDTEND;VALUE=DATE:20261031/);
  assert.doesNotMatch(ics, /VALARM/);
});

test("repeat exports and edited dates keep each reviewed item's stable UID", async () => {
  const event = { title: "Bible test", start: "2026-10-30", end: "2026-10-31", allDay: true, timezone: "America/Chicago", uid: "memo%3Abible@envitefy.com" };
  const first = await exportEvents([event]);
  const edited = await exportEvents([{ ...event, title: "Updated test", start: "2026-11-02", end: "2026-11-03" }]);
  assert.equal(first.match(/^UID:(.+)$/m)[1], edited.match(/^UID:(.+)$/m)[1]);
  assert.match(edited, /SUMMARY:Updated test/);
  assert.match(edited, /DTSTART;VALUE=DATE:20261102/);
});

test("a missing timed end remains absent instead of creating a default duration", async () => {
  const ics = await exportEvents([{ title: "Meeting", start: "2026-11-02T15:30:00-06:00", end: null, timezone: "America/Chicago" }]);
  assert.match(ics, /DTSTART:20261102T213000Z/);
  assert.doesNotMatch(ics, /DTEND:/);
});

test("invalid supplied UIDs cannot inject calendar properties and legacy exports still work", async () => {
  const event = { title: "Test", start: "2026-10-30", end: "2026-10-31", allDay: true, timezone: "UTC" };
  const ics = await exportEvents([{ ...event, uid: "unsafe\r\nSUMMARY:Injected@envitefy.com" }, event]);
  const uids = [...ics.matchAll(/^UID:([^\r\n]+)/gm)].map((match) => match[1]);
  assert.equal(uids.length, 2);
  assert.ok(uids.every((uid) => /^[a-f\d-]+@envitefy\.com$/.test(uid)));
  assert.notEqual(uids[0], uids[1]);
  assert.doesNotMatch(ics, /SUMMARY:Injected/);
});

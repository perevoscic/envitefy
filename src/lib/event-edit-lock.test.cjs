const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const { isPastEvent } = loadTs("src/lib/event-edit-lock.ts");
const now = Date.parse("2026-10-28T01:00:00Z");
test("published events lock at their saved end instant", () => {
  assert.equal(isPastEvent({ endAt: "2026-10-28T00:00:00Z" }, now), true);
  assert.equal(isPastEvent({ endAt: "2026-10-28T02:00:00Z", eventDate: "2020-01-01" }, now), false);
});
test("date-only events remain editable through their event-local final day", () => {
  assert.equal(isPastEvent({ eventDate: "2026-10-27", timezone: "America/Chicago" }, now), false);
  assert.equal(isPastEvent({ eventDate: "2026-10-26", timezone: "America/Chicago" }, now), true);
  assert.equal(isPastEvent({ liveCardBuilder: { form: { date: "2026-10-26", endDate: "2026-10-28", timezone: "America/Chicago" } } }, now), false);
});
test("legacy card dates, explicit end times and drafts retain safe semantics", () => {
  assert.equal(isPastEvent({ studioCard: { invitationData: { eventDetails: { eventDate: "2020-01-01" } } } }, now), true);
  assert.equal(isPastEvent({ liveCardBuilder: { form: { date: "2026-10-27", endTime: "19:00", timezone: "America/Chicago" } } }, now), true);
  for (const data of [null, {}, {eventDate: "bad"}, {eventDate: "2026-02-30"}, {status: "draft", eventDate: "2020-01-01"}]) assert.equal(isPastEvent(data, now), false);
});

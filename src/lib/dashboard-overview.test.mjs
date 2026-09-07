import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboardAttention, findDashboardConflicts, summarizeDashboardSignup } from "./dashboard-overview.ts";
import { toDashboardEvent } from "./dashboard-data.ts";

const event = (id, start, end, data = {}) => toDashboardEvent({ id, title: id, data: { startAt: start, endAt: end, ...data } });
const now = Date.parse("2030-01-01T00:00:00Z");

test("conflicts include nested and equal-start events, but not touching, canceled, draft, or declined events", () => {
  const start = "2030-01-02T12:00:00Z";
  const end = "2030-01-02T14:00:00Z";
  const declined = { ...event("declined", start, end), userRsvpResponse: "no" };
  const events = [
    event("long", start, end), event("nested", "2030-01-02T13:00:00Z", "2030-01-02T13:30:00Z"),
    event("touching", end, "2030-01-02T15:00:00Z"),
    event("same-start", start, null), event("draft", start, end, { status: "draft" }),
    event("canceled", start, end, { status: "canceled" }), declined,
  ];
  assert.deepEqual(findDashboardConflicts(events, now).map((item) => item.id).sort(), ["long-nested", "long-same-start"]);
});

test("a missing duration does not invent a later overlap; UTC offsets compare as instants", () => {
  const events = [event("no-duration", "2030-01-02T10:00:00-06:00", null), event("same-time", "2030-01-02T16:00:00Z", null), event("later", "2030-01-02T16:01:00Z", null)];
  assert.deepEqual(findDashboardConflicts(events, now).map((item) => item.id), ["no-duration-same-time"]);
});

test("attention distinguishes accepting a shared invitation from RSVP, with no host edit actions for invitees", () => {
  const start = "2030-01-02T12:00:00Z";
  const events = [event("pending", start, null, { ownership: "invited", shareStatus: "pending", rsvpEnabled: true }), event("rsvp", start, null, { ownership: "invited", rsvpEnabled: true }), event("host", start, null), event("plain-invite", start, null, { ownership: "invited" })];
  const actions = buildDashboardAttention(events, { host: "/edit/host", pending: "/wrong" });
  assert.deepEqual(actions.map((item) => item.kind), ["invitation", "rsvp", "venue"]);
  assert.equal(actions[2].href, "/edit/host");
});

test("sign-up progress counts confirmed quantities by section/slot and leaves unlimited capacity separate", () => {
  const form = { enabled: true, sections: [
    { id: "snacks", title: "Snacks", slots: [{ id: "one", capacity: 3 }] },
    { id: "helpers", title: "Helpers", slots: [{ id: "one", capacity: 2 }, { id: "open", capacity: null }] },
  ], responses: [
    { status: "confirmed", slots: [{ sectionId: "snacks", slotId: "one", quantity: 3 }, { sectionId: "helpers", slotId: "one", quantity: 1 }] },
    { status: "waitlisted", slots: [{ sectionId: "helpers", slotId: "one", quantity: 1 }] },
    { status: "cancelled", slots: [{ sectionId: "helpers", slotId: "one", quantity: 1 }] },
    { status: "confirmed", slots: [{ sectionId: "removed", slotId: "one", quantity: 99 }] },
  ] };
  const summary = summarizeDashboardSignup("event", "School picnic", form);
  assert.equal(summary.capacity, 5);
  assert.equal(summary.filled, 4);
  assert.equal(summary.remaining, 1);
  assert.equal(summary.unlimitedSlots, 1);
  assert.equal(summary.sections[0].remaining, 0);
  assert.equal(summary.sections[1].remaining, 1);
  assert.equal(summarizeDashboardSignup("event", "Disabled", { ...form, enabled: false }), null);
  assert.equal(summarizeDashboardSignup("event", "Malformed", { sections: "wrong" }), null);
});

test("missing coordinates remain missing instead of becoming a destination at zero, zero", () => {
  const noLocation = event("missing", "2030-01-02T12:00:00Z", null);
  assert.equal(noLocation.locationLat, null);
  assert.equal(noLocation.locationLng, null);
  const equator = event("equator", "2030-01-02T12:00:00Z", null, { locationLat: 0, locationLng: 0 });
  assert.equal(equator.locationLat, 0);
  assert.equal(equator.locationLng, 0);
});

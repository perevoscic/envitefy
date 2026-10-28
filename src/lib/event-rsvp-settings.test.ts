import assert from "node:assert/strict";
import test from "node:test";
import { isRsvpExplicitlyDisabled, readEventRsvpSettings } from "./event-rsvp-settings.ts";

test("explicitly disabled RSVP wins over retained deadlines and conflicting older settings", () => {
  for (const data of [
    { rsvpEnabled: false, rsvp: "2027-04-10" },
    { rsvpEnabled: true, rsvp: { isEnabled: false, deadline: "2027-04-10" } },
    { rsvpEnabled: "off", rsvp: { enabled: true } },
  ]) {
    assert.equal(isRsvpExplicitlyDisabled(data), true);
    assert.equal(readEventRsvpSettings(data, true).isEnabled, false);
  }
});

test("flat saved invitations and editor snapshots restore the same RSVP state", () => {
  for (const data of [
    { rsvpEnabled: true, rsvpDeadline: "2027-04-10" },
    { rsvp: { isEnabled: true, deadline: "2027-04-10" } },
    { rsvp: "2027-04-10" },
  ]) assert.deepEqual(readEventRsvpSettings(data), { isEnabled: true, deadline: "2027-04-10" });
  assert.deepEqual(readEventRsvpSettings({ rsvpEnabled: true }), { isEnabled: true, deadline: "" });
  assert.equal(readEventRsvpSettings({ rsvp: "host@example.test" }).deadline, "");
  assert.equal(readEventRsvpSettings({ rsvp: { isEnabled: false } }, true).isEnabled, false);
  assert.equal(readEventRsvpSettings({ rsvpDeadline: "", rsvp: "2027-04-10" }).deadline, "");
});

test("disabling RSVP changes visibility without clearing its saved deadline", () => {
  for (const value of [
    { rsvpEnabled: false, rsvpDeadline: "2027-04-05" },
    { rsvp: { isEnabled: false, deadline: "2027-04-05" } },
  ]) assert.deepEqual(readEventRsvpSettings(value), { isEnabled: false, deadline: "2027-04-05" });
});

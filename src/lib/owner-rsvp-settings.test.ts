import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOwnerRsvpSettingsPatch,
  readOwnerRsvpSettings,
  validateOwnerRsvpSettings,
} from "./owner-rsvp-settings.ts";

test("RSVP editor loads structured, live-card and legacy contact details", () => {
  const expected = { hostName: "Alex", phone: "+1 (312) 555-0182", email: "alex2026@example.test" };
  assert.deepEqual(
    readOwnerRsvpSettings({ rsvp: { name: "Alex", phone: expected.phone, email: expected.email } }),
    expected,
  );
  assert.deepEqual(
    readOwnerRsvpSettings({
      studioCard: {
        invitationData: {
          eventDetails: { rsvpName: "Alex", rsvpContact: `${expected.phone} · ${expected.email}` },
        },
      },
    }),
    expected,
  );
  assert.deepEqual(
    readOwnerRsvpSettings({ hostName: "Alex", rsvp: `${expected.email}, ${expected.phone}` }),
    expected,
  );
  assert.equal(readOwnerRsvpSettings({ rsvp: "alex1234567890@example.test" }).phone, "");
});

test("saving contacts preserves artwork, facts, response configuration and chat context", () => {
  const data = {
    title: "Livia is turning 10",
    startISO: "2026-09-26T16:00:00",
    numberOfGuests: 4,
    rsvpEnabled: true,
    rsvp: {
      mode: "envitefy",
      enabled: true,
      deadline: "2026-09-25",
      url: "https://example.test/reply",
    },
    studioCard: {
      imageUrl: "/saved.webp",
      positions: { title: 20 },
      invitationData: {
        title: "Livia",
        eventDetails: { location: "AMC Grand Blvd", rsvpName: "Old host" },
      },
    },
    eventDetails: { eventDate: "2026-09-26" },
    conciergeDraft: {
      creationSessionId: "saved-thread",
      rsvpName: "Old host",
      theme: "Purple balloons",
    },
  };
  const before = JSON.stringify(data);
  const settings = { hostName: "Sam", phone: "312-555-0199", email: "sam@example.test" };
  const next = { ...data, ...buildOwnerRsvpSettingsPatch(data, settings) };
  assert.equal(JSON.stringify(data), before, "saved input is not mutated");
  assert.deepEqual(readOwnerRsvpSettings(next), settings);
  assert.equal(next.studioCard.imageUrl, data.studioCard.imageUrl);
  assert.deepEqual(next.studioCard.positions, data.studioCard.positions);
  assert.equal(next.studioCard.invitationData.eventDetails.location, "AMC Grand Blvd");
  assert.equal(next.studioCard.invitationData.eventDetails.rsvpName, "Sam");
  assert.equal(next.rsvp.mode, "envitefy");
  assert.equal(next.rsvp.deadline, "2026-09-25");
  assert.equal(next.rsvp.url, "https://example.test/reply");
  assert.equal(next.numberOfGuests, 4);
  assert.equal(next.rsvpEnabled, true);
  assert.equal(next.startISO, data.startISO);
  assert.equal(next.conciergeDraft.creationSessionId, "saved-thread");
  assert.equal(next.conciergeDraft.rsvpName, "Sam");
});

test("clearing contact fields does not restore stale live-card or draft values", () => {
  const data = {
    hostName: "Old host",
    rsvpName: "Old host",
    rsvp: "312-555-0182 · old@example.test",
    studioCard: {
      invitationData: { eventDetails: { rsvpName: "Old host", rsvpContact: "old@example.test" } },
    },
    conciergeDraft: { rsvpName: "Old host", rsvpContact: "old@example.test" },
  };
  const empty = { hostName: "", phone: "", email: "" };
  assert.deepEqual(
    readOwnerRsvpSettings({ ...data, ...buildOwnerRsvpSettingsPatch(data, empty) }),
    empty,
  );
});

test("legacy external RSVP links survive contact edits", () => {
  const patch = buildOwnerRsvpSettingsPatch(
    { rsvp: "old@example.test https://example.test/rsvp" },
    { hostName: "Sam", phone: "", email: "sam@example.test" },
  );
  assert.equal(patch.rsvp, "sam@example.test · https://example.test/rsvp");
});

test("invalid contact settings are rejected before persistence", () => {
  const settings = { hostName: " Sam ", phone: " +44 20 7946 0958 ", email: " sam@example.test " };
  assert.deepEqual(validateOwnerRsvpSettings(settings), {
    hostName: "Sam",
    phone: "+44 20 7946 0958",
    email: "sam@example.test",
  });
  assert.throws(
    () => validateOwnerRsvpSettings({ ...settings, email: "invalid" }),
    /email address/,
  );
  assert.throws(() => validateOwnerRsvpSettings({ ...settings, phone: "123" }), /phone number/);
  assert.throws(() => validateOwnerRsvpSettings({ ...settings, hostName: {} }), /as text/);
  assert.throws(
    () => validateOwnerRsvpSettings({ ...settings, email: "a".repeat(255) }),
    /too long/,
  );
});

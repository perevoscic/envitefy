import assert from "node:assert/strict";
import test from "node:test";

import {
  canShowOwnerRsvpDashboard,
  getRsvpDashboardGuestCount,
  isScannedOrUploadedEventData,
} from "./owner-rsvp-dashboard.ts";

test("canShowOwnerRsvpDashboard accepts actionable RSVP data", () => {
  assert.equal(canShowOwnerRsvpDashboard({ createdVia: "template", numberOfGuests: 24 }), true);
  assert.equal(canShowOwnerRsvpDashboard({ createdVia: "template", rsvpEnabled: true }), true);
  assert.equal(
    canShowOwnerRsvpDashboard({
      createdVia: "template",
      rsvp: { isEnabled: true, deadline: "2026-06-01" },
    }),
    true,
  );
  assert.equal(
    canShowOwnerRsvpDashboard({ createdVia: "template", rsvp: { enabled: "true" } }),
    true,
  );
  assert.equal(canShowOwnerRsvpDashboard({ createdVia: "template", numberOfGuests: 0 }), false);
  assert.equal(canShowOwnerRsvpDashboard({ createdVia: "template" }), false);
});

test("canShowOwnerRsvpDashboard rejects scanned and uploaded event data", () => {
  assert.equal(canShowOwnerRsvpDashboard({ createdVia: "ocr", numberOfGuests: 24 }), false);
  assert.equal(
    canShowOwnerRsvpDashboard({
      createdVia: "template",
      numberOfGuests: 24,
      sourceContext: { type: "upload", detectedSourceIntent: "authoring_source" },
    }),
    false,
  );
  assert.equal(isScannedOrUploadedEventData({ createdVia: "ocr-birthday-skin" }), true);
  assert.equal(
    canShowOwnerRsvpDashboard({
      numberOfGuests: 24,
      attachment: { type: "image/webp", dataUrl: "/images/events/flyer.webp" },
    }),
    false,
  );
  assert.equal(canShowOwnerRsvpDashboard({ rsvpEnabled: false, numberOfGuests: 24 }), false);
  assert.equal(
    canShowOwnerRsvpDashboard({
      primaryOutput: "live_card",
      requestedOutputs: ["live_card"],
      numberOfGuests: 24,
      studioCard: { imageUrl: "/api/blob/event-media/football/card.webp" },
    }),
    false,
  );
  assert.equal(isScannedOrUploadedEventData({ thumbnail: "/images/events/evt/attachment.webp" }), true);
  assert.equal(isScannedOrUploadedEventData({ thumbnail: "/event-media/evt/card.webp" }), false);
});

test("canShowOwnerRsvpDashboard rejects invited events", () => {
  assert.equal(canShowOwnerRsvpDashboard({ ownership: "invited", numberOfGuests: 24 }), false);
  assert.equal(canShowOwnerRsvpDashboard({ invitedFromScan: true, numberOfGuests: 24 }), false);
  assert.equal(
    canShowOwnerRsvpDashboard({
      numberOfGuests: 24,
      sourceContext: { detectedSourceIntent: "received_invite" },
    }),
    false,
  );
});

test("getRsvpDashboardGuestCount normalizes finite positive values", () => {
  assert.equal(getRsvpDashboardGuestCount({ numberOfGuests: "18" }), 18);
  assert.equal(getRsvpDashboardGuestCount({ numberOfGuests: 12.8 }), 12);
  assert.equal(getRsvpDashboardGuestCount({ numberOfGuests: -1 }), 0);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  canShowOwnerRsvpDashboard,
  getRsvpDashboardGuestCount,
  isScannedOrUploadedEventData,
} from "./owner-rsvp-dashboard.ts";

test("canShowOwnerRsvpDashboard requires a positive RSVP guest count", () => {
  assert.equal(canShowOwnerRsvpDashboard({ createdVia: "template", numberOfGuests: 24 }), true);
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

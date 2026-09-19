import assert from "node:assert/strict";
import test from "node:test";
import { reconcileCampaignMapEvidence } from "./create-campaign-reconciliation.mjs";

const href = "https://www.google.com/maps/search/?api=1&query=Room%20B%2C%20100%20Example%20Lane";
const fixture = () => ({
  attemptId: "attempt-1", publicUrl: "http://127.0.0.1:3107/card/event-1", checks: { requiredGuestActionsPassed: false },
  findings: [{ summary: "Anonymous guest check failed: directions", kind: "product", verified: false }],
  guest: { mode: "local_anonymous_ui", actions: [{ kind: "directions", valid: false, destination: "", href }], outboundHandoffs: [{ href, mechanism: "window.open" }],
    checks: { anonymousGuestStatus: 200, anonymousSession: true, publicRoutePreserved: true, noOwnerControls: true, mobileOverflow: false, directions: false, calendar: true, rsvp: true, requiredGuestActionsPassed: false }, findings: [] },
});

test("captured Maps search evidence is reconciled without changing the original attempt or claiming navigation", () => {
  const raw = fixture();
  const result = reconcileCampaignMapEvidence(raw);
  assert.equal(raw.guest.checks.directions, false);
  assert.equal(result.guest.checks.directions, true);
  assert.equal(result.checks.requiredGuestActionsPassed, true);
  assert.equal(result.guestActions[0].originalValidation.valid, false);
  assert.equal(result.guestActions[0].destination, "Room B, 100 Example Lane");
  assert.equal(result.handoffReconciliation.externalNavigationTested, false);
  assert.equal(result.findings[0].kind, "infrastructure");
});

test("reconciliation cannot invent handoffs or pass missing calendar, RSVP, or interrupted guest checks", () => {
  const absent = fixture();
  absent.guest.outboundHandoffs = [];
  assert.equal(reconcileCampaignMapEvidence(absent), absent);
  for (const field of ["calendar", "rsvp", "anonymousSession"]) {
    const raw = fixture(); raw.guest.checks[field] = false;
    assert.equal(reconcileCampaignMapEvidence(raw).checks.requiredGuestActionsPassed, false);
  }
  const interrupted = fixture(); interrupted.guest.failure = "timeout";
  assert.equal(reconcileCampaignMapEvidence(interrupted).checks.requiredGuestActionsPassed, false);
});

import { recheckCapturedGuestActions } from "./create-campaign-guest.mjs";

/** Reinterpret captured evidence without rewriting the original browser attempt. */
export function reconcileCampaignMapEvidence(original) {
  const guest = original.guest;
  if (guest?.mode !== "local_anonymous_ui" || !Array.isArray(guest.actions) || !original.publicUrl) return original;
  const actions = recheckCapturedGuestActions(guest.actions, original.publicUrl);
  const captured = new Set((guest.outboundHandoffs || []).map(action => action.href));
  const corrected = actions.filter(action => action.kind === "directions" && action.valid === false && captured.has(action.href) && action.recalculatedHandoffValidation.kind === "directions" && action.recalculatedHandoffValidation.valid === true);
  if (!corrected.length || guest.checks?.directions !== false) return original;
  const result = structuredClone(original);
  const hrefs = new Set(corrected.map(action => action.href));
  result.guest.actions = actions.map(action => hrefs.has(action.href) ? { ...action, originalValidation: { valid: action.valid, destination: action.destination ?? null }, ...action.recalculatedHandoffValidation } : action);
  result.guestActions = result.guest.actions;
  result.guest.checks.directions = true;
  const checks = result.guest.checks;
  const complete = !result.guest.failure && checks.anonymousGuestStatus >= 200 && checks.anonymousGuestStatus < 300 && checks.anonymousSession === true && checks.publicRoutePreserved === true && checks.noOwnerControls === true && checks.mobileOverflow === false && checks.directions === true && checks.calendar === true && [true, "not_requested"].includes(checks.rsvp);
  result.guest.checks.requiredGuestActionsPassed = complete;
  result.checks.requiredGuestActionsPassed = complete;
  if (complete && Array.isArray(result.validationGaps)) result.validationGaps = result.validationGaps.filter(gap => gap !== "guest_actions_not_verified");
  const resolveFalseNegative = finding => finding.verified !== true && finding.summary === "Anonymous guest check failed: directions"
    ? { ...finding, kind: "infrastructure", status: "resolved", cause: "maps_search_validator", summary: "Original Maps handoff failure was a URL-checker false negative; the captured destination URL is valid." }
    : finding;
  result.findings = (result.findings || []).map(resolveFalseNegative);
  result.guest.findings = (result.guest.findings || []).map(resolveFalseNegative);
  result.handoffReconciliation = { version: 1, sourceAttemptId: result.attemptId, basis: "Captured outbound URLs were rechecked after adding Google Maps search-query support. Raw browser evidence is unchanged.", correctedUrls: corrected.map(action => action.href), externalNavigationTested: false, originalDirectionsCheck: false, recalculatedDirectionsCheck: true };
  return result;
}

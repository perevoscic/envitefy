import { isDeepStrictEqual } from "node:util";

export const FACT_FIELDS = Object.freeze([
  "title",
  "honoreeName",
  "ageOrMilestone",
  "eventType",
  "dateText",
  "timeText",
  "startISO",
  "endISO",
  "timezone",
  "location",
  "venue",
  "additionalLocations",
  "rsvpEnabled",
  "rsvpName",
  "rsvpContact",
  "rsvpDeadline",
  "registryLink",
  "giftPreferenceNote",
  "previewCopy",
]);
const BUDGET_CODES = new Set([
  "budget_exhausted",
  "phase_budget_exhausted",
  "budget_halted",
  "reservation_overrun",
  "image_bound_unavailable",
  "output_bound_required",
  "metered_target_reached",
  "campaign_target_reached",
  "unknown_usage",
  "uncertain_usage",
]);
const QUOTA_CODES = new Set([
  "insufficient_quota",
  "billing_hard_limit_reached",
  "billing_not_active",
  "provider_quota",
  "api_quota",
]);
const INFRASTRUCTURE_CODES = new Set([
  "unsupported_endpoint",
  "unsupported_model",
  "unsupported_billable_feature",
  "unknown_service_tier",
  "invalid_test_upstream",
  "gateway_failure",
  "unauthorized",
  "missing_api_key",
  "ledger_corrupt",
  "ledger_locked",
  "ledger_limits_changed",
  "harness_interaction",
  "harness_maintenance",
  "guest_isolation_required",
  "api_rate_limit",
  "api_error",
]);
const SCORE_DIMENSIONS = [
  "understanding",
  "factualAccuracy",
  "usefulQuestions",
  "qaAccuracy",
  "conversationFlow",
  "visualFidelity",
  "usability",
  "completion",
];

/** Snapshot deltas are necessary: old blockers must not contaminate a retest. */
export function collectCaseBudgetEvidence({ before = {}, after = {}, caseId }) {
  const beforeReservations = new Set((before.reservations || []).map((entry) => entry.id));
  const reservations = (after.reservations || []).filter(
    (entry) => !beforeReservations.has(entry.id) && entry.caseId === caseId,
  );
  const previousBlocks = before.blocks || [];
  const allBlocks = after.blocks || [];
  const prefixMatches =
    previousBlocks.length <= allBlocks.length &&
    previousBlocks.every((entry, index) => isDeepStrictEqual(entry, allBlocks[index]));
  if (!prefixMatches) return { blocks: [], reservations, journalMismatch: true };
  return {
    blocks: allBlocks.slice(previousBlocks.length).filter((entry) => entry.caseId === caseId),
    reservations,
    journalMismatch: false,
  };
}

export function diffDraftFacts(before, after, { allowChanges = [] } = {}) {
  if (!before || !after) return [];
  const allowed = new Set(allowChanges);
  return FACT_FIELDS.filter(
    (field) => !allowed.has(field) && !isDeepStrictEqual(before[field], after[field]),
  ).map((field) => ({ field, before: before[field] ?? null, after: after[field] ?? null }));
}

/** A deterministic extraction result can establish a regression, never AI quality. */
export function reviewOfflineFactCase(scenario, result) {
  const findings = [];
  let previous;
  for (const snapshot of result.snapshots || []) {
    if (snapshot.kind === "question" && previous?.draft) {
      const changed = diffDraftFacts(previous.draft, snapshot.draft);
      for (const change of changed)
        findings.push({
          kind: "product",
          severity: "high",
          verified: true,
          mode: "deterministic_only",
          title: `Capability question changed ${change.field}`,
          detail: {
            ...change,
            question: scenario.messages?.find((message) => message.kind === "question")?.text,
          },
          stage: "question",
          cause: "fallback_extraction",
          caseId: scenario.id,
        });
    }
    previous = snapshot;
  }
  if (previous?.draft && result.finalDraft) {
    for (const change of diffDraftFacts(previous.draft, result.finalDraft))
      findings.push({
        kind: "product",
        severity: "high",
        verified: true,
        mode: "deterministic_only",
        title: `Appearance request changed ${change.field}`,
        detail: change,
        stage: "style_edit",
        cause: "fallback_extraction",
        caseId: scenario.id,
      });
  }
  return {
    caseId: scenario.id,
    mode: "deterministic_only",
    passed: findings.length === 0,
    modelQualityEligible: false,
    findings,
  };
}

/** Count a new artwork operation only when distinct successful evidence exists. */
export function inspectNewGeneration({ before = [], after = [] }) {
  if (after.length <= before.length) return { complete: false, reason: "no_new_generation" };
  const newlyObserved = after.slice(before.length);
  const successful = newlyObserved.filter(
    (entry) => entry.ok === true && (entry.imageUrl || entry.imageDataUrl || entry.artifactSha256),
  );
  if (!successful.length)
    return { complete: false, reason: "new_generation_failed_or_missing_artifact" };
  const previousIdentities = new Set(
    before
      .map((entry) => entry.artifactSha256 || entry.imageDataUrl || entry.imageUrl)
      .filter(Boolean),
  );
  const fresh = successful.find(
    (entry) =>
      !previousIdentities.has(entry.artifactSha256 || entry.imageDataUrl || entry.imageUrl),
  );
  return fresh
    ? { complete: true, generation: fresh }
    : { complete: false, reason: "stale_generation_reused" };
}

function completionGaps(result) {
  const gaps = [];
  const checks = result.checks || {};
  if (checks.authenticatedRegularUser !== true) gaps.push("regular_account_not_verified");
  const beforeSave = checks.beforeExplicitSave;
  if (
    !beforeSave ||
    beforeSave.before == null ||
    beforeSave.after == null ||
    !isDeepStrictEqual(beforeSave.before, beforeSave.after) ||
    beforeSave.observedDraftWrites !== 0
  )
    gaps.push("explicit_save_boundary_not_verified");
  if (!(checks.explicitSaveWrites > 0)) gaps.push("explicit_save_not_verified");
  if (checks.resumeFactsPreserved !== true) gaps.push("resumed_facts_not_verified");
  if (checks.resumeArtworkPreserved !== true) gaps.push("resumed_artwork_not_verified");
  if (checks.appearanceEditFactsPreserved !== true) gaps.push("appearance_edit_facts_not_verified");
  if (!result.eventId || !result.publicUrl) gaps.push("publication_not_verified");
  if (!(checks.anonymousGuestStatus >= 200 && checks.anonymousGuestStatus < 300))
    gaps.push("anonymous_guest_access_not_verified");
  if (!(result.generations?.length >= 2) || result.generations.some((entry) => entry.ok !== true))
    gaps.push("two_artwork_operations_not_verified");
  const artifacts = (result.generations || []).filter((entry) => entry.ok === true);
  if (
    artifacts.length < 2 ||
    artifacts.some(
      (entry) => !entry.artifactSha256 || entry.archival?.verification?.decoded !== true,
    )
  )
    gaps.push("artwork_archival_not_verified");
  if (new Set(artifacts.map((entry) => entry.artifactSha256).filter(Boolean)).size < 2)
    gaps.push("distinct_artwork_not_verified");
  if (checks.requiredGuestActionsPassed !== true) gaps.push("guest_actions_not_verified");
  if (
    checks["preview-desktop"]?.horizontalOverflow !== false ||
    checks["preview-mobile"]?.horizontalOverflow !== false
  )
    gaps.push("responsive_previews_not_verified");
  if (
    ["preview-desktop", "preview-mobile"].some(
      (key) =>
        checks[key]?.fullScreenOpened !== true ||
        !checks[key]?.artwork?.length ||
        checks[key].artwork.some((image) => image.decoded !== true),
    )
  )
    gaps.push("rendered_artwork_preview_not_verified");
  return gaps;
}

function structuredFailureCodes(result) {
  const candidates = [
    result.error?.code,
    result.blocker?.code,
    ...(result.errors || []).map((error) => error.code),
    ...(result.generations || []).flatMap((item) =>
      Object.values(item.errors || {}).map((error) => error?.code),
    ),
  ];
  // Match stable gateway codes only. A user's request mentioning their party
  // budget is not evidence that the API campaign allowance was exhausted.
  for (const code of [...BUDGET_CODES, ...QUOTA_CODES, ...INFRASTRUCTURE_CODES]) {
    if (typeof result.failure === "string" && new RegExp(`\\b${code}\\b`).test(result.failure))
      candidates.push(code);
  }
  return candidates.filter((value) => typeof value === "string");
}

/**
 * Final coordinator gate. It never awards a score or promotes an unreviewed
 * journey to passed. Ledger blockers take precedence over generic app errors,
 * while independently verified product regressions remain product findings.
 */
export function adjudicateCampaignCase(result, { ledgerBefore = {}, ledgerAfter = {} } = {}) {
  const budgetEvidence = collectCaseBudgetEvidence({
    before: ledgerBefore,
    after: ledgerAfter,
    caseId: result.caseId,
  });
  const currentHalt =
    ledgerAfter.haltInfo &&
    ledgerAfter.haltInfo !== ledgerBefore.haltInfo &&
    ledgerAfter.haltInfo.caseId === result.caseId
      ? ledgerAfter.haltInfo
      : null;
  const codes = [
    ...budgetEvidence.blocks.flatMap((entry) => [entry.code, entry.providerCode]),
    currentHalt?.code,
    currentHalt?.providerCode,
    ...structuredFailureCodes(result),
  ];
  const quotaBlocked = codes.some((code) => QUOTA_CODES.has(code));
  const budgetBlocked = codes.some((code) => BUDGET_CODES.has(code));
  const infrastructureBlocked =
    budgetEvidence.journalMismatch ||
    codes.some((code) => INFRASTRUCTURE_CODES.has(code)) ||
    result.stage === "authentication";
  const assistants = (result.transcript || []).filter(
    (turn) => turn.role === "assistant" && turn.source !== "client_status",
  );
  const fallbackObserved =
    result.modelFallbacks > 0 || assistants.some((turn) => turn.usedAi === false);
  const modelQualityEligible =
    !quotaBlocked &&
    !budgetBlocked &&
    !infrastructureBlocked &&
    !fallbackObserved &&
    assistants.length > 0 &&
    assistants.every((turn) => turn.usedAi === true);
  const validationGaps = completionGaps(result);
  if (!modelQualityEligible) validationGaps.push("model_quality_not_verified");
  const scoreReviewComplete = SCORE_DIMENSIONS.every(
    (dimension) =>
      Number.isInteger(result.scores?.[dimension]) &&
      result.scores[dimension] >= 1 &&
      result.scores[dimension] <= 5,
  );
  const scoresPass =
    scoreReviewComplete && SCORE_DIMENSIONS.every((dimension) => result.scores[dimension] >= 4);
  const verifiedBlockingFinding = (result.findings || []).some(
    (finding) =>
      finding.kind === "product" &&
      finding.verified === true &&
      ["critical", "high"].includes(finding.severity) &&
      finding.status !== "fixed",
  );
  let status = result.status;
  let executionClassification = "unclassified";
  if (quotaBlocked) {
    status = "budget-deferred";
    executionClassification = "api_quota";
  } else if (budgetBlocked) {
    status = "budget-deferred";
    executionClassification = "campaign_budget";
  } else if (infrastructureBlocked) {
    status = "blocked";
    executionClassification = "infrastructure";
  } else if (fallbackObserved) executionClassification = "fallback_observed";
  else if (result.status === "failed") executionClassification = "product";
  if (status === "passed" && verifiedBlockingFinding) status = "failed";
  else if (status === "passed" && (validationGaps.length || !scoreReviewComplete))
    status = "incomplete";
  else if (status === "passed" && !scoresPass) status = "failed";
  const findings = (result.findings || []).map((finding) => {
    const verifiedProduct = finding.kind === "product" && finding.verified === true;
    if (
      (quotaBlocked || budgetBlocked || infrastructureBlocked) &&
      !verifiedProduct &&
      ["execution", undefined].includes(finding.kind)
    )
      return {
        ...finding,
        kind: "infrastructure",
        verified: false,
        productRegression: false,
        cause: executionClassification,
      };
    return { ...finding };
  });
  return {
    ...result,
    status,
    findings,
    executionClassification,
    modelQualityEligible,
    promptQualityStatus: modelQualityEligible ? "available_for_review" : "not_evaluated",
    fallbackObserved,
    validationGaps,
    reviewRequired: !scoreReviewComplete,
    budgetEvidence,
  };
}

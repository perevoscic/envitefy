const QUOTA_CODES = new Set([
  "insufficient_quota",
  "billing_hard_limit_reached",
  "billing_not_active",
  "provider_quota",
  "api_quota",
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

export function newCampaignExecution({
  caseIds,
  scope,
  budgetPolicy,
  ledger,
  previousExecution = null,
}) {
  return {
    executionId: new Date().toISOString().replaceAll(/[:.]/g, "-"),
    status: "running",
    startedAt: new Date().toISOString(),
    scope,
    budgetPolicy,
    previousExecution,
    plannedCaseIds: [...caseIds],
    remainingCaseIds: [...caseIds],
    attemptedCaseIds: [],
    completedCaseIds: [],
    lastCaseId: null,
    lastStage: "starting",
    lastTurn: null,
    nextCaseId: caseIds[0] || null,
    stopReason: null,
    budget: budgetCheckpoint(ledger),
  };
}

export function budgetCheckpoint(ledger = {}) {
  const knownCharges = ledger.reservations?.filter(
    (item) => item.status === "settled" && item.costKind === "reported_usage",
  );
  return {
    budgetUsd: ledger.budgetUsd ?? null,
    spentUsd: ledger.spentUsd ?? null,
    billedUsd: knownCharges
      ? knownCharges.reduce((sum, item) => sum + item.chargedNanos / 1e9, 0)
      : (ledger.spentUsd ?? null),
    reservedUsd: ledger.reservedUsd ?? null,
    remainingUsd: ledger.remainingUsd ?? null,
  };
}

export function checkpointExecution(execution, result, ledger, context = {}) {
  const turn = result.transcript?.findLast((item) => item.role === "user");
  return {
    ...execution,
    checkpointAt: new Date().toISOString(),
    lastCaseId: result.caseId,
    lastStage: result.stage,
    lastAttemptId: result.attemptId || null,
    lastTurn: {
      index: result.transcript?.filter((item) => item.role === "user").length || 0,
      id: context.turnId || null,
      kind: turn?.kind || null,
      role: turn ? "user" : null,
    },
    budget: budgetCheckpoint(ledger),
    attemptedCaseIds: [...new Set([...execution.attemptedCaseIds, result.caseId])],
    evidence: result.evidence || [],
  };
}

/** Only provider metadata/ledger evidence establish a monetary stop. */
export function campaignStopReason(result, { before = {}, after = {} } = {}) {
  const oldReservations = new Set((before.reservations || []).map((item) => item.id));
  const newReservations = (after.reservations || []).filter(
    (item) => !oldReservations.has(item.id),
  );
  const blocks = (after.blocks || []).slice((before.blocks || []).length);
  const codes = [
    result.error?.code,
    result.blocker?.code,
    after.haltedCode,
    after.haltInfo?.code,
    after.haltInfo?.providerCode,
    ...(result.generations || []).flatMap((item) =>
      Object.values(item.errors || {}).map((error) => error?.code),
    ),
    ...blocks.map((item) => item.code),
  ];
  const request =
    after.haltInfo ||
    blocks.at(-1) ||
    newReservations.findLast((item) => item.status === "retained");
  const reservation = request?.reservationId
    ? (after.reservations || []).find((item) => item.id === request.reservationId)
    : null;
  const stoppedAtRequest = (reason) => ({
    ...reason,
    stoppingRequest: request
      ? {
          caseId: request.caseId || reservation?.caseId || null,
          turnId: request.turnId || reservation?.turnId || null,
          model: request.model || reservation?.model || null,
          endpoint: request.endpoint || reservation?.endpoint || null,
          reservationId:
            request.reservationId || reservation?.id || (request.status ? request.id : null),
          at: request.at || null,
          code: request.code || reason.code,
          providerCode: request.providerCode || null,
        }
      : null,
  });
  const quota = codes.find((code) => QUOTA_CODES.has(code));
  if (quota)
    return stoppedAtRequest({
      kind: "api_quota",
      code: quota,
      providerCode: after.haltInfo?.providerCode || null,
      message: after.haltInfo?.reason || "The provider reported an account or billing quota limit.",
    });
  if (codes.includes("api_rate_limit") || codes.includes("api_error"))
    return stoppedAtRequest({
      kind: "infrastructure",
      code: after.haltInfo?.code || "api_error",
      providerCode: after.haltInfo?.providerCode || null,
      message:
        after.haltInfo?.reason ||
        "The provider request failed. Any uncertain reservation remains retained.",
    });
  if (
    newReservations.some((item) => item.status === "retained") ||
    (after.halted && /unknown|uncertain|missing.+usage/i.test(after.halted))
  ) {
    return stoppedAtRequest({
      kind: "campaign_budget",
      code: "unknown_usage",
      message:
        "A request has uncertain charges. Its reservation is retained and further paid work is stopped.",
    });
  }
  const budgetCode = codes.find((code) => BUDGET_CODES.has(code));
  if (
    budgetCode ||
    after.halted ||
    (typeof after.remainingUsd === "number" && after.remainingUsd <= 0)
  ) {
    return stoppedAtRequest({
      kind: "campaign_budget",
      code: budgetCode || after.haltInfo?.code || after.haltedCode || "metered_target_reached",
      message:
        after.haltInfo?.reason ||
        after.halted ||
        (budgetCode === "image_bound_unavailable"
          ? "The strict policy cannot establish a permitted maximum charge for this image request."
          : "The next request cannot fit the campaign spending rule."),
    });
  }
  if (result.stage === "authentication")
    return {
      kind: "infrastructure",
      code: "authentication_failed",
      message: result.failure || "The isolated account could not reach the creation UI.",
    };
  return null;
}

export function finishCaseExecution(execution, result, ledger) {
  const complete = result.stage === "needs_review" || result.status === "passed";
  const remaining = execution.remainingCaseIds.filter((id) => id !== result.caseId);
  return {
    ...execution,
    checkpointAt: new Date().toISOString(),
    lastResultStatus: result.status,
    remainingCaseIds: remaining,
    nextCaseId: remaining[0] || null,
    completedCaseIds: complete
      ? [...new Set([...execution.completedCaseIds, result.caseId])]
      : execution.completedCaseIds,
    budget: budgetCheckpoint(ledger),
  };
}

export function stopExecution(execution, reason, ledger) {
  return {
    ...execution,
    status: "stopped",
    stopReason: reason,
    stoppedAt: new Date().toISOString(),
    budget: budgetCheckpoint(ledger),
  };
}

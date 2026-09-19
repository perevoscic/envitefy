import assert from "node:assert/strict";
import test from "node:test";
import {
  campaignStopReason,
  checkpointExecution,
  finishCaseExecution,
  newCampaignExecution,
  stopExecution,
} from "./create-campaign-execution.mjs";

test("a stopped generation retains its exact case, stage, user turn and remaining queue", () => {
  const ledger = { budgetUsd: 10, spentUsd: 9.8, reservedUsd: 0.2, remainingUsd: 0 };
  let execution = newCampaignExecution({
    caseIds: ["birthday", "football"],
    scope: "complete_journey",
    budgetPolicy: "metered",
    ledger,
  });
  execution = checkpointExecution(
    execution,
    {
      caseId: "birthday",
      attemptId: "one",
      stage: "generation",
      transcript: [{ role: "user", kind: "correction" }],
    },
    ledger,
    { turnId: "generation" },
  );
  execution = stopExecution(execution, campaignStopReason({}, { after: ledger }), ledger);
  assert.equal(execution.lastCaseId, "birthday");
  assert.equal(execution.lastStage, "generation");
  assert.equal(execution.lastTurn.id, "generation");
  assert.deepEqual(execution.remainingCaseIds, ["birthday", "football"]);
  assert.equal(execution.budget.billedUsd, 9.8);
  assert.equal(execution.status, "stopped");
});

test("old blockers do not poison a new attempt and product failures do not imply spending exhaustion", () => {
  const before = {
    blocks: [{ code: "budget_exhausted" }],
    reservations: [{ id: "old", status: "retained" }],
  };
  assert.equal(
    campaignStopReason(
      { status: "failed", failure: "Budget wording changed" },
      { before, after: { ...before, remainingUsd: 5 } },
    ),
    null,
  );
  const execution = newCampaignExecution({ caseIds: ["a", "b"], ledger: {} });
  const finished = finishCaseExecution(
    execution,
    { caseId: "a", stage: "generation", status: "failed" },
    {},
  );
  assert.deepEqual(finished.remainingCaseIds, ["b"]);
  assert.deepEqual(finished.completedCaseIds, []);
});

test("provider quota, uncertain spend and authentication have distinct stop reasons", () => {
  assert.equal(
    campaignStopReason({}, { after: { blocks: [{ code: "insufficient_quota" }] } }).kind,
    "api_quota",
  );
  assert.equal(
    campaignStopReason({}, { after: { reservations: [{ id: "new", status: "retained" }] } }).code,
    "unknown_usage",
  );
  assert.equal(campaignStopReason({ stage: "authentication" }, {}).kind, "infrastructure");
  assert.equal(campaignStopReason({ error: { code: "rate_limit_exceeded" } }, { after: {} }), null);
  assert.equal(
    campaignStopReason(
      {},
      {
        after: {
          haltInfo: {
            code: "api_quota",
            providerCode: "insufficient_quota",
            reason: "Account funds exhausted",
          },
          halted: "Account funds exhausted",
        },
      },
    ).kind,
    "api_quota",
  );
  assert.equal(
    campaignStopReason(
      {},
      {
        after: {
          haltInfo: { code: "api_rate_limit", reason: "Too many requests" },
          halted: "Too many requests",
          reservations: [{ id: "new", status: "retained" }],
        },
      },
    ).kind,
    "infrastructure",
  );
});

test("the stopping paid request stays distinct from later UI progress", () => {
  const ledger = {
    halted: "Target reached",
    haltInfo: {
      code: "campaign_target_reached",
      caseId: "birthday",
      turnId: "turn-7",
      reservationId: "image-2",
    },
    reservations: [
      {
        id: "image-2",
        status: "settled",
        model: "gpt-image-2.5-flare",
        endpoint: "/v1/images/edits",
      },
    ],
  };
  const reason = campaignStopReason({ stage: "needs_review" }, { after: ledger });
  assert.equal(reason.kind, "campaign_budget");
  assert.equal(reason.stoppingRequest.turnId, "turn-7");
  assert.equal(reason.stoppingRequest.model, "gpt-image-2.5-flare");
  assert.equal(reason.stoppingRequest.reservationId, "image-2");
});

import assert from "node:assert/strict";
import test from "node:test";

test("explicit retest list preserves requested priority and rejects ambiguous or invalid selections", () => {
  const scenarios = ["a", "b", "c"].map(id => ({ id, pilotOrder: null }));
  const selected = selectCampaignQueue({ scenarios, selectedIds: ["c", "a"] });
  assert.deepEqual(selected.cases.map(item => item.id), ["c", "a"]);
  assert.throws(() => selectCampaignQueue({ scenarios, selectedIds: ["missing"] }), /Unknown selected/);
  assert.throws(() => selectCampaignQueue({ scenarios, selectedIds: ["a", "a"] }), /Duplicate/);
  assert.throws(() => selectCampaignQueue({ scenarios, selectedId: "b", selectedIds: ["a"] }), /either/);
  assert.deepEqual(selectCampaignQueue({ scenarios, selectedIds: ["c", "a"], untestedOnly: true, attemptedCaseIds: ["c"] }).cases.map(item => item.id), ["a"]);
});
import { buildCampaignScenarios } from "./create-campaign-scenarios.mjs";
import { selectCampaignQueue, syncManifestBudget } from "./create-campaign-selection.mjs";

test("untested-only freezes the remaining 44 crosses and skips all prior verdicts", () => {
  const scenarios = buildCampaignScenarios();
  const results = scenarios.slice(0, 49).map((scenario, index) => ({
    caseId: scenario.id,
    status: ["passed", "failed", "blocked", "budget_deferred", "unreviewed"][index % 5],
  }));
  const attemptedCaseIds = results.map((result) => result.caseId);
  const selection = selectCampaignQueue({ scenarios, all: true, untestedOnly: true, attemptedCaseIds });
  assert.equal(selection.cases.length, 44);
  assert.deepEqual(selection.cases.map((scenario) => scenario.id), scenarios.slice(49).map((scenario) => scenario.id));
  assert.deepEqual(selection.skippedAttemptedCaseIds, attemptedCaseIds);
  attemptedCaseIds.push(scenarios[49].id);
  assert.equal(selection.cases.length, 44);
  assert.equal(selection.skippedAttemptedCaseIds.length, 49);
  assert.throws(() => selection.cases.pop(), TypeError);
});

test("ordinary runs retain attempted cases, while start-at is resolved before untested filtering", () => {
  const scenarios = buildCampaignScenarios();
  const attemptedCaseIds = [scenarios[1].id, scenarios[2].id];
  const ordinary = selectCampaignQueue({ scenarios, all: true, attemptedCaseIds });
  assert.equal(ordinary.cases.length, 93);
  const remaining = selectCampaignQueue({ scenarios, all: true, startAt: scenarios[1].id, untestedOnly: true, attemptedCaseIds });
  assert.equal(remaining.cases[0].id, scenarios[3].id);
  assert.equal(remaining.cases.length, 90);
  assert.throws(() => selectCampaignQueue({ scenarios, startAt: "missing" }), /Unknown starting case/);
  assert.equal(selectCampaignQueue({ scenarios, selectedId: scenarios[1].id, untestedOnly: true, attemptedCaseIds }).cases.length, 0);
});

test("manifest only records accepted ledger authorization, preserving the exact additional-$30 reason", () => {
  const reason = "User approved an additional $30 to finish the remaining 44 of 93 cases; cumulative target is prior recorded spend $29.245399873 plus $30.";
  const priorAuthorization = { fromUsd: 15, toUsd: 30, reason: "Previous approval" };
  const manifest = { budgetUsd: 30, budgetAuthorizations: [priorAuthorization], scenarios: ["unchanged"] };
  const ledger = {
    budgetUsd: 59.245399873,
    budgetChanges: [
      { previousBudgetNanos: 15000000000, budgetNanos: 30000000000, reason: "Previous approval" },
      { previousBudgetNanos: 30000000000, budgetNanos: 59245399873, at: "2026-09-19T07:00:00.000Z", reason },
    ],
  };
  const next = syncManifestBudget(manifest, ledger);
  assert.equal(manifest.budgetUsd, 30);
  assert.equal(manifest.budgetAuthorizations.length, 1);
  assert.equal(next.budgetUsd, 59.245399873);
  assert.equal(next.budgetAuthorizations[1].reason, reason);
  assert.equal(next.budgetAuthorizations[1].at, ledger.budgetChanges[1].at);
  assert.equal(next.budgetAuthorizations[0], priorAuthorization);
  assert.equal(next.scenarios, manifest.scenarios);
  assert.equal(syncManifestBudget(next, ledger), next);
});

test("manifest synchronization refuses missing, discontinuous, or lower ledger authorization", () => {
  const manifest = { budgetUsd: 30 };
  assert.throws(() => syncManifestBudget(manifest, { budgetUsd: 59.245399873, budgetChanges: [] }), /no authorization/);
  assert.throws(() => syncManifestBudget(manifest, { budgetUsd: 59.245399873, budgetChanges: [{ previousBudgetNanos: 15000000000, budgetNanos: 59245399873 }] }), /does not match/);
  assert.throws(() => syncManifestBudget(manifest, { budgetUsd: 15, budgetChanges: [] }), /exceeds/);
  assert.equal(manifest.budgetUsd, 30);
});

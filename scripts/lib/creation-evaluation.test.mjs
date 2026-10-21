import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  evaluationOptions,
  estimateCreationCost,
  scoreCreationOutput,
  summarizeCreationEvaluation,
  validateEvaluationFixtures,
} from "./creation-evaluation.mjs";

const fixtures = JSON.parse(
  fs.readFileSync(new URL("../fixtures/creation-evaluation.json", import.meta.url), "utf8"),
);
test("built-in dataset covers missing facts, roles, complete URLs, negation, languages and injection", () => {
  assert.equal(validateEvaluationFixtures(fixtures).length, 10);
  assert.ok(fixtures.every((fixture) => fixture.checks.length >= 2));
});
test("factual scoring fails fabricated dates and shortened URLs despite valid JSON", () => {
  const fixture = {
    checks: [
      { path: "start", op: "exact", value: null },
      { path: "url", op: "exact", value: "https://example.invalid/book?group=42#rooms" },
      { path: "copy", op: "contains", value: "No siblings." },
    ],
  };
  const bad = scoreCreationOutput(
    fixture,
    { start: "2026-10-21", url: "https://example.invalid/book", copy: "Siblings welcome." },
    true,
  );
  assert.equal(bad.schemaValid, true);
  assert.equal(bad.factualChecksPassed, 0);
  assert.equal(bad.passed, false);
  const good = { start: null, url: fixture.checks[1].value, copy: "Bring water. No siblings." };
  assert.equal(scoreCreationOutput(fixture, good, true).passed, true);
  assert.equal(scoreCreationOutput(fixture, good, true, false).passed, false);
});
test("invalid fixture definitions and unbounded repeat/call values fail before provider access", () => {
  assert.throws(() => validateEvaluationFixtures([{ ...fixtures[0], checks: [] }]));
  assert.throws(() => validateEvaluationFixtures([fixtures[0], fixtures[0]]));
  assert.throws(() => evaluationOptions(["--repeats=Infinity"]));
  assert.throws(() => evaluationOptions(["--max-calls=0"]));
  assert.throws(() => evaluationOptions(["--models=gpt-6-luna,gpt-6-luna"]));
  assert.equal(evaluationOptions([]).live, false);
  assert.ok(evaluationOptions([]).models.includes("gpt-6.1-sol"));
});
test("cost estimation separates cached tokens and never invents missing rates or usage", () => {
  assert.equal(
    estimateCreationCost(
      {
        prompt_tokens: 1000,
        completion_tokens: 100,
        prompt_tokens_details: { cached_tokens: 500 },
      },
      { input: 2, cachedInput: 0.2, output: 10 },
    ),
    0.0021,
  );
  assert.equal(estimateCreationCost(undefined, { input: 2, cachedInput: 0.2, output: 10 }), null);
  assert.equal(
    estimateCreationCost({ prompt_tokens: 1000, completion_tokens: 100 }, undefined),
    null,
  );
});
test("summary includes request failures, tail latency and all known costs per passing result", () => {
  const base = { live: true, model: "gpt-6-luna", workload: "extraction", promptVersion: "v2" };
  const summary = summarizeCreationEvaluation([
    {
      ...base,
      durationMs: 100,
      estimatedCostUsd: 0.01,
      scores: { passed: true, schemaValid: true, factualChecksPassed: 2, factualChecksTotal: 2 },
    },
    {
      ...base,
      durationMs: 400,
      estimatedCostUsd: 0.02,
      scores: { passed: false, schemaValid: true, factualChecksPassed: 1, factualChecksTotal: 2 },
    },
  ])[0];
  assert.equal(summary.p95LatencyMs, 400);
  assert.equal(summary.factualCheckPassRate, 0.75);
  assert.equal(summary.estimatedCostPerPassingResultUsd, 0.03);
  const failed = summarizeCreationEvaluation([
    { ...base, durationMs: 200, errorCode: "insufficient_quota", estimatedCostUsd: null },
  ])[0];
  assert.equal(failed.failedRequests, 1);
  assert.equal(failed.estimatedTotalCostUsd, null);
  assert.equal(failed.schemaPassRate, 0);
});

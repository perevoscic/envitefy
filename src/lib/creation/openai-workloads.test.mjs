import assert from "node:assert/strict";
import test from "node:test";
import {
  creationModelBudget,
  normalizeCreationModelUsage,
  recordCreationModelRun,
} from "./openai-workloads.ts";

test("transcription budgets scale by page count with a two-page bound", () => {
  assert.equal(creationModelBudget("gpt-6-luna", "transcription").max_completion_tokens, 6000);
  assert.equal(
    creationModelBudget("gpt-6-luna", "transcription", { pageCount: 2 }).max_completion_tokens,
    12000,
  );
  assert.equal(
    creationModelBudget("gpt-6.1-sol", "transcription", { pageCount: 20 }).max_completion_tokens,
    18000,
  );
});

test("guest chat preserves the fast-model cap and leaves reasoning headroom for a Sol override", () => {
  assert.equal(creationModelBudget("gpt-5.6-luna", "guest_chat").max_completion_tokens, 320);
  assert.equal(creationModelBudget("gpt-6.1-sol", "guest_chat").max_completion_tokens, 2500);
  assert.equal(creationModelBudget("gpt-6.1-sol", "guest_chat").reasoning_effort, "low");
});

test("usage normalization supports Chat and Responses without treating unavailable usage as zero", () => {
  const expected = {
    inputTokens: 100,
    outputTokens: 20,
    cachedInputTokens: 60,
    reasoningTokens: 5,
  };
  assert.deepEqual(
    normalizeCreationModelUsage({
      prompt_tokens: 100,
      completion_tokens: 20,
      prompt_tokens_details: { cached_tokens: 60 },
      completion_tokens_details: { reasoning_tokens: 5 },
    }),
    expected,
  );
  assert.deepEqual(
    normalizeCreationModelUsage({
      input_tokens: 100,
      output_tokens: 20,
      input_tokens_details: { cached_tokens: 60 },
      output_tokens_details: { reasoning_tokens: 5 },
    }),
    expected,
  );
  assert.deepEqual(normalizeCreationModelUsage(), {
    inputTokens: null,
    outputTokens: null,
    cachedInputTokens: null,
    reasoningTokens: null,
  });
  assert.equal(
    normalizeCreationModelUsage({ input_tokens: Number.NaN, output_tokens: -1 }).inputTokens,
    null,
  );
});

test("telemetry includes provider request ID and usage but never arbitrary extra source data", (t) => {
  const calls = [];
  t.mock.method(console, "info", (...args) => calls.push(args));
  recordCreationModelRun({
    workload: "extraction",
    model: "gpt-6-luna",
    startedAt: Date.now(),
    outcome: "invalid_output",
    requestId: "req_offline_123",
    usage: { prompt_tokens: 100 },
    sourceText: "private contact",
    prompt: "private prompt",
  });
  assert.equal(calls[0][1].requestId, "req_offline_123");
  assert.equal(calls[0][1].inputTokens, 100);
  assert.doesNotMatch(JSON.stringify(calls), /private contact|private prompt/);
});

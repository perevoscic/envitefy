import assert from "node:assert/strict";
import test from "node:test";
import { openAiChatCompatibilityParams } from "./openai-chat-params.ts";
import { OPENAI_MODEL_ROLES, openAiModelForRole } from "./openai-model-policy.ts";
import { creationModelBudget } from "./creation/openai-workloads.ts";

test("GPT-5.6 Terra and Luna preserve non-reasoning request behavior", () => {
  assert.deepEqual(openAiChatCompatibilityParams("gpt-5.6-terra", { temperature: 0.4 }), {
    reasoning_effort: "none",
  });
  assert.deepEqual(openAiChatCompatibilityParams("gpt-5.6-luna", { temperature: 0.1 }), {
    reasoning_effort: "none",
  });
});

test("GPT-5.6 Sol keeps its medium reasoning default", () => {
  assert.deepEqual(openAiChatCompatibilityParams("gpt-5.6-sol", { temperature: 0.6 }), {});
});

test("Astra preserves premium reasoning and omits unsupported sampling parameters", () => {
  for (const model of ["gpt-6-astra", "gpt-6-astra-2026-09-03", " GPT-6-ASTRA "]) {
    assert.deepEqual(openAiChatCompatibilityParams(model, { temperature: 0.6 }), {
      reasoning_effort: "medium",
    });
    assert.deepEqual(openAiChatCompatibilityParams(model), { reasoning_effort: "medium" });
  }
});

test("older models retain supported temperature settings", () => {
  assert.deepEqual(openAiChatCompatibilityParams("gpt-4.1-mini", { temperature: 0.2 }), {
    temperature: 0.2,
  });
});

test("GPT-6 model aliases and snapshots use explicit supported reasoning without temperature", () => {
  for (const family of ["gpt-6.1-sol", "gpt-6-sol", "gpt-6-luna"]) {
    for (const model of [family, `${family}-2026-10-01`, ` ${family.toUpperCase()} `]) {
      const expected = family === "gpt-6-luna" ? "none" : "medium";
      assert.deepEqual(openAiChatCompatibilityParams(model, { temperature: 0.6 }), { reasoning_effort: expected });
      const extraction = creationModelBudget(model, "extraction");
      assert.equal(extraction.temperature, undefined);
      assert.equal(extraction.reasoning_effort, expected === "none" ? "none" : "low");
      assert.equal(extraction.max_completion_tokens, expected === "none" ? 3500 : 6000);
    }
  }
});

test("reasoning overrides reject unsupported none and support deliberate Luna reasoning", () => {
  assert.throws(() => openAiChatCompatibilityParams("gpt-6.1-sol", { reasoningEffort: "none" }), /does not support/);
  assert.throws(() => openAiChatCompatibilityParams("gpt-6-astra", { reasoningEffort: "none" }), /does not support/);
  assert.deepEqual(openAiChatCompatibilityParams("gpt-6-luna", { temperature: 0.4, reasoningEffort: "low" }), { reasoning_effort: "low" });
  assert.deepEqual(openAiChatCompatibilityParams("gpt-6-sol", { reasoningEffort: "none" }), { reasoning_effort: "none" });
});

test("unrecognized reasoning model families do not inherit sampling parameters", () => {
  for (const model of ["gpt-6.2-sol", "gpt-5.6-sol", "o3", "o4-mini"]) {
    assert.deepEqual(openAiChatCompatibilityParams(model, { temperature: 0.5 }), {});
  }
});

test("model registry retains production defaults and honors explicit overrides", () => {
  assert.equal(openAiModelForRole("fast"), "gpt-5.6-luna");
  assert.equal(openAiModelForRole("balanced"), "gpt-5.6-terra");
  assert.equal(openAiModelForRole("creative"), "gpt-6-astra");
  assert.equal(openAiModelForRole("image_edit"), "gpt-image-2.5-flare");
  assert.equal(openAiModelForRole("image_edit", " gpt-image-2.5-sunburst "), "gpt-image-2.5-sunburst");
  assert.equal(OPENAI_MODEL_ROLES.balanced.candidateModel, "gpt-6.1-sol");
});

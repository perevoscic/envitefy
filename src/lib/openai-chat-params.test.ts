import assert from "node:assert/strict";
import test from "node:test";
import { openAiChatCompatibilityParams } from "./openai-chat-params.ts";

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

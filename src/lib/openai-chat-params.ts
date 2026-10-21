import { openAiChatCapabilities, type OpenAiReasoningEffort } from "./openai-model-policy.ts";

type OpenAiChatCompatibilityOptions = {
  temperature?: number;
  reasoningEffort?: OpenAiReasoningEffort;
};

/**
 * Preserve explicit family defaults and omit sampling when reasoning is used.
 * Workload budgets may select a supported effort without changing the model.
 */
export function openAiChatCompatibilityParams(
  model: unknown,
  options: OpenAiChatCompatibilityOptions = {},
): Record<string, string | number> {
  const capabilities = openAiChatCapabilities(model);
  const effort = options.reasoningEffort ?? capabilities.defaultEffort;
  if (effort) {
    if (effort === "none" && !capabilities.supportsNone) {
      throw new Error(`Model ${String(model)} does not support reasoning_effort none.`);
    }
    return { reasoning_effort: effort };
  }
  if (!capabilities.sampling) return {};
  const temperature = options.temperature;
  return typeof temperature === "number" && Number.isFinite(temperature) ? { temperature } : {};
}

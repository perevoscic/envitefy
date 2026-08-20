type OpenAiChatCompatibilityOptions = {
  temperature?: number;
};

/**
 * Preserve the effective behavior of the model roles Envitefy used before GPT-5.6.
 * Terra and Luna replace non-reasoning balanced/fast routes, while Sol replaces
 * GPT-5.5 routes that already defaulted to medium reasoning.
 */
export function openAiChatCompatibilityParams(
  model: unknown,
  options: OpenAiChatCompatibilityOptions = {},
): Record<string, string | number> {
  const normalized = typeof model === "string" ? model.trim().toLowerCase() : "";

  if (/^gpt-5\.6-(?:terra|luna)(?:-|$)/.test(normalized)) {
    return { reasoning_effort: "none" };
  }

  if (/^gpt-5(?:[.-]|$)/.test(normalized)) {
    return {};
  }

  const temperature = options.temperature;
  return typeof temperature === "number" && Number.isFinite(temperature) ? { temperature } : {};
}

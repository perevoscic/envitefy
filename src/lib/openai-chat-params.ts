type OpenAiChatCompatibilityOptions = {
  temperature?: number;
};

/**
 * Preserve reasoning by workload: Terra/Luna run without reasoning, while
 * Astra keeps the medium effort used by the premium Sol routes it replaces.
 * Astra does not accept custom temperature or non-reasoning effort levels.
 */
export function openAiChatCompatibilityParams(
  model: unknown,
  options: OpenAiChatCompatibilityOptions = {},
): Record<string, string | number> {
  const normalized = typeof model === "string" ? model.trim().toLowerCase() : "";

  if (/^gpt-6-astra(?:-|$)/.test(normalized)) {
    return { reasoning_effort: "medium" };
  }

  if (/^gpt-5\.6-(?:terra|luna)(?:-|$)/.test(normalized)) {
    return { reasoning_effort: "none" };
  }

  if (/^gpt-5(?:[.-]|$)/.test(normalized)) {
    return {};
  }

  const temperature = options.temperature;
  return typeof temperature === "number" && Number.isFinite(temperature) ? { temperature } : {};
}

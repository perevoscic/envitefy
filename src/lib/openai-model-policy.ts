export type OpenAiReasoningEffort = "none" | "low" | "medium" | "high" | "xhigh" | "max";
export const OPENAI_MODEL_POLICY_VERSION = "openai-workloads-2026-10-21";

/** Current production defaults and candidates to compare before a model rollout. */
export const OPENAI_MODEL_ROLES = {
  fast: { defaultModel: "gpt-5.6-luna", candidateModel: "gpt-6-luna" },
  balanced: { defaultModel: "gpt-5.6-terra", candidateModel: "gpt-6.1-sol" },
  premium: { defaultModel: "gpt-6-astra", candidateModel: "gpt-6-astra" },
  creative: { defaultModel: "gpt-6-astra", candidateModel: "gpt-6.1-sol" },
  image: { defaultModel: "gpt-image-2.5-flare", candidateModel: "gpt-image-2.5-flare" },
  image_edit: { defaultModel: "gpt-image-2.5-flare", candidateModel: "gpt-image-2.5-sunburst" },
} as const;

export function openAiModelForRole(
  role: keyof typeof OPENAI_MODEL_ROLES,
  override?: unknown,
): string {
  return typeof override === "string" && override.trim()
    ? override.trim()
    : OPENAI_MODEL_ROLES[role].defaultModel;
}

export function openAiChatCapabilities(model: unknown): {
  defaultEffort?: OpenAiReasoningEffort;
  supportsNone: boolean;
  sampling: boolean;
} {
  const name = typeof model === "string" ? model.trim().toLowerCase() : "";
  if (/^gpt-(?:6-astra|6\.1-sol)(?:-|$)/.test(name)) {
    return { defaultEffort: "medium", supportsNone: false, sampling: false };
  }
  if (/^gpt-6-sol(?:-|$)/.test(name)) {
    return { defaultEffort: "medium", supportsNone: true, sampling: false };
  }
  if (/^gpt-(?:6-luna|5\.6-(?:terra|luna))(?:-|$)/.test(name)) {
    return { defaultEffort: "none", supportsNone: true, sampling: false };
  }
  // Preserve older reasoning defaults. Unknown reasoning families must not
  // inherit sampling parameters merely because their name is new.
  if (/^(?:gpt-[56](?:[.-]|$)|o[134](?:-|$))/.test(name)) {
    return { supportsNone: false, sampling: false };
  }
  return { supportsNone: false, sampling: true };
}

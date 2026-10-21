import { openAiChatCompatibilityParams } from "../openai-chat-params.ts";
import { openAiChatCapabilities, OPENAI_MODEL_POLICY_VERSION } from "../openai-model-policy.ts";
import { CREATION_PROMPT_VERSION } from "./source-evidence.ts";

export const CREATION_WORKLOAD_POLICY = {
  guest_chat: { role: "fast", outputTokens: 320, reasoningTokens: 2500, timeoutMs: 20000 },
  classification: { role: "fast", outputTokens: 1500, reasoningTokens: 6000, timeoutMs: 30000 },
  transcription: { role: "fast", outputTokens: 6000, reasoningTokens: 9000, timeoutMs: 90000 },
  extraction: { role: "fast", outputTokens: 3500, reasoningTokens: 6000, timeoutMs: 30000 },
  correction: { role: "balanced", outputTokens: 3500, reasoningTokens: 6000, timeoutMs: 30000 },
  creative_plan: { role: "creative", outputTokens: 5000, reasoningTokens: 10000, timeoutMs: 60000 },
  visual_check: { role: "premium", outputTokens: 3500, reasoningTokens: 6000, timeoutMs: 30000 },
} as const;
export type CreationWorkload = keyof typeof CREATION_WORKLOAD_POLICY;

export function creationModelBudget(
  model: string,
  workload: CreationWorkload,
  options: { pageCount?: number } = {},
) {
  const policy = CREATION_WORKLOAD_POLICY[workload];
  const capabilities = openAiChatCapabilities(model);
  const reasoning =
    capabilities.defaultEffort !== undefined && capabilities.defaultEffort !== "none";
  const creative = workload === "creative_plan";
  const pages =
    workload === "transcription" ? Math.max(1, Math.min(2, Math.floor(options.pageCount || 1))) : 1;
  return {
    ...openAiChatCompatibilityParams(model, {
      temperature: creative ? 0.6 : 0.1,
      ...(reasoning ? { reasoningEffort: creative ? ("medium" as const) : ("low" as const) } : {}),
    }),
    max_completion_tokens: (reasoning ? policy.reasoningTokens : policy.outputTokens) * pages,
  };
}
export function creationTimeoutMs(workload: CreationWorkload): number {
  return CREATION_WORKLOAD_POLICY[workload].timeoutMs;
}

export type CreationModelUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number | null } | null;
  input_tokens_details?: { cached_tokens?: number | null } | null;
  completion_tokens_details?: { reasoning_tokens?: number | null } | null;
  output_tokens_details?: { reasoning_tokens?: number | null } | null;
};

export function normalizeCreationModelUsage(usage?: CreationModelUsage | null) {
  const count = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  return {
    inputTokens: count(usage?.prompt_tokens ?? usage?.input_tokens),
    outputTokens: count(usage?.completion_tokens ?? usage?.output_tokens),
    cachedInputTokens: count(
      usage?.prompt_tokens_details?.cached_tokens ?? usage?.input_tokens_details?.cached_tokens,
    ),
    reasoningTokens: count(
      usage?.completion_tokens_details?.reasoning_tokens ??
        usage?.output_tokens_details?.reasoning_tokens,
    ),
  };
}

/** No prompts, transcripts, provider error bodies, contact information or model copy in telemetry. */
export function recordCreationModelRun(input: {
  workload: CreationWorkload;
  model: string;
  startedAt: number;
  outcome: "success" | "invalid_output" | "refused" | "incomplete" | "error";
  requestId?: string | null;
  usage?: CreationModelUsage | null;
}) {
  console.info("creation_model_run", {
    version: CREATION_PROMPT_VERSION,
    policyVersion: OPENAI_MODEL_POLICY_VERSION,
    workload: input.workload,
    model: input.model,
    durationMs: Date.now() - input.startedAt,
    outcome: input.outcome,
    requestId:
      input.requestId && /^req_[a-zA-Z0-9_-]{1,200}$/.test(input.requestId)
        ? input.requestId
        : null,
    ...normalizeCreationModelUsage(input.usage),
  });
}

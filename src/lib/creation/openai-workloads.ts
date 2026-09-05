import { openAiChatCompatibilityParams } from "../openai-chat-params.ts";
import { CREATION_PROMPT_VERSION } from "./source-evidence.ts";

export type CreationWorkload = "extraction" | "correction" | "creative_plan" | "visual_check";
export function creationModelBudget(model: string, workload: CreationWorkload) {
  const astra = /^gpt-6-astra(?:-|$)/i.test(model);
  const creative = workload === "creative_plan";
  return {
    ...openAiChatCompatibilityParams(model, { temperature: creative ? 0.6 : 0.1 }),
    ...(astra ? { reasoning_effort: creative ? ("medium" as const) : ("low" as const) } : {}),
    max_completion_tokens: astra ? (creative ? 10000 : 6000) : creative ? 5000 : 3500,
  };
}
export function creationTimeoutMs(workload: CreationWorkload): number {
  return workload === "creative_plan" ? 60000 : 30000;
}

/** No prompts, transcripts, provider error bodies, contact information or model copy in telemetry. */
export function recordCreationModelRun(input: {
  workload: CreationWorkload;
  model: string;
  startedAt: number;
  outcome: "success" | "invalid_output" | "refused" | "incomplete" | "error";
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    completion_tokens_details?: { reasoning_tokens?: number | null } | null;
  };
}) {
  console.info("creation_model_run", {
    version: CREATION_PROMPT_VERSION,
    workload: input.workload,
    model: input.model,
    durationMs: Date.now() - input.startedAt,
    outcome: input.outcome,
    inputTokens: input.usage?.prompt_tokens ?? null,
    outputTokens: input.usage?.completion_tokens ?? null,
    reasoningTokens: input.usage?.completion_tokens_details?.reasoning_tokens ?? null,
  });
}

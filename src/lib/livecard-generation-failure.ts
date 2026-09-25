export type LiveCardGenerationStage = "design" | "lettering";
export type LiveCardGenerationCode =
  | "quality_rejected"
  | "verification_unavailable"
  | "generation_failed"
  | "invalid_artwork";

const ISSUE_CODES = new Set([
  "unexpected_text", "incorrect_title", "unsafe_placement", "reference_mismatch",
  "unreadable_text", "missing_copy", "weak_composition", "style_mismatch",
  "requested_change_not_applied", "faux_controls", "device_frame", "forbidden_footer",
  "essential_clipping", "safety_mismatch",
]);

export function normalizeLiveCardIssues(issues: unknown): string[] {
  return Array.isArray(issues)
    ? [...new Set(issues.filter((issue): issue is string => typeof issue === "string" && ISSUE_CODES.has(issue)))]
    : [];
}

export class LiveCardGenerationFailure extends Error {
  readonly issues: string[];
  readonly stage: LiveCardGenerationStage;
  readonly code: LiveCardGenerationCode;
  readonly retryable: boolean;
  constructor(
    message: string,
    stage: LiveCardGenerationStage,
    code: LiveCardGenerationCode,
    issues: unknown = [],
    retryable = true,
  ) {
    super(message);
    this.name = "LiveCardGenerationFailure";
    this.stage = stage;
    this.code = code;
    this.retryable = retryable;
    this.issues = normalizeLiveCardIssues(issues);
  }
}

export function readLiveCardGenerationFailure(
  response: Record<string, unknown>, stage: LiveCardGenerationStage, fallback: string,
): LiveCardGenerationFailure {
  const codes = ["quality_rejected", "verification_unavailable", "generation_failed", "invalid_artwork"];
  return new LiveCardGenerationFailure(
    typeof response.error === "string" ? response.error : fallback,
    stage,
    codes.includes(String(response.code)) ? response.code as LiveCardGenerationCode : "generation_failed",
    response.issues,
    response.retryable !== false,
  );
}

/** Additive metadata: older callers still receive the existing error string. */
export function liveCardGenerationErrorResponse(error: unknown, stage: LiveCardGenerationStage) {
  return {
    error: error instanceof Error ? error.message : "The artwork could not be prepared. Please retry.",
    stage,
    code: error instanceof LiveCardGenerationFailure ? error.code : "generation_failed",
    retryable: error instanceof LiveCardGenerationFailure ? error.retryable : true,
    issues: error instanceof LiveCardGenerationFailure ? error.issues : [],
  };
}

/** Deliberately excludes artwork, event copy, provider messages and repair instructions. */
export function recordLiveCardGeneration(input: {
  stage: LiveCardGenerationStage;
  startedAt: number;
  attempt: number;
  outcome: LiveCardGenerationCode | "success" | "cancelled";
  issues?: unknown;
}) {
  console.info("livecard_generation", {
    stage: input.stage,
    durationMs: Math.max(0, Date.now() - input.startedAt),
    attempt: input.attempt,
    outcome: input.outcome,
    issues: normalizeLiveCardIssues(input.issues),
  });
}

import { randomUUID } from "node:crypto";
import { safeString } from "./strings.ts";
import type {
  DiscoveryFailureStage,
  DiscoveryPipelineState,
  DiscoveryStage,
  GymBuilderDraft,
  GymPublicArtifacts,
} from "./types.ts";

export const DISCOVERY_REVIEW_READY_STAGES = new Set<DiscoveryStage>(["review_ready", "published"]);

export { safeString } from "./strings.ts";

export function getDiscoveryLeaseMs(): number {
  const parsed = Number.parseInt(process.env.DISCOVERY_V2_LEASE_MS || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5 * 60 * 1000;
}

export function createLeaseOwnerId(): string {
  return `discovery-v2-${randomUUID()}`;
}

export function createDiscoveryPipelineState(
  overrides: Partial<DiscoveryPipelineState> = {},
): DiscoveryPipelineState {
  return {
    processingStage: "ingested",
    lastSuccessfulStage: null,
    needsHumanReview: false,
    publishReady: false,
    reviewFlags: [],
    errorCode: null,
    errorMessage: null,
    attempts: {},
    timingsMs: {},
    lease: null,
    ...overrides,
  };
}

export function startDiscoveryStage(
  pipeline: DiscoveryPipelineState,
  stage: DiscoveryStage,
): DiscoveryPipelineState {
  const attempts = {
    ...(pipeline.attempts || {}),
    [stage]: Number(pipeline.attempts?.[stage] || 0) + 1,
  };
  return {
    ...pipeline,
    processingStage: stage,
    attempts,
    errorCode: null,
    errorMessage: null,
  };
}

export function completeDiscoveryStage(
  pipeline: DiscoveryPipelineState,
  stage: DiscoveryStage,
  durationMs: number,
): DiscoveryPipelineState {
  return {
    ...pipeline,
    processingStage: stage,
    lastSuccessfulStage: stage,
    timingsMs: {
      ...(pipeline.timingsMs || {}),
      [stage]: durationMs,
    },
    errorCode: null,
    errorMessage: null,
  };
}

export function failDiscoveryStage(
  pipeline: DiscoveryPipelineState,
  stage: DiscoveryFailureStage,
  errorCode: string,
  errorMessage: string,
): DiscoveryPipelineState {
  return {
    ...pipeline,
    processingStage: stage,
    errorCode: errorCode || stage,
    errorMessage,
    lease: null,
  };
}

export function uniqueStrings(values: unknown[], limit = 24): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const next = safeString(value);
    if (!next) continue;
    const key = next.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
    if (out.length >= limit) break;
  }
  return out;
}

export function buildEmptyGymBuilderDraft(): GymBuilderDraft {
  return {
    event: {},
    venue: {},
    advancedSections: {},
    canonicalLinks: {},
    reviewFlags: [],
  };
}

export function buildEmptyGymPublicArtifacts(title = ""): GymPublicArtifacts {
  return {
    pipelineVersion: "gym-public-v3",
    publishAssessment: {
      state: "needs_review",
      reasons: ["Discovery is still processing."],
    },
    hero: {
      title,
      dateLabel: "",
      venue: "",
      badges: [],
    },
    sections: {},
    quickAccess: [],
  };
}

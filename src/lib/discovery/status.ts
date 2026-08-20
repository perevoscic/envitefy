import {
  getDiscoveryFailureSummary,
  isDiscoveryFailedState,
  toDiscoveryStatusErrorDetails,
} from "./failure-summary.ts";
import { DISCOVERY_REVIEW_READY_STAGES, safeString, uniqueStrings } from "./shared.ts";
import type { DiscoveryStatusResponse, EventDiscoveryRow } from "./types.ts";

type DiscoveryStatusSource = Pick<
  EventDiscoveryRow,
  "id" | "eventId" | "pipeline" | "debug" | "canonicalParse"
>;

const DISCOVERY_DRAFT_READY_STAGES = new Set([
  "enrich",
  "compose_public",
  "review_ready",
  "published",
]);

export function isDiscoveryDraftReady(discovery: DiscoveryStatusSource): boolean {
  const processingStage = safeString(discovery.pipeline.processingStage);
  const lastSuccessfulStage = safeString(discovery.pipeline.lastSuccessfulStage);
  return (
    DISCOVERY_DRAFT_READY_STAGES.has(processingStage) ||
    DISCOVERY_DRAFT_READY_STAGES.has(lastSuccessfulStage)
  );
}

export function buildDiscoveryStatusResponse(
  discovery: DiscoveryStatusSource,
): DiscoveryStatusResponse {
  const reviewFlags = uniqueStrings(discovery.pipeline.reviewFlags || [], 24);
  const processingStage = discovery.pipeline.processingStage;
  const failureSummary = getDiscoveryFailureSummary(discovery.debug?.failureSummary);
  const failedState = isDiscoveryFailedState(processingStage);
  return {
    eventId: discovery.eventId,
    discoveryId: discovery.id,
    processingStage,
    lastSuccessfulStage: discovery.pipeline.lastSuccessfulStage || null,
    needsHumanReview: Boolean(discovery.pipeline.needsHumanReview),
    draftReady: isDiscoveryDraftReady(discovery),
    builderReady: DISCOVERY_REVIEW_READY_STAGES.has(processingStage as any),
    errorCode: safeString(discovery.pipeline.errorCode) || null,
    errorStage: failedState ? failureSummary?.stage || safeString(processingStage) || null : null,
    errorMessage: failedState
      ? failureSummary?.errorMessage || safeString(discovery.pipeline.errorMessage) || null
      : null,
    errorDetails: failedState ? toDiscoveryStatusErrorDetails(failureSummary) : null,
    reviewFlags,
    activityProfile: discovery.canonicalParse?.activityProfile || null,
    eventArchetype: discovery.canonicalParse?.eventArchetype || null,
    detectionConfidence: discovery.canonicalParse?.detection?.confidence ?? null,
    needsSportConfirmation: Boolean(discovery.canonicalParse?.detection?.needsConfirmation),
  };
}

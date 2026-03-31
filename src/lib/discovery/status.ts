import {
  getDiscoveryFailureSummary,
  isDiscoveryFailedState,
  toDiscoveryStatusErrorDetails,
} from "./failure-summary.ts";
import { DISCOVERY_REVIEW_READY_STAGES, safeString, uniqueStrings } from "./shared.ts";
import type { DiscoveryStatusResponse, EventDiscoveryRow } from "./types.ts";

export function buildDiscoveryStatusResponse(
  discovery: EventDiscoveryRow,
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
    builderReady: DISCOVERY_REVIEW_READY_STAGES.has(processingStage as any),
    errorCode: safeString(discovery.pipeline.errorCode) || null,
    errorStage: failedState ? failureSummary?.stage || safeString(processingStage) || null : null,
    errorMessage:
      failedState
        ? failureSummary?.errorMessage || safeString(discovery.pipeline.errorMessage) || null
        : null,
    errorDetails: failedState ? toDiscoveryStatusErrorDetails(failureSummary) : null,
    reviewFlags,
  };
}

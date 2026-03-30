import { DISCOVERY_REVIEW_READY_STAGES, safeString, uniqueStrings } from "@/lib/discovery/shared";
import type { EventDiscoveryRow } from "@/lib/discovery/types";

export function buildDiscoveryStatusResponse(discovery: EventDiscoveryRow) {
  const reviewFlags = uniqueStrings(discovery.pipeline.reviewFlags || [], 24);
  const processingStage = discovery.pipeline.processingStage;
  return {
    eventId: discovery.eventId,
    discoveryId: discovery.id,
    processingStage,
    lastSuccessfulStage: discovery.pipeline.lastSuccessfulStage || null,
    needsHumanReview: Boolean(discovery.pipeline.needsHumanReview),
    builderReady: DISCOVERY_REVIEW_READY_STAGES.has(processingStage as any),
    errorCode: safeString(discovery.pipeline.errorCode) || null,
    reviewFlags,
  };
}

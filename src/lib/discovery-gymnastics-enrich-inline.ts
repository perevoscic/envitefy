import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "@/components/gym-meet-templates/registry";
import {
  buildGymDiscoveryPublicPageArtifacts,
  createDiscoveryPerformance,
  type DiscoveryEnrichmentStatus,
  type DiscoveryPerformance,
  type DiscoverySourceInput,
  extractDiscoveryText,
  finalizeMeetParseResult,
  isDiscoveryDebugArtifactsEnabled,
  mapParseResultToGymData,
  resolveDiscoveryBudget,
  stripGymScheduleGridsFromParseResult,
} from "@/lib/meet-discovery";
import { enrichTravelAccommodation } from "@/lib/travel-accommodation-enrichment";

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeExtractionMetaForPersistence(meta: any, debugArtifacts: boolean) {
  if (!meta || typeof meta !== "object") return meta;
  const next = { ...meta } as Record<string, any>;
  if (!debugArtifacts) {
    delete next.schedulePageImages;
  }
  return next;
}

function buildPersistedPerformance(
  performance: Partial<DiscoveryPerformance> | Record<string, any> | null | undefined,
): DiscoveryPerformance {
  const next = performance && typeof performance === "object" ? performance : {};
  return {
    ...createDiscoveryPerformance(),
    ...next,
    persistMs: 0,
  };
}

/**
 * Runs gymnastics enrichment extraction + parse finalize using in-memory core parse result (no second HTTP round-trip).
 */
export async function runInlineGymnasticsEnrichmentPhase(params: {
  eventId: string;
  hydratedSourceInput: DiscoverySourceInput;
  mergedCoreEventData: Record<string, any>;
  sourceInput: DiscoverySourceInput;
  performance: DiscoveryPerformance;
}): Promise<{ nextData: Record<string, any> }> {
  const discoverySource = (params.mergedCoreEventData.discoverySource || {}) as Record<string, any>;
  const baseParseResult = discoverySource.parseResult;
  const baseExtractedText = safeString(discoverySource.extractedText);
  if (!baseParseResult || !baseExtractedText) {
    throw new Error("Core parse must complete before inline enrichment");
  }

  const debugArtifacts = isDiscoveryDebugArtifactsEnabled();
  const enrichBudgetMs = resolveDiscoveryBudget("enrich", params.hydratedSourceInput.type);

  const extraction = await extractDiscoveryText(params.hydratedSourceInput, {
    workflow: "gymnastics",
    mode: "enrich",
    budgetMs: enrichBudgetMs,
    debugArtifacts,
    performance: params.performance,
  });

  const travelAccommodation = await enrichTravelAccommodation({
    traceId: params.eventId,
    extractionMeta: extraction.extractionMeta,
    existing: (discoverySource as any)?.travelAccommodation || null,
    budgetMs: enrichBudgetMs,
  });
  const discoverySourceWithTravel = travelAccommodation
    ? { ...discoverySource, travelAccommodation }
    : discoverySource;
  const baseDataWithTravel = travelAccommodation
    ? { ...params.mergedCoreEventData, discoverySource: discoverySourceWithTravel }
    : params.mergedCoreEventData;

  const enrichedParseResult = await finalizeMeetParseResult(
    baseParseResult,
    extraction.extractedText || baseExtractedText,
    extraction.extractionMeta,
    {
      traceId: params.eventId,
      mode: "enrich",
      performance: params.performance,
    },
  );

  const mapped = await mapParseResultToGymData(
    enrichedParseResult,
    baseDataWithTravel,
    extraction.extractionMeta,
  );
  const publicArtifacts = buildGymDiscoveryPublicPageArtifacts({
    parseResult: enrichedParseResult,
    baseData: baseDataWithTravel,
    extractionMeta: extraction.extractionMeta,
  });
  const nextGymPageTemplateId =
    resolveGymMeetTemplateId({ ...params.mergedCoreEventData, ...mapped }) ||
    DEFAULT_GYM_MEET_TEMPLATE_ID;

  const detectedGymLayoutImage = extraction.extractionMeta?.gymLayoutImageDataUrl || null;
  if (detectedGymLayoutImage && !mapped?.advancedSections?.logistics?.gymLayoutImage) {
    mapped.advancedSections = mapped.advancedSections || {};
    mapped.advancedSections.logistics = mapped.advancedSections.logistics || {};
    mapped.advancedSections.logistics.gymLayoutImage = detectedGymLayoutImage;
    mapped.customFields = mapped.customFields || {};
    mapped.customFields.advancedSections = mapped.advancedSections;
  }

  const finishedAt = new Date().toISOString();
  const enrichmentState: DiscoveryEnrichmentStatus = {
    state: "completed",
    pending: false,
    startedAt:
      safeString(discoverySource?.enrichment?.startedAt) ||
      safeString(discoverySource?.coreUpdatedAt) ||
      finishedAt,
    finishedAt,
    lastError: null,
    performance: buildPersistedPerformance(params.performance),
  };

  const nextData = {
    ...mapped,
    pageTemplateId: nextGymPageTemplateId,
    discoverySource: {
      ...discoverySourceWithTravel,
      status: "parsed",
      workflow: "gymnastics",
      input: params.sourceInput,
      extractedText: extraction.extractedText || baseExtractedText,
      extractionMeta: sanitizeExtractionMetaForPersistence(
        extraction.extractionMeta,
        debugArtifacts,
      ),
      ...(publicArtifacts
        ? {
            pipelineVersion: publicArtifacts.pipelineVersion,
            publicPageSections: publicArtifacts.publicPageSections,
            publishAssessment: publicArtifacts.publishAssessment,
          }
        : {}),
      parseResult: stripGymScheduleGridsFromParseResult(
        publicArtifacts?.parseResult || enrichedParseResult
      ),
      enrichment: enrichmentState,
      enrichedAt: finishedAt,
      updatedAt: finishedAt,
    },
  };

  return { nextData };
}

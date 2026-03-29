import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "@/components/gym-meet-templates/registry";
import {
  createDiscoveryPerformance,
  type DiscoveryEnrichmentStatus,
  type DiscoveryPerformance,
  type DiscoverySourceInput,
  extractDiscoveryText,
  finalizeMeetParseResult,
  isDiscoveryDebugArtifactsEnabled,
  mapParseResultToGymData,
  resolveDiscoveryBudget,
} from "@/lib/meet-discovery";

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
  const enrichBudgetMs = resolveDiscoveryBudget("enrich");

  const extraction = await extractDiscoveryText(params.hydratedSourceInput, {
    workflow: "gymnastics",
    mode: "enrich",
    budgetMs: enrichBudgetMs,
    debugArtifacts,
    performance: params.performance,
  });

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
    params.mergedCoreEventData,
    extraction.extractionMeta,
  );
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
      ...discoverySource,
      status: "parsed",
      workflow: "gymnastics",
      input: params.sourceInput,
      extractedText: extraction.extractedText || baseExtractedText,
      extractionMeta: sanitizeExtractionMetaForPersistence(
        extraction.extractionMeta,
        debugArtifacts,
      ),
      parseResult: enrichedParseResult,
      enrichment: enrichmentState,
      enrichedAt: finishedAt,
      updatedAt: finishedAt,
    },
  };

  return { nextData };
}

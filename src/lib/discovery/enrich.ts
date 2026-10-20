import { throwIfDiscoveryCancelled } from "@/lib/discovery/cancel";
import { getEventHistoryById } from "@/lib/db";
import { enrichDiscoveryFileDocument, runDiscoveryExtractStageWithMode } from "@/lib/discovery/extract";
import { safeString } from "@/lib/discovery/shared";
import type { EventDiscoveryRow } from "@/lib/discovery/types";
import {
  createDiscoveryPerformance,
  finalizeMeetParseResult,
  isDiscoveryDebugArtifactsEnabled,
  resolveDiscoveryBudget,
} from "@/lib/meet-discovery";
import {
  buildTravelAccommodationState,
  enrichTravelAccommodation,
} from "@/lib/travel-accommodation-enrichment";

export const discoveryEnrichmentDeps = {
  enrichDiscoveryFileDocument,
  runDiscoveryExtractStageWithMode,
  finalizeMeetParseResult,
  enrichTravelAccommodation,
  getEventHistoryById,
};

export async function runDiscoveryEnrichStage(
  discovery: EventDiscoveryRow,
  options?: { signal?: AbortSignal },
) {
  throwIfDiscoveryCancelled(options?.signal);
  if (discovery.workflow !== "gymnastics") {
    return {
      document: discovery.document,
      enrichment: {
        parseResult: discovery.debug?.coreParseResult || null,
        travelAccommodation: null,
        finalizedAt: new Date().toISOString(),
        performance: createDiscoveryPerformance(),
      },
      debug: {
        ...((discovery.debug || {}) as Record<string, unknown>),
      },
    };
  }
  const existingDocument = discovery.document;
  const baseParseResult = discovery.debug && (discovery.debug as any).coreParseResult;
  if (!existingDocument || !baseParseResult) {
    throw new Error("Core extract and parse must complete before enrich.");
  }

  const performance = createDiscoveryPerformance();
  const enrichBudgetMs = resolveDiscoveryBudget("enrich", discovery.source.type);
  const refreshedDocument = discovery.source.type === "file"
    ? await discoveryEnrichmentDeps.enrichDiscoveryFileDocument(discovery, { signal: options?.signal })
    : (await discoveryEnrichmentDeps.runDiscoveryExtractStageWithMode(
        { ...discovery, document: existingDocument },
        "enrich",
        { signal: options?.signal },
      )).document;
  throwIfDiscoveryCancelled(options?.signal);
  const extractedText =
    safeString(refreshedDocument.extractionMeta.extractedText) ||
    safeString((existingDocument.extractionMeta as any)?.extractedText);
  const enrichedParseResult = await discoveryEnrichmentDeps.finalizeMeetParseResult(
    baseParseResult,
    extractedText,
    refreshedDocument.extractionMeta as any,
    {
      traceId: discovery.eventId,
      mode: "enrich",
      performance,
      debugArtifacts: isDiscoveryDebugArtifactsEnabled(),
      budgetMs: enrichBudgetMs,
    } as any,
  );
  throwIfDiscoveryCancelled(options?.signal);

  const travelAccommodation = await discoveryEnrichmentDeps.enrichTravelAccommodation({
    sourceType: discovery.source.type,
    sourceUrl: discovery.source.url,
    sourceId: discovery.id,
    eventYear: safeString(enrichedParseResult.startAt).slice(0, 4) || null,
    signal: options?.signal,
    budgetMs: Math.min(25000, enrichBudgetMs),
    extractedText,
    extractionMeta: refreshedDocument.extractionMeta as any,
  });
  throwIfDiscoveryCancelled(options?.signal);

  const previousEvent = await discoveryEnrichmentDeps.getEventHistoryById(discovery.eventId);

  return {
    document: refreshedDocument,
    enrichment: {
      parseResult: enrichedParseResult,
      travelAccommodation: buildTravelAccommodationState(travelAccommodation, previousEvent?.data?.discoverySource?.travelAccommodation),
      finalizedAt: new Date().toISOString(),
      performance,
    },
    debug: {
      ...((discovery.debug || {}) as Record<string, unknown>),
      enrichPerformance: performance,
    },
  };
}

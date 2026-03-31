import { runDiscoveryExtractStageWithMode } from "@/lib/discovery/extract";
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

export async function runDiscoveryEnrichStage(discovery: EventDiscoveryRow) {
  if (discovery.workflow === "football") {
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
  const refreshedExtraction = await runDiscoveryExtractStageWithMode(
    {
      ...discovery,
      document: existingDocument,
    },
    "enrich",
  );
  const extractedText =
    safeString((refreshedExtraction.document.extractionMeta as any)?.extractedText) ||
    safeString((existingDocument.extractionMeta as any)?.extractedText);
  const enrichedParseResult = await finalizeMeetParseResult(
    baseParseResult,
    extractedText,
    refreshedExtraction.document.extractionMeta as any,
    {
      traceId: discovery.eventId,
      mode: "enrich",
      performance,
      debugArtifacts: isDiscoveryDebugArtifactsEnabled(),
      budgetMs: enrichBudgetMs,
    } as any,
  );

  const travelAccommodation = await enrichTravelAccommodation({
    sourceType: discovery.source.type,
    extractedText,
    extractionMeta: refreshedExtraction.document.extractionMeta as any,
  });

  return {
    document: refreshedExtraction.document,
    enrichment: {
      parseResult: enrichedParseResult,
      travelAccommodation: buildTravelAccommodationState(travelAccommodation),
      finalizedAt: new Date().toISOString(),
      performance,
    },
    debug: {
      ...((discovery.debug || {}) as Record<string, unknown>),
      enrichPerformance: performance,
    },
  };
}

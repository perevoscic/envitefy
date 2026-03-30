import { runDiscoveryExtractStageWithMode } from "@/lib/discovery/extract";
import { safeString } from "@/lib/discovery/shared";
import type { EventDiscoveryRow } from "@/lib/discovery/types";
import {
  createDiscoveryPerformance,
  finalizeMeetParseResult,
  isDiscoveryDebugArtifactsEnabled,
  resolveDiscoveryBudget,
} from "@/lib/meet-discovery";

export async function runDiscoveryEnrichStage(discovery: EventDiscoveryRow) {
  const existingDocument = discovery.document;
  const baseParseResult = discovery.debug && (discovery.debug as any).coreParseResult;
  if (!existingDocument || !baseParseResult) {
    throw new Error("Core extract and parse must complete before enrich.");
  }

  const performance = createDiscoveryPerformance();
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
      budgetMs: resolveDiscoveryBudget("enrich", discovery.source.type),
    } as any,
  );

  return {
    document: refreshedExtraction.document,
    enrichment: {
      parseResult: enrichedParseResult,
      finalizedAt: new Date().toISOString(),
      performance,
    },
    debug: {
      ...((discovery.debug || {}) as Record<string, unknown>),
      enrichPerformance: performance,
    },
  };
}

import { attachDiscoveryFailureMetadata } from "@/lib/discovery/failure-summary";
import { safeString } from "@/lib/discovery/shared";
import type {
  DiscoveryDocument,
  DiscoveryResource,
  EventDiscoveryRow,
} from "@/lib/discovery/types";
import { hydrateDiscoveryFileInput } from "@/lib/discovery-file-hydration";
import {
  createDiscoveryPerformance,
  type DiscoverySourceInput,
  extractDiscoveryText,
  isDiscoveryDebugArtifactsEnabled,
  resolveDiscoveryBudget,
} from "@/lib/meet-discovery";

function sourceTypeFromInput(input: DiscoverySourceInput): "pdf" | "image" | "url" {
  if (input.type === "url") return "url";
  return /pdf/i.test(input.mimeType || "") ? "pdf" : "image";
}

export async function runDiscoveryExtractStage(discovery: EventDiscoveryRow) {
  return runDiscoveryExtractStageWithMode(discovery, "core");
}

export async function runDiscoveryExtractStageWithMode(
  discovery: EventDiscoveryRow,
  mode: "core" | "enrich",
) {
  let sourceInput = discovery.source as DiscoverySourceInput;
  if (sourceInput.type === "file" && !safeString(sourceInput.dataUrl)) {
    const hydrated = await hydrateDiscoveryFileInput(discovery.eventId, sourceInput, null);
    if (!hydrated.ok) {
      throw new Error(hydrated.error);
    }
    sourceInput = hydrated.hydrated;
  }

  const performance = createDiscoveryPerformance();
  const extraction = await extractDiscoveryText(sourceInput, {
    workflow: discovery.workflow,
    mode,
    budgetMs: resolveDiscoveryBudget(mode, sourceInput.type),
    debugArtifacts: isDiscoveryDebugArtifactsEnabled(),
    performance,
  });

  const rawPages = Array.isArray((extraction.extractionMeta as any)?.pages)
    ? ((extraction.extractionMeta as any).pages as Array<Record<string, any>>)
    : [];
  const resourceLinks = Array.isArray((extraction.extractionMeta as any)?.resourceLinks)
    ? ((extraction.extractionMeta as any).resourceLinks as Array<Record<string, any>>)
    : [];
  const discoveredLinks = Array.isArray((extraction.extractionMeta as any)?.discoveredLinks)
    ? ((extraction.extractionMeta as any).discoveredLinks as Array<Record<string, any>>)
    : [];

  if (!safeString(extraction.extractedText) || safeString(extraction.extractedText).length < 20) {
    throw attachDiscoveryFailureMetadata(new Error("Not enough text extracted to parse"), {
      code: "not_enough_text",
      extractionSnapshot: {
        extractedChars: safeString(extraction.extractedText).length,
        pageCount: rawPages.length || null,
        usedOcr:
          typeof (extraction.extractionMeta as any)?.usedOcr === "boolean"
            ? Boolean((extraction.extractionMeta as any).usedOcr)
            : null,
        textQuality: safeString((extraction.extractionMeta as any)?.textQuality) || null,
      },
      runtimeHints: {
        ocrAttempted: (performance.ocrPageCount || 0) > 0,
      },
    });
  }

  const resources: DiscoveryResource[] = resourceLinks
    .map((item) => ({
      kind: safeString(item.kind) || "other",
      label: safeString(item.label) || "Resource",
      url: safeString(item.url),
      sourceUrl: safeString(item.sourceUrl) || null,
      status: safeString(item.status) || null,
      audience: safeString(item.audience) || null,
      renderTarget: safeString(item.renderTarget) || null,
    }))
    .filter((item) => item.url);

  const document: DiscoveryDocument = {
    sourceType: sourceTypeFromInput(sourceInput),
    documentTypeHints: [],
    pageCount: rawPages.length || 1,
    hasEmbeddedText: !(extraction.extractionMeta as any)?.usedOcr,
    ocrUsed: Boolean((extraction.extractionMeta as any)?.usedOcr),
    pages:
      rawPages.length > 0
        ? rawPages.map((page, index) => ({
            pageNumber: Number(page.pageNumber || index + 1),
            text: safeString(page.text),
          }))
        : [{ pageNumber: 1, text: safeString(extraction.extractedText) }],
    textBlocks: [
      {
        id: "block-1",
        pageNumber: 1,
        text: safeString(extraction.extractedText),
        role: "full_text",
      },
    ],
    tables: [],
    links: discoveredLinks
      .map((item) => ({
        label: safeString(item.label || item.title || "Link"),
        url: safeString(item.url),
        sourceUrl: safeString(item.sourceUrl) || null,
      }))
      .filter((item) => item.url),
    resources,
    evidence: [],
    extractionMeta: {
      ...(extraction.extractionMeta || {}),
      extractedText: extraction.extractedText,
      performance,
    },
  };

  return {
    document,
    sourceInput,
    debug: {
      extractionMeta: extraction.extractionMeta || null,
      extractionPerformance: performance,
    },
  };
}

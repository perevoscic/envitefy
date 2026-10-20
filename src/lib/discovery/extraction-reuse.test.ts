import { afterEach, expect, test } from "bun:test";
import { discoveryExtractionDeps, enrichDiscoveryFileDocument, runDiscoveryExtractStage } from "./extract";
import { discoveryEnrichmentDeps, runDiscoveryEnrichStage } from "./enrich";
import { createDiscoveryPipelineState } from "./shared";
import { buildTravelAccommodationResult } from "../travel-accommodation-discovery";
import type { DiscoveryDocument, EventDiscoveryRow } from "./types";

const extractionDeps = { ...discoveryExtractionDeps };
const enrichmentDeps = { ...discoveryEnrichmentDeps };
afterEach(() => {
  Object.assign(discoveryExtractionDeps, extractionDeps);
  Object.assign(discoveryEnrichmentDeps, enrichmentDeps);
});

function fixture(sourceType: "file" | "url" = "file"): EventDiscoveryRow {
  const text = "Championship meet October 25, 2026. Session 1 starts at 9 AM; Session 2 starts at noon.";
  const document: DiscoveryDocument = {
    sourceType: sourceType === "file" ? "image" : "url",
    documentTypeHints: [], pageCount: 1, hasEmbeddedText: false, ocrUsed: true,
    pages: [{ pageNumber: 1, text }],
    textBlocks: [{ id: "block-1", pageNumber: 1, text }],
    tables: [{ id: "sessions", pageNumber: 1, rows: [["Session 1", "9 AM"], ["Session 2", "noon"]] }],
    links: [], resources: [], evidence: [],
    extractionMeta: { extractedText: text, usedOcr: true, sourceReadVersion: 1, reusedCreateSource: true },
  };
  return {
    id: "discovery-1", eventId: "event-1", workflow: "gymnastics",
    source: { type: sourceType, mimeType: "image/jpeg", url: sourceType === "url" ? "https://meet.example/event" : undefined, createdAt: "2026-10-19", updatedAt: "2026-10-19" },
    document, canonicalParse: null, enrichment: null, pipeline: createDiscoveryPipelineState(),
    debug: { coreParseResult: { title: "Championship meet", startAt: "2026-10-25T09:00:00-05:00", sessions: [{ name: "Session 1" }, { name: "Session 2" }] } },
    createdAt: "2026-10-19", updatedAt: "2026-10-19",
  };
}

function prohibitFileRead() {
  discoveryExtractionDeps.hydrateDiscoveryFileInput = async () => { throw new Error("Unexpected file download"); };
  discoveryExtractionDeps.extractDiscoveryText = async () => { throw new Error("Unexpected repeated OCR"); };
}

test("verified Create source reads enter sports parsing without another file download or OCR", async () => {
  prohibitFileRead();
  const event = fixture();
  event.source.text = "Session 2 now starts at 1 PM.";
  const first = await runDiscoveryExtractStage(event);
  expect(first.document.pages).toEqual(event.document!.pages);
  expect(first.document.tables).toEqual(event.document!.tables);
  expect(first.document.extractionMeta.extractedText).toContain("Session 2 now starts at 1 PM.");
  const retry = await runDiscoveryExtractStage({ ...event, document: first.document });
  expect(String(retry.document.extractionMeta.extractedText).match(/Session 2 now starts at 1 PM\./g)).toHaveLength(1);
});

test("unmarked documents cannot bypass the normal specialty source reader", async () => {
  const event = fixture();
  delete event.document!.extractionMeta.reusedCreateSource;
  event.source.dataUrl = "data:image/jpeg;base64,AA==";
  let reads = 0;
  discoveryExtractionDeps.extractDiscoveryText = (async () => {
    reads++;
    return { extractedText: "Re-read real source with complete schedule", extractionMeta: { sourceType: "file", usedOcr: true } };
  }) as typeof discoveryExtractionDeps.extractDiscoveryText;
  const result = await runDiscoveryExtractStage(event);
  expect(reads).toBe(1);
  expect(result.document.extractionMeta.extractedText).toBe("Re-read real source with complete schedule");
});

test("ordinary file enrichment retains every schedule and metadata field without reading bytes again", async () => {
  prohibitFileRead();
  const event = fixture();
  expect(await enrichDiscoveryFileDocument(event)).toBe(event.document!);
});

test("PDF layout enrichment receives existing page text and retains document evidence", async () => {
  const event = fixture();
  event.source.mimeType = "application/pdf";
  event.source.dataUrl = "data:application/pdf;base64,AA==";
  event.document!.sourceType = "pdf";
  event.document!.extractionMeta.accommodationPageTexts = event.document!.pages;
  prohibitFileRead();
  let layouts = 0;
  discoveryExtractionDeps.enrichDiscoveryFileLayout = async (_input, text, meta, options) => {
    layouts++;
    expect(text).toContain("Session 2");
    expect(options?.pageTexts).toEqual(event.document!.pages);
    return { ...meta, gymLayoutImageDataUrl: "data:image/jpeg;base64,bWFw", gymLayoutPage: 1 };
  };
  const document = await enrichDiscoveryFileDocument(event);
  expect(layouts).toBe(1);
  expect(document.pages).toBe(event.document!.pages);
  expect(document.tables).toBe(event.document!.tables);
  expect(document.extractionMeta.gymLayoutPage).toBe(1);
  expect(await enrichDiscoveryFileDocument({ ...event, document })).toBe(document);
  expect(layouts).toBe(1);
});

function stubEnrichment() {
  discoveryEnrichmentDeps.finalizeMeetParseResult = async (value) => value;
  discoveryEnrichmentDeps.enrichTravelAccommodation = async () => buildTravelAccommodationResult({ candidates: [], pdfHotels: [], webHotels: [] });
  discoveryEnrichmentDeps.getEventHistoryById = async () => null;
}

test("gymnastics file enrichment uses its completed document while preserving the parsed schedule", async () => {
  stubEnrichment();
  const event = fixture();
  let reused = 0;
  discoveryEnrichmentDeps.enrichDiscoveryFileDocument = async (value) => { reused++; return value.document!; };
  discoveryEnrichmentDeps.runDiscoveryExtractStageWithMode = async () => { throw new Error("Unexpected repeated extraction"); };
  const result = await runDiscoveryEnrichStage(event);
  expect(reused).toBe(1);
  expect(result.document).toBe(event.document!);
  expect(result.enrichment.parseResult?.sessions).toHaveLength(2);
});

test("URL enrichment still performs the deeper specialty crawl", async () => {
  stubEnrichment();
  const event = fixture("url");
  let crawls = 0;
  discoveryEnrichmentDeps.enrichDiscoveryFileDocument = async () => { throw new Error("URL treated as file"); };
  discoveryEnrichmentDeps.runDiscoveryExtractStageWithMode = (async (_event, mode) => {
    expect(mode).toBe("enrich");
    crawls++;
    return { document: { ...event.document!, extractionMeta: { extractedText: "Meet and linked hotel information discovered by the deeper crawl" } } };
  }) as typeof discoveryEnrichmentDeps.runDiscoveryExtractStageWithMode;
  const result = await runDiscoveryEnrichStage(event);
  expect(crawls).toBe(1);
  expect(result.document?.extractionMeta.extractedText).toContain("linked hotel");
});

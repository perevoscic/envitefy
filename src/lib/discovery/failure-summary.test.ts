import assert from "node:assert/strict";
import test from "node:test";

import { buildDiscoveryFailureSummary, attachDiscoveryFailureMetadata } from "./failure-summary.ts";
import { createDiscoveryPipelineState } from "./shared.ts";
import type { EventDiscoveryRow } from "./types.ts";

function buildDiscoveryRow(overrides: Partial<EventDiscoveryRow> = {}): EventDiscoveryRow {
  return {
    id: "disc_123",
    eventId: "evt_123",
    workflow: "gymnastics",
    source: {
      type: "file",
      fileName: "march-meet.pdf",
      mimeType: "application/pdf",
      sizeBytes: 4096,
      blobStored: true,
      originalName: "march-meet.pdf",
      originalMimeType: "application/pdf",
      originalSizeBytes: 4096,
      optimizedByQpdf: false,
      dataUrl: null,
      createdAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z",
    },
    document: null,
    canonicalParse: null,
    enrichment: null,
    pipeline: createDiscoveryPipelineState({ processingStage: "extract" }),
    debug: {
      extractionPerformance: {
        pdfParseMs: 22,
        ocrMs: 35,
        ocrPageCount: 1,
        gymLayoutScanMs: 0,
        gymLayoutAiCalls: 0,
        scheduleTextParseMs: 0,
        scheduleVisionCalls: 0,
        modelParseMs: 0,
        persistMs: 0,
      },
    },
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
    ...overrides,
  };
}

test("buildDiscoveryFailureSummary preserves useful extraction context", () => {
  const row = buildDiscoveryRow();
  const error = attachDiscoveryFailureMetadata(new Error("Not enough text extracted to parse"), {
    code: "not_enough_text",
    extractionSnapshot: {
      extractedChars: 18,
      pageCount: 2,
      usedOcr: true,
      textQuality: "poor",
    },
    runtimeHints: {
      ocrAttempted: true,
    },
  });

  const summary = buildDiscoveryFailureSummary({
    discovery: row,
    error,
    failedStage: "extract",
    fallbackCode: "failed_extract",
    timestamp: "2026-03-30T12:00:00.000Z",
  });

  assert.equal(summary.stage, "extract");
  assert.equal(summary.normalizedErrorCode, "not_enough_text");
  assert.equal(summary.source.type, "pdf");
  assert.equal(summary.source.optimizedByQpdf, false);
  assert.deepEqual(summary.extraction, {
    extractedChars: 18,
    pageCount: 2,
    usedOcr: true,
    textQuality: "poor",
  });
  assert.deepEqual(summary.runtimeHints, {
    qpdfAvailable: false,
    ocrAttempted: true,
    pdfTextEngine: "pdfjs-dist",
    pdfWorkerDisabled: true,
  });
  assert.equal(summary.timestamp, "2026-03-30T12:00:00.000Z");
});

test("buildDiscoveryFailureSummary redacts sensitive and internal values", () => {
  const row = buildDiscoveryRow();
  const summary = buildDiscoveryFailureSummary({
    discovery: row,
    error: new Error(
      "Cannot load /Users/rj/Local_Dev/envitefy/.next/server/pdf.worker.mjs data:application/pdf;base64,abc\n    at stack line",
    ),
    failedStage: "extract",
    fallbackCode: "failed_extract",
  });

  assert.match(summary.errorMessage, /\[redacted-path\]/);
  assert.doesNotMatch(summary.errorMessage, /\/Users\/rj\/Local_Dev/);
  assert.doesNotMatch(summary.errorMessage, /data:application\/pdf/);
});

test("buildDiscoveryFailureSummary treats qpdf availability as a hint, not the primary error", () => {
  const row = buildDiscoveryRow();
  const summary = buildDiscoveryFailureSummary({
    discovery: row,
    error: new Error("Not enough text extracted to parse after qpdf ENOENT warning"),
    failedStage: "extract",
    fallbackCode: "failed_extract",
  });

  assert.equal(summary.normalizedErrorCode, "not_enough_text");
  assert.equal(summary.runtimeHints.qpdfAvailable, false);
});

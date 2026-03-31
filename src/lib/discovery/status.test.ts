import assert from "node:assert/strict";
import test from "node:test";

import { createDiscoveryPipelineState } from "./shared.ts";
import { buildDiscoveryStatusResponse } from "./status.ts";
import type { EventDiscoveryRow } from "./types.ts";

function buildDiscoveryRow(overrides: Partial<EventDiscoveryRow> = {}): EventDiscoveryRow {
  return {
    id: "disc_status_1",
    eventId: "evt_status_1",
    workflow: "gymnastics",
    source: {
      type: "file",
      fileName: "meet.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1234,
      blobStored: true,
      originalName: "meet.pdf",
      originalMimeType: "application/pdf",
      originalSizeBytes: 1234,
      optimizedByQpdf: false,
      dataUrl: null,
      createdAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z",
    },
    document: null,
    canonicalParse: null,
    enrichment: null,
    pipeline: createDiscoveryPipelineState(),
    debug: null,
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
    ...overrides,
  };
}

test("buildDiscoveryStatusResponse exposes structured failed-state diagnostics", () => {
  const discovery = buildDiscoveryRow({
    pipeline: createDiscoveryPipelineState({
      processingStage: "failed_extract",
      errorCode: "failed_extract",
      errorMessage: "We could not extract enough readable text.",
    }),
    debug: {
      failureSummary: {
        stage: "extract",
        normalizedErrorCode: "not_enough_text",
        errorMessage: "We could not extract enough readable text.",
        source: {
          type: "pdf",
          mimeType: "application/pdf",
          fileName: "meet.pdf",
          sizeBytes: 1234,
          optimizedByQpdf: false,
        },
        extraction: {
          extractedChars: 12,
          pageCount: 1,
          usedOcr: true,
          textQuality: "poor",
        },
        runtimeHints: {
          qpdfAvailable: false,
          ocrAttempted: true,
          pdfTextEngine: "pdfjs-dist",
          pdfWorkerDisabled: true,
        },
        timestamp: "2026-03-30T12:00:00.000Z",
      },
    },
  });

  const status = buildDiscoveryStatusResponse(discovery);

  assert.equal(status.errorCode, "failed_extract");
  assert.equal(status.errorStage, "extract");
  assert.equal(status.errorMessage, "We could not extract enough readable text.");
  assert.deepEqual(status.errorDetails, {
    normalizedErrorCode: "not_enough_text",
    source: {
      type: "pdf",
      mimeType: "application/pdf",
      fileName: "meet.pdf",
      sizeBytes: 1234,
      optimizedByQpdf: false,
    },
    extraction: {
      extractedChars: 12,
      pageCount: 1,
      usedOcr: true,
      textQuality: "poor",
    },
    runtimeHints: {
      qpdfAvailable: false,
      ocrAttempted: true,
      pdfTextEngine: "pdfjs-dist",
      pdfWorkerDisabled: true,
    },
    timestamp: "2026-03-30T12:00:00.000Z",
  });
});

test("buildDiscoveryStatusResponse omits error details for non-failed states", () => {
  const status = buildDiscoveryStatusResponse(
    buildDiscoveryRow({
      pipeline: createDiscoveryPipelineState({
        processingStage: "review_ready",
        lastSuccessfulStage: "compose_public",
      }),
    }),
  );

  assert.equal(status.errorCode, null);
  assert.equal(status.errorStage, null);
  assert.equal(status.errorMessage, null);
  assert.equal(status.errorDetails, null);
});

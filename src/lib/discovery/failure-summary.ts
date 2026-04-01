import { safeString } from "./shared.ts";
import type { EventDiscoveryRow } from "./types.ts";
import { PDF_TEXT_ENGINE_LABEL, PDF_WORKER_DISABLED } from "../pdf-raster.ts";

export type DiscoveryFailureSummary = {
  stage: string;
  normalizedErrorCode: string;
  errorMessage: string;
  source: {
    type: "pdf" | "image" | "url";
    mimeType: string | null;
    fileName: string | null;
    sizeBytes: number | null;
    optimizedByQpdf: boolean | null;
  };
  extraction: {
    extractedChars: number;
    pageCount: number | null;
    usedOcr: boolean | null;
    textQuality: string | null;
  } | null;
  runtimeHints: {
    qpdfAvailable: boolean;
    ocrAttempted: boolean;
    pdfTextEngine: string | null;
    pdfWorkerDisabled: boolean;
  };
  timestamp: string;
};

type DiscoveryFailureMetadata = {
  code?: string | null;
  extractionSnapshot?: Partial<DiscoveryFailureSummary["extraction"]> | null;
  runtimeHints?: Partial<DiscoveryFailureSummary["runtimeHints"]> | null;
};

type DiscoveryFailureCarrier = {
  discoveryFailureDetails?: DiscoveryFailureMetadata | null;
};

function safeNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function safeBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function inferSourceType(discovery: EventDiscoveryRow): "pdf" | "image" | "url" {
  if (safeString(discovery.source?.type) === "url") return "url";
  const mimeType = safeString(discovery.source?.mimeType || discovery.source?.originalMimeType);
  if (/pdf/i.test(mimeType)) return "pdf";
  return "image";
}

export function sanitizeDiscoveryErrorMessage(value: unknown): string {
  const raw =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : safeString((value as any)?.message) || String(value || "");
  const firstLine = raw.split(/\r?\n+/).find((line) => line.trim()) || "";
  const sanitized = firstLine
    .replace(/data:[^\s]+/gi, "[redacted-data-url]")
    .replace(
      /(?:file:\/\/)?(?:\/Users\/[^\s]+|\/var\/task\/[^\s]+|\/tmp\/[^\s]+|\/home\/[^\s]+)/g,
      "[redacted-path]",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (!sanitized) return "Discovery failed";
  return sanitized.length > 280 ? `${sanitized.slice(0, 277)}...` : sanitized;
}

function normalizeCodeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeDiscoveryErrorCode(error: unknown, fallbackCode: string): string {
  const explicitCode = normalizeCodeToken(safeString((error as any)?.code));
  if (explicitCode) return explicitCode;

  const detailCode = normalizeCodeToken(
    safeString((error as DiscoveryFailureCarrier)?.discoveryFailureDetails?.code),
  );
  if (detailCode) return detailCode;

  const message = sanitizeDiscoveryErrorMessage(error).toLowerCase();
  if (message.includes("discovery cancelled")) return "cancelled";
  if (message.includes("not enough text extracted")) return "not_enough_text";
  if (message.includes("invalid file payload")) return "invalid_file_payload";
  if (message.includes("unsupported file type")) return "unsupported_file_type";
  if (message.includes("password")) return "pdf_password_protected";
  if (message.includes("pdf.worker") || message.includes("fake worker")) {
    return "pdf_worker_unavailable";
  }
  if (message.includes("pdfjs")) return "pdf_text_engine_unavailable";
  if (message.includes("failed to persist discovery state")) return "persist_failed";

  return normalizeCodeToken(fallbackCode) || "discovery_failed";
}

function resolveExtractionFromDocument(discovery: EventDiscoveryRow) {
  const document = discovery.document;
  const meta = (document?.extractionMeta || {}) as Record<string, unknown>;
  const extractedChars = safeString(meta.extractedText).length;
  const pageCount =
    safeNumber(document?.pageCount) ||
    safeNumber(Array.isArray(document?.pages) ? document?.pages.length : null);
  const usedOcr = safeBoolean(meta.usedOcr) ?? safeBoolean(document?.ocrUsed);
  const textQuality = safeString(meta.textQuality) || null;
  if (!extractedChars && !pageCount && usedOcr === null && !textQuality) return null;
  return {
    extractedChars,
    pageCount,
    usedOcr,
    textQuality,
  };
}

function resolveExtractionSnapshot(
  discovery: EventDiscoveryRow,
  error: unknown,
): DiscoveryFailureSummary["extraction"] {
  const errorSnapshot = (error as DiscoveryFailureCarrier)?.discoveryFailureDetails?.extractionSnapshot;
  const documentSnapshot = resolveExtractionFromDocument(discovery);
  const extractedChars =
    safeNumber(errorSnapshot?.extractedChars) ?? documentSnapshot?.extractedChars ?? 0;
  const pageCount = safeNumber(errorSnapshot?.pageCount) ?? documentSnapshot?.pageCount ?? null;
  const usedOcr = safeBoolean(errorSnapshot?.usedOcr) ?? documentSnapshot?.usedOcr ?? null;
  const textQuality = safeString(errorSnapshot?.textQuality) || documentSnapshot?.textQuality || null;
  if (!extractedChars && !pageCount && usedOcr === null && !textQuality) return null;
  return {
    extractedChars,
    pageCount,
    usedOcr,
    textQuality,
  };
}

function resolveRuntimeHints(discovery: EventDiscoveryRow, error: unknown) {
  const sourceType = inferSourceType(discovery);
  const meta = (error as DiscoveryFailureCarrier)?.discoveryFailureDetails?.runtimeHints;
  const extractionPerformance = (discovery.debug?.extractionPerformance || {}) as Record<string, unknown>;
  const ocrAttempted =
    safeBoolean(meta?.ocrAttempted) ??
    ((safeNumber(extractionPerformance.ocrPageCount) || 0) > 0 ||
      safeBoolean(resolveExtractionSnapshot(discovery, error)?.usedOcr) === true);
  return {
    qpdfAvailable: Boolean(discovery.source?.optimizedByQpdf),
    ocrAttempted,
    pdfTextEngine:
      safeString(meta?.pdfTextEngine) || (sourceType === "pdf" ? PDF_TEXT_ENGINE_LABEL : null),
    pdfWorkerDisabled: safeBoolean(meta?.pdfWorkerDisabled) ?? PDF_WORKER_DISABLED,
  };
}

export function buildDiscoveryFailureSummary(params: {
  discovery: EventDiscoveryRow;
  error: unknown;
  failedStage: string;
  fallbackCode: string;
  timestamp?: string;
}): DiscoveryFailureSummary {
  const sourceType = inferSourceType(params.discovery);
  return {
    stage: safeString(params.failedStage) || "extract",
    normalizedErrorCode: normalizeDiscoveryErrorCode(params.error, params.fallbackCode),
    errorMessage: sanitizeDiscoveryErrorMessage(params.error),
    source: {
      type: sourceType,
      mimeType: safeString(params.discovery.source?.mimeType || params.discovery.source?.originalMimeType) || null,
      fileName:
        safeString(params.discovery.source?.fileName || params.discovery.source?.originalName) || null,
      sizeBytes:
        safeNumber(params.discovery.source?.sizeBytes) ??
        safeNumber(params.discovery.source?.originalSizeBytes),
      optimizedByQpdf:
        typeof params.discovery.source?.optimizedByQpdf === "boolean"
          ? params.discovery.source.optimizedByQpdf
          : null,
    },
    extraction: resolveExtractionSnapshot(params.discovery, params.error),
    runtimeHints: resolveRuntimeHints(params.discovery, params.error),
    timestamp: safeString(params.timestamp) || new Date().toISOString(),
  };
}

export function getDiscoveryFailureSummary(
  value: unknown,
): DiscoveryFailureSummary | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const source = (record.source || {}) as Record<string, unknown>;
  const extraction = (record.extraction || {}) as Record<string, unknown>;
  const runtimeHints = (record.runtimeHints || {}) as Record<string, unknown>;
  const stage = safeString(record.stage);
  const normalizedErrorCode = safeString(record.normalizedErrorCode);
  const errorMessage = safeString(record.errorMessage);
  if (!stage || !normalizedErrorCode || !errorMessage) return null;
  return {
    stage,
    normalizedErrorCode,
    errorMessage,
    source: {
      type: inferStoredSourceType(safeString(source.type)),
      mimeType: safeString(source.mimeType) || null,
      fileName: safeString(source.fileName) || null,
      sizeBytes: safeNumber(source.sizeBytes),
      optimizedByQpdf: safeBoolean(source.optimizedByQpdf),
    },
    extraction:
      extraction && Object.keys(extraction).length > 0
        ? {
            extractedChars: safeNumber(extraction.extractedChars) || 0,
            pageCount: safeNumber(extraction.pageCount),
            usedOcr: safeBoolean(extraction.usedOcr),
            textQuality: safeString(extraction.textQuality) || null,
          }
        : null,
    runtimeHints: {
      qpdfAvailable: Boolean(runtimeHints.qpdfAvailable),
      ocrAttempted: Boolean(runtimeHints.ocrAttempted),
      pdfTextEngine: safeString(runtimeHints.pdfTextEngine) || null,
      pdfWorkerDisabled: safeBoolean(runtimeHints.pdfWorkerDisabled) ?? PDF_WORKER_DISABLED,
    },
    timestamp: safeString(record.timestamp) || new Date(0).toISOString(),
  };
}

function inferStoredSourceType(value: string): "pdf" | "image" | "url" {
  if (value === "pdf" || value === "image" || value === "url") return value;
  return "url";
}

export function isDiscoveryFailedState(value: unknown): boolean {
  return /^failed_/i.test(safeString(value));
}

export function toDiscoveryStatusErrorDetails(
  summary: DiscoveryFailureSummary | null,
): Record<string, unknown> | null {
  if (!summary) return null;
  return {
    normalizedErrorCode: summary.normalizedErrorCode,
    source: summary.source,
    extraction: summary.extraction,
    runtimeHints: summary.runtimeHints,
    timestamp: summary.timestamp,
  };
}

export function attachDiscoveryFailureMetadata<T extends Error>(
  error: T,
  details: DiscoveryFailureMetadata,
): T & DiscoveryFailureCarrier {
  (error as T & DiscoveryFailureCarrier).discoveryFailureDetails = details;
  return error as T & DiscoveryFailureCarrier;
}

import type { DiscoveryStatusResponse } from "../../lib/discovery/types";

export type DiscoveryClientError = Error & {
  code: string | null;
  stage: string | null;
  details: Record<string, unknown> | null;
  technicalDetails: string | null;
};

export type DiscoveryUiError = {
  message: string;
  technicalDetails: string | null;
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveDiscoveryFriendlyErrorMessage(
  status: Partial<DiscoveryStatusResponse> | null | undefined,
  fallback = "Discovery failed.",
): string {
  const errorCode = safeString(status?.errorCode).toLowerCase();
  const normalizedErrorCode = safeString(status?.errorDetails?.normalizedErrorCode).toLowerCase();
  const errorMessage = safeString(status?.errorMessage);

  if (normalizedErrorCode === "pdf_worker_unavailable") {
    return "The server could not open that PDF cleanly. Retry with the same file or export a flatter PDF.";
  }
  if (normalizedErrorCode === "not_enough_text" || errorCode === "failed_extract") {
    return "We could not extract enough readable text from that file on the server.";
  }
  if (errorCode === "failed_parse") {
    return "We read the source, but could not map it into a structured event yet.";
  }
  if (errorCode === "failed_enrich") {
    return "The event draft was created, but follow-up enrichment failed.";
  }
  if (errorCode === "failed_compose") {
    return "The event data was parsed, but we could not finish assembling the public draft.";
  }
  return errorMessage || fallback;
}

export function formatDiscoveryTechnicalDetails(
  status: Partial<DiscoveryStatusResponse> | null | undefined,
): string | null {
  const errorCode = safeString(status?.errorCode) || null;
  const errorStage = safeString(status?.errorStage) || null;
  const errorMessage = safeString(status?.errorMessage) || null;
  const errorDetails =
    status?.errorDetails && typeof status.errorDetails === "object" ? status.errorDetails : null;
  if (!errorCode && !errorStage && !errorMessage && !errorDetails) return null;
  return JSON.stringify(
    {
      errorCode,
      errorStage,
      errorMessage,
      errorDetails,
    },
    null,
    2,
  );
}

export function createDiscoveryStatusClientError(
  status: Partial<DiscoveryStatusResponse> | null | undefined,
  fallback = "Discovery failed.",
): DiscoveryClientError {
  const message = resolveDiscoveryFriendlyErrorMessage(status, fallback);
  const error = new Error(message) as DiscoveryClientError;
  error.code = safeString(status?.errorCode) || null;
  error.stage = safeString(status?.errorStage) || null;
  error.details =
    status?.errorDetails && typeof status.errorDetails === "object" ? status.errorDetails : null;
  error.technicalDetails = formatDiscoveryTechnicalDetails(status);
  return error;
}

export function toDiscoveryUiError(
  error: unknown,
  fallback: string,
): DiscoveryUiError {
  if (error instanceof Error) {
    return {
      message: safeString(error.message) || fallback,
      technicalDetails:
        safeString((error as Partial<DiscoveryClientError>).technicalDetails) || null,
    };
  }
  if (typeof error === "string" && error.trim()) {
    return { message: error.trim(), technicalDetails: null };
  }
  return { message: fallback, technicalDetails: null };
}

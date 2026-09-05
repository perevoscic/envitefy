/** Provider failures must never be presented as evidence that the image is unreadable. */
export function classifyOpenAiHttpFailure(status: number, body: unknown): string {
  const error = body && typeof body === "object" && "error" in body ? body.error : null;
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  const type = error && typeof error === "object" && "type" in error ? error.type : null;
  if (
    code === "credit_balance_exhausted" ||
    code === "insufficient_quota" ||
    type === "insufficient_quota"
  )
    return "OPENAI_QUOTA_EXCEEDED";
  if (status === 401 || status === 403) return "OPENAI_ACCESS_DENIED";
  if (status === 429) return "OPENAI_RATE_LIMITED";
  return "OPENAI_HTTP_ERROR";
}

export function shouldStopOcrFallbacks(code: string | null): boolean {
  return (
    code === "OPENAI_QUOTA_EXCEEDED" ||
    code === "OPENAI_ACCESS_DENIED" ||
    code === "OPENAI_RATE_LIMITED"
  );
}

export function getOcrFailureResponse(providerConfigured: boolean, failureCode: string | null) {
  if (!providerConfigured)
    return {
      status: 503,
      code: "OCR_NOT_CONFIGURED",
      error: "OCR is not configured. Set OPENAI_API_KEY before snapping or uploading event flyers.",
    };
  switch (failureCode) {
    case "OPENAI_QUOTA_EXCEEDED":
      return {
        status: 503,
        code: "OCR_PROVIDER_QUOTA_EXCEEDED",
        error:
          "Scanning is unavailable because the scan service has reached its API usage limit. Please contact support or enter the event manually.",
      };
    case "OPENAI_ACCESS_DENIED":
      return {
        status: 503,
        code: "OCR_PROVIDER_ACCESS_DENIED",
        error:
          "The scan service could not authenticate with its provider. Please contact support or enter the event manually.",
      };
    case "OPENAI_RATE_LIMITED":
      return {
        status: 429,
        code: "OCR_RATE_LIMITED",
        error:
          "The scan service is receiving too many requests. Please wait a moment and try again.",
      };
    case "OPENAI_HTTP_ERROR":
    case "OPENAI_NETWORK_ERROR":
      return {
        status: 502,
        code: "OCR_PROVIDER_UNAVAILABLE",
        error:
          "The scan service could not complete the request. Please try again shortly or enter the event manually.",
      };
    case "OPENAI_TIMEOUT":
      return {
        status: 504,
        code: "OCR_TIMEOUT",
        error:
          "OCR timed out before OpenAI returned event details. Please try again, or enter the event manually if the image is complex.",
      };
    default:
      return {
        status: 422,
        code: "OCR_UNREADABLE",
        error:
          "OCR could not read enough event details from this file. Please try a clearer image or enter the event manually.",
      };
  }
}

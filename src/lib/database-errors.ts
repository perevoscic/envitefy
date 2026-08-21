const DATABASE_UNAVAILABLE_CODES = new Set([
  "PG_AUTH_BACKOFF",
  "28P01",
  "28000",
  "53300",
  "57P01",
  "57P02",
  "57P03",
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "08007",
  "08P01",
  "EACCES",
  "EPERM",
  "EAI_AGAIN",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

const DATABASE_UNAVAILABLE_MESSAGE =
  /authentication failed|circuit breaker open|connection terminated|connection timeout|connect timeout|getaddrinfo|invalid auth|invalid password|network is unreachable|not known|password authentication failed|permission denied|refused|terminated unexpectedly|timeout|too many (?:authentication errors|clients|connections)/i;

function readStringField(value: Record<string, unknown>, field: string): string {
  return typeof value[field] === "string" ? value[field] : "";
}

function summarizeError(error: unknown, visited: Set<object>): string | null {
  if (!error || typeof error !== "object") return null;
  if (visited.has(error)) return null;
  visited.add(error);

  const record = error as Record<string, unknown>;
  const code = readStringField(record, "code");
  const message = readStringField(record, "message").trim();
  if (code || (message && message !== "AggregateError")) {
    return [code && `[${code}]`, message].filter(Boolean).join(" ");
  }

  const causeSummary = summarizeError(record.cause, visited);
  if (causeSummary) return causeSummary;

  const nestedErrors = record.errors;
  if (Array.isArray(nestedErrors)) {
    for (const nestedError of nestedErrors) {
      const nestedSummary = summarizeError(nestedError, visited);
      if (nestedSummary) return nestedSummary;
    }
  }

  return null;
}

export function describeDatabaseError(error: unknown): string {
  return summarizeError(error, new Set<object>()) || "Database connection unavailable";
}

/**
 * Recognizes database connectivity failures, including the nested errors emitted
 * by Node when a hostname resolves to several unreachable addresses.
 */
export function isDatabaseUnavailableError(error: unknown): boolean {
  const visited = new Set<object>();

  const visit = (value: unknown): boolean => {
    if (!value || typeof value !== "object") return false;
    if (visited.has(value)) return false;
    visited.add(value);

    const record = value as Record<string, unknown>;
    const code = readStringField(record, "code");
    const message = readStringField(record, "message");

    if (DATABASE_UNAVAILABLE_CODES.has(code) || DATABASE_UNAVAILABLE_MESSAGE.test(message)) {
      return true;
    }

    if (visit(record.cause)) return true;

    const nestedErrors = record.errors;
    return Array.isArray(nestedErrors) && nestedErrors.some(visit);
  };

  return visit(error);
}

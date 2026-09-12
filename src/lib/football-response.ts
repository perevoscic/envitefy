const PARSE_ERROR = /unexpected (?:token|end)|<!doctype|not valid json|json.*position/i;

export function footballErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return message && !PARSE_ERROR.test(message) ? message : fallback;
}

/** Includes readable handling for HTML proxy/dev error pages and malformed JSON. */
export async function readFootballResponse(
  response: Response,
  fallback: string,
): Promise<Record<string, unknown>> {
  const parsed: unknown = await response.json().catch(() => null);
  if (!response.ok || !parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    const error = parsed && typeof parsed === "object" && "error" in parsed ? parsed.error : null;
    throw new Error(
      response.status === 401
        ? "Sign in again, keeping this editor open to preserve your changes."
        : footballErrorMessage(error, fallback),
    );
  }
  return parsed as Record<string, unknown>;
}

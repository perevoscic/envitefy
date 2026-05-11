const SAFE_CONCIERGE_ERROR_MESSAGES = new Set([
  "Creation session id is required to create this invite.",
  "Creation session was not found for this user.",
  "Add the missing event details before creating this invite.",
  "This invite is already being created. Please wait a moment.",
]);

export function conciergeApiErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message.trim() : "";
  return SAFE_CONCIERGE_ERROR_MESSAGES.has(message) ? message : fallback;
}

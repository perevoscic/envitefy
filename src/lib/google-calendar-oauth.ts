export const GOOGLE_CALENDAR_EVENT_WRITE_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.owned";

const GOOGLE_CALENDAR_EVENT_WRITE_SCOPES = new Set([
  GOOGLE_CALENDAR_EVENT_WRITE_SCOPE,
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar",
]);

export function hasGoogleCalendarEventWriteScope(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return value
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean)
    .some((scope) => GOOGLE_CALENDAR_EVENT_WRITE_SCOPES.has(scope));
}

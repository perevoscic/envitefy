export type CalendarProvider = "apple" | "google" | "microsoft";
export type CalendarConnections = Record<CalendarProvider, boolean>;
export type EventCalendarLinks = { appleInline: string; google: string; outlook: string };

export const CALENDAR_DEFAULT_STORAGE_KEY = "envitefy:event-actions:calendar-default:v1";
export const CALENDAR_DEFAULT_CHANGED = "envitefy:calendar-default-changed";
export const CALENDAR_PROVIDER_NAMES: Record<CalendarProvider, string> = {
  apple: "Apple Calendar",
  google: "Google Calendar",
  microsoft: "Outlook Calendar",
};

export function normalizeCalendarProvider(value: unknown): CalendarProvider | null {
  if (typeof value !== "string") return null;
  const provider = value.trim().toLowerCase();
  return provider === "apple" || provider === "google" || provider === "microsoft"
    ? provider
    : null;
}

export function validCalendarDefault(
  provider: CalendarProvider | null,
  signedIn: boolean,
  connections: CalendarConnections | null,
): CalendarProvider | null {
  return provider && (!signedIn || connections?.[provider]) ? provider : null;
}

export function calendarActionLabel(provider: CalendarProvider | null): string {
  return provider ? `Add to ${CALENDAR_PROVIDER_NAMES[provider]}` : "Add to calendar";
}

export function calendarProviderHref(
  links: EventCalendarLinks,
  provider: CalendarProvider,
): string {
  return provider === "apple"
    ? links.appleInline
    : provider === "google"
      ? links.google
      : links.outlook;
}

export function readLocalCalendarDefault(): CalendarProvider | null {
  try {
    return normalizeCalendarProvider(window.localStorage.getItem(CALENDAR_DEFAULT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeLocalCalendarDefault(provider: CalendarProvider | null): void {
  try {
    if (provider) window.localStorage.setItem(CALENDAR_DEFAULT_STORAGE_KEY, provider);
    else window.localStorage.removeItem(CALENDAR_DEFAULT_STORAGE_KEY);
  } catch {
    // Calendar handoff still works when storage is unavailable.
  }
  window.dispatchEvent(new Event(CALENDAR_DEFAULT_CHANGED));
}

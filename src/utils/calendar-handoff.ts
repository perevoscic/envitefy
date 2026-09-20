import { parseCalendarDateTimeToIso, normalizeCalendarTimeZone } from "../lib/calendar-date-time.ts";
import { type CalendarProvider, normalizeCalendarProvider } from "../lib/calendar-preference.ts";
import { buildCalendarLinks, type CalendarLinkArgs } from "./calendar-links.ts";

export type CalendarHandoffEvent = { provider: CalendarProvider; event: CalendarLinkArgs };

/** Email clients cannot run our launcher. Open a public page with an explicit tap. */
export function buildCalendarHandoffPath(args: CalendarLinkArgs, provider: CalendarProvider): string {
  const links = buildCalendarLinks(args);
  const params = new URL(links.appleInline, "https://envitefy.com").searchParams;
  params.delete("disposition");
  params.delete("floating");
  params.set("timezone", normalizeCalendarTimeZone(args.timezone));
  params.set("provider", provider);
  return `/calendar/add?${params.toString()}`;
}

/** Accept event fields only; query strings can never supply a redirect destination. */
export function parseCalendarHandoff(params: URLSearchParams): CalendarHandoffEvent | null {
  const provider = normalizeCalendarProvider(params.get("provider"));
  if (!provider) return null;
  if ([...params].some(([key, value]) => value.length > (key === "description" ? 16000 : 2000))) return null;
  const timezone = normalizeCalendarTimeZone(params.get("timezone"));
  const allDay = params.get("allDay") === "true";
  const parseDate = (raw: string | null) => {
    if (!raw || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(raw)) return null;
    return parseCalendarDateTimeToIso(allDay ? raw.slice(0, 10) : raw, allDay ? "UTC" : timezone);
  };
  const startIso = parseDate(params.get("start"));
  const endIso = parseDate(params.get("end"));
  if (!startIso || (params.has("end") && (!endIso || Date.parse(endIso) <= Date.parse(startIso)))) return null;
  const reminders = (params.get("reminders") || "").split(",").filter(Boolean).map(Number);
  if (reminders.some(value => !Number.isInteger(value) || value < 0 || value > 525600)) return null;
  const recurrence = params.get("recurrence") || null;
  if (recurrence && /[\r\n]/.test(recurrence)) return null;
  return {
    provider,
    event: {
      title: params.get("title") || "Event",
      description: params.get("description") || "",
      location: params.get("location") || "",
      startIso,
      endIso,
      timezone,
      allDay,
      reminders: reminders.length ? reminders : null,
      recurrence,
    },
  };
}

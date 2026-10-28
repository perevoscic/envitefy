import { parseCalendarDateTimeToIso } from "./calendar-date-time";
import { isEventDraft } from "./event-draft-access";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Published events become read-only after their end, or after their final day if no end time is known. */
export function isPastEvent(data: Record<string, unknown> | null | undefined, now = Date.now()): boolean {
  if (!data || isEventDraft(data)) return false;
  const form = record(record(data.liveCardBuilder).form);
  const details = record(record(record(data.studioCard).invitationData).eventDetails);
  const sources = [form, data, record(data.publicEvent), details, record(data.details)];
  const read = (...keys: string[]) => {
    for (const source of sources) for (const key of keys) {
      if (typeof source[key] === "string" && source[key].trim()) return source[key].trim();
    }
    return "";
  };
  const timezone = read("timezone", "timeZone") || "UTC";
  const end = read("endAt", "endsAt", "endDateTime", "endISO", "calendarEndISO");
  if (end) {
    const iso = parseCalendarDateTimeToIso(end, timezone);
    return iso !== null && Date.parse(iso) <= now;
  }
  const date = read("endDate") || read("date", "eventDate", "startDate", "startAt", "startISO", "calendarStartISO", "start");
  if (!date) return false;
  // Do not infer years or silently roll invalid dates into another month.
  if (!/^\d{4}-\d{2}-\d{2}(?:$|T| )/.test(date)) return false;
  const day = date.slice(0, 10);
  const time = read("endTime");
  const iso = parseCalendarDateTimeToIso(`${day}T${/^\d{2}:\d{2}$/.test(time) ? time : "23:59:59"}`, timezone);
  return iso !== null && Date.parse(iso) <= now;
}

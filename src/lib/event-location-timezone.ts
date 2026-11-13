import { parseCalendarDateTimeToIso } from "./calendar-date-time";
import { buildGymnasticsEventDateTimes } from "./gymnastics-event-dates";

export const eventLocationDateTimes = buildGymnasticsEventDateTimes;

export function validEventTimeZone(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    new Intl.DateTimeFormat("en", { timeZone: value.trim() }).format(0);
    return value.trim();
  } catch {
    return "";
  }
}

export function eventTimezoneLocation(data: Record<string, any>) {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const address = text(data.address) || text(data.location?.address) || text(data.location);
  const city = [text(data.city), text(data.state)].filter(Boolean).join(", ");
  const venue = text(data.venue) || text(data.location?.name);
  const query = [address, city && !address.toLowerCase().includes(city.toLowerCase()) ? city : ""]
    .filter(Boolean)
    .join(", ");
  return { query, venue, key: query.toLowerCase().replace(/\s+/g, " ").trim() };
}

/** Calendar instants come from the venue's zone, without shifting authored wall-clock fields. */
export function applyEventLocationTimezone<T extends { data: Record<string, any> }>(
  payload: T,
  source: Record<string, any>,
): T {
  const timezone = validEventTimeZone(source.timezone);
  if (source.timezone && !timezone)
    throw new Error("Add the event city or full address so its local time can be confirmed.");
  if (source.date && Object.hasOwn(source, "time") && !source.time) {
    const dates = eventLocationDateTimes(source);
    return { ...payload, data: { ...payload.data, allDay: true, startISO: dates.startISO, startAt: dates.startISO, start: dates.startISO, endISO: dates.endISO, endAt: dates.endISO, end: dates.endISO,
      ...(timezone ? { timezone, tz: timezone, timezoneSource: source.timezoneSource, timezoneLocation: source.timezoneLocation } : {}) } };
  }
  if (!timezone) return payload;
  const data: Record<string, any> = {
    ...payload.data,
    timezone,
    tz: timezone,
    timezoneSource: source.timezoneSource,
    timezoneLocation: source.timezoneLocation,
  };
  // Gymnastics already handles inclusive multi-day all-day ranges. Keep those dates intact.
  if (source.date && source.time && data.allDay !== true) {
    const start = parseCalendarDateTimeToIso(`${source.date}T${source.time}`, timezone);
    const end = source.endTime
      ? parseCalendarDateTimeToIso(`${source.endDate || source.date}T${source.endTime}`, timezone)
      : null;
    if (!start)
      throw new Error(
        "This event time does not exist in the location’s time zone. Choose another time.",
      );
    if (source.endTime && (!end || end <= start))
      throw new Error("End time must be after the start in the event location’s time zone.");
    if (start) Object.assign(data, { startISO: start, startAt: start, start });
    if (end && start && end > start) Object.assign(data, { endISO: end, endAt: end, end });
  }
  return { ...payload, data };
}

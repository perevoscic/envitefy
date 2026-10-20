import {
  addCalendarDays,
  formatCalendarDateTimeInTimeZone,
  parseCalendarDateTimeToIso,
} from "./calendar-date-time";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

export function validGymnasticsTimeZone(value: unknown): string {
  const zone = text(value);
  if (!zone) return "";
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone }).format(0);
    return zone;
  } catch {
    return "";
  }
}

/** Date-only evidence stays a calendar date; a real instant is read in the venue's zone. */
export function gymnasticsDateParts(value: unknown, timezone?: unknown) {
  const input = text(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return { date: input, time: "" };
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(input);
  const zone = validGymnasticsTimeZone(timezone);
  // Without a venue zone retain the supplied clock for correction, without creating an instant.
  const local = hasOffset && zone ? formatCalendarDateTimeInTimeZone(input, zone) : input;
  const match = local?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? { date: match[1], time: match[2] } : { date: "", time: "" };
}

export function buildGymnasticsEventDateTimes(data: {
  date?: unknown; time?: unknown; endDate?: unknown; endTime?: unknown; timezone?: unknown;
}) {
  const date = text(data.date);
  const time = text(data.time);
  const endDate = text(data.endDate);
  const endTime = text(data.endTime);
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Boolean(parseCalendarDateTimeToIso(value, "UTC"));
  if (!validDate(date)) return { startISO: null, endISO: null, allDay: !time };
  if (!time) {
    // The editable final day is inclusive; calendar DTEND is exclusive.
    return {
      startISO: date,
      endISO: validDate(endDate) && endDate >= date ? addCalendarDays(endDate, 1) : null,
      allDay: true,
    };
  }
  const zone = validGymnasticsTimeZone(data.timezone);
  if (!zone) return { startISO: null, endISO: null, allDay: false };
  const startISO = parseCalendarDateTimeToIso(`${date}T${time}`, zone);
  const endISO = endTime ? parseCalendarDateTimeToIso(`${endDate || date}T${endTime}`, zone) : null;
  return {
    startISO,
    endISO: endISO && startISO && endISO > startISO ? endISO : null,
    allDay: false,
  };
}

/** Local fields, including intentional empty clocks, take priority over legacy ISO fallbacks. */
export function hydrateGymnasticsEventDates(data: Record<string, any>, range?: { start?: string; end?: string }) {
  const start = gymnasticsDateParts(data.startISO || data.startAt || data.start || data.startIso, data.timezone);
  const end = gymnasticsDateParts(data.endISO || data.endAt || data.end, data.timezone);
  const time = typeof data.time === "string" ? data.time : data.allDay ? "" : start.time;
  const endTime = typeof data.endTime === "string" ? data.endTime : !time || data.allDay ? "" : end.time;
  return {
    date: typeof data.date === "string" ? data.date : start.date || range?.start || "",
    time,
    endDate: typeof data.endDate === "string" ? data.endDate :
      data.allDay && data.gymnasticsDateVersion === 1 && end.date ? addCalendarDays(end.date, -1) || "" : end.date || range?.end || "",
    endTime,
  };
}

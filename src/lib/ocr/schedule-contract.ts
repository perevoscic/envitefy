import { nullableString, strictObject } from "../creation/source-evidence.ts";
import type { GymnasticsScheduleEvent } from "./types.ts";

export const GYMNASTICS_SCHEDULE_SCHEMA = strictObject({
  season: nullableString,
  homeTeam: nullableString,
  homeAddress: nullableString,
  events: {
    type: "array",
    items: strictObject({
      title: { type: "string" },
      start: nullableString,
      end: nullableString,
      allDay: { type: "boolean" },
      location: nullableString,
      description: nullableString,
    }),
  },
});

export const PRACTICE_SCHEDULE_SCHEMA = strictObject({
  title: nullableString,
  timeframe: nullableString,
  timezoneHint: nullableString,
  groups: {
    type: "array",
    items: strictObject({
      name: nullableString,
      note: nullableString,
      sessions: {
        type: "array",
        items: strictObject({
          day: nullableString,
          startTime: nullableString,
          endTime: nullableString,
          note: nullableString,
        }),
      },
    }),
  },
});

function calendarDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return null;
  const date = value.slice(0, 10);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
    ? date
    : null;
}

function timestamp(value: unknown): string | null {
  if (
    !calendarDate(value) ||
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  )
    return null;
  const clock = value.slice(11).match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!clock || Number(clock[1]) > 23 || Number(clock[2]) > 59 || Number(clock[3] || 0) > 59)
    return null;
  return Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
}

/** Missing/invalid dates remain editable rows; no current date or guessed duration. */
export function normalizeGymnasticsScheduleEvent(
  value: unknown,
  timezone: string,
): GymnasticsScheduleEvent {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const allDay = row.allDay !== false;
  let start: string | null = null;
  let end: string | null = null;
  if (allDay) {
    const date = calendarDate(row.start);
    const endDate = calendarDate(row.end);
    if (date) {
      start = `${date}T00:00:00.000Z`;
      if (endDate && endDate > date) end = `${endDate}T00:00:00.000Z`;
      // All-day calendar events use an exclusive next-day boundary.
      else if (row.end == null || row.end === "")
        end = new Date(Date.parse(start) + 86400000).toISOString();
    }
  } else {
    start = timestamp(row.start);
    const candidate = timestamp(row.end);
    if (start && candidate && Date.parse(candidate) > Date.parse(start)) end = candidate;
  }
  return {
    title: typeof row.title === "string" ? row.title.slice(0, 120) : "Meet",
    start,
    end,
    allDay,
    timezone,
    location: typeof row.location === "string" ? row.location : "",
    description: typeof row.description === "string" ? row.description.slice(0, 600) : "",
  };
}

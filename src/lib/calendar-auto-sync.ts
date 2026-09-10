import type { NormalizedEvent } from "./mappers";
import { buildCalendarDescription, isMedicalCalendarEvent } from "./calendar-description";
import {
  addCalendarDays,
  formatCalendarDateInTimeZone,
  normalizeCalendarTimeZone,
  parseCalendarDateTimeToIso,
} from "./calendar-date-time";

type JsonRecord = Record<string, unknown>;

export type CalendarFlyer = {
  sourceUrl: string;
  previewUrl: string;
  name: string;
  mimeType: string;
};

export type BuiltAutoCalendarEvent = {
  event: NormalizedEvent;
  flyer: CalendarFlyer | null;
};

export type BuildAutoCalendarEventResult =
  | { ok: true; value: BuiltAutoCalendarEvent }
  | { ok: false; reason: "missing_start" | "invalid_start" | "invalid_all_day_date" };

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = readText(value);
    if (text) return text;
  }
  return "";
}

function buildLocation(data: JsonRecord): { venue?: string; location?: string } {
  const venue = firstText(data.venue, data.placeName);
  const location = firstText(data.location, data.address, data.locationText);
  return {
    ...(venue ? { venue } : {}),
    ...(location ? { location } : {}),
  };
}

function buildReminders(value: unknown): { minutes: number }[] | null {
  if (!Array.isArray(value)) return [{ minutes: 1_440 }];
  const reminders = value
    .map((item) => {
      if (!isRecord(item)) return null;
      const minutes = Number(item.minutes);
      return Number.isFinite(minutes) && minutes >= 0 && minutes <= 40_320
        ? { minutes: Math.round(minutes) }
        : null;
    })
    .filter((item): item is { minutes: number } => Boolean(item));
  return reminders.length ? reminders : [{ minutes: 1_440 }];
}

function buildFlyer(params: {
  data: JsonRecord;
  flyerSourceUrl: string;
  flyerPreviewUrl: string;
}): CalendarFlyer | null {
  if (isMedicalCalendarEvent(params.data)) return null;
  if (!params.flyerSourceUrl && !params.flyerPreviewUrl) return null;
  const attachment = isRecord(params.data.attachment) ? params.data.attachment : {};
  return {
    sourceUrl: params.flyerSourceUrl || params.flyerPreviewUrl,
    previewUrl: params.flyerPreviewUrl || params.flyerSourceUrl,
    name: firstText(attachment.name, attachment.originalName, "Event flyer or invite"),
    mimeType: firstText(attachment.type, attachment.originalType, "application/octet-stream"),
  };
}

export function buildAutoCalendarEvent(params: {
  title: string;
  data: JsonRecord;
  envitefyUrl: string;
  flyerSourceUrl?: string;
  flyerPreviewUrl?: string;
}): BuildAutoCalendarEventResult {
  const { data } = params;
  const startRaw = firstText(data.startAt, data.startISO, data.start);
  if (!startRaw) return { ok: false, reason: "missing_start" };

  const timezone = normalizeCalendarTimeZone(firstText(data.timezone, data.tz));
  const allDay = data.allDay === true || data.timeFound === false;
  let start: string;
  let end: string;

  if (allDay) {
    const startDate = formatCalendarDateInTimeZone(startRaw, timezone);
    if (!startDate) return { ok: false, reason: "invalid_all_day_date" };
    const endRaw = firstText(data.endAt, data.endISO, data.end);
    const proposedEnd = endRaw ? formatCalendarDateInTimeZone(endRaw, timezone) : null;
    start = startDate;
    end = proposedEnd && proposedEnd > startDate ? proposedEnd : addCalendarDays(startDate, 1) || "";
    if (!end) return { ok: false, reason: "invalid_all_day_date" };
  } else {
    const startIso = parseCalendarDateTimeToIso(startRaw, timezone);
    if (!startIso) return { ok: false, reason: "invalid_start" };
    const endRaw = firstText(data.endAt, data.endISO, data.end);
    const endIso = endRaw ? parseCalendarDateTimeToIso(endRaw, timezone) : null;
    start = startIso;
    end =
      endIso && new Date(endIso).getTime() > new Date(startIso).getTime()
        ? endIso
        : new Date(new Date(startIso).getTime() + 90 * 60 * 1_000).toISOString();
  }

  const flyer = buildFlyer({
    data,
    flyerSourceUrl: params.flyerSourceUrl || "",
    flyerPreviewUrl: params.flyerPreviewUrl || "",
  });
  const location = buildLocation(data);
  const event: NormalizedEvent = {
    title: readText(params.title) || firstText(data.title, data.name, "Event"),
    start,
    end,
    allDay,
    timezone,
    ...location,
    description: buildCalendarDescription(
      { ...data, title: params.title, start, end, allDay, timezone, ...location },
      { envitefyUrl: params.envitefyUrl, flyerUrl: flyer?.sourceUrl },
    ),
    recurrence: firstText(data.recurrence) || null,
    reminders: buildReminders(data.reminders),
    attachment: flyer
      ? { name: flyer.name, type: flyer.mimeType, dataUrl: flyer.sourceUrl }
      : null,
  };
  return { ok: true, value: { event, flyer } };
}

import type { NormalizedEvent } from "./mappers";
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

function normalizeLine(value: unknown): string {
  return readText(value).replace(/\s+/g, " ");
}

function pushUniqueLine(lines: string[], value: string) {
  const normalized = value.trim();
  if (!normalized) return;
  const key = normalized.toLowerCase();
  if (lines.some((line) => line.toLowerCase() === key)) return;
  lines.push(normalized);
}

function readRsvp(value: unknown): string {
  if (typeof value === "string") return normalizeLine(value);
  if (!isRecord(value)) return "";
  return firstText(value.url, value.link, value.contact, value.email, value.phone);
}

function readStringList(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeLine).filter(Boolean).slice(0, limit);
}

function buildAdditionalLocationLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const lines: string[] = [];
  for (const item of value.slice(0, 6)) {
    if (!isRecord(item)) continue;
    const label = firstText(item.label, item.venue, "Additional location");
    const place = firstText(item.address, item.location);
    const time = firstText(item.timeText, item.time);
    const detail = [place, time].filter(Boolean).join(" — ");
    if (detail) lines.push(`${label}: ${detail}`);
  }
  return lines;
}

function buildFactLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const lines: string[] = [];
  for (const item of value.slice(0, 8)) {
    if (!isRecord(item)) continue;
    const label = firstText(item.label, item.name);
    const factValue = firstText(item.value, item.text, item.description);
    if (factValue) lines.push(label ? `${label}: ${factValue}` : factValue);
  }
  return lines;
}

function buildRegistryLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const lines: string[] = [];
  for (const item of value.slice(0, 6)) {
    if (!isRecord(item)) continue;
    const url = firstText(item.url, item.link);
    if (!url) continue;
    const label = firstText(item.label, item.name, "Registry");
    lines.push(`${label}: ${url}`);
  }
  return lines;
}

function buildDescription(data: JsonRecord, envitefyUrl: string, flyerUrl: string): string {
  const sections: string[] = [];
  const description = readText(data.description);
  if (description) sections.push(description);

  const details: string[] = [];
  const category = normalizeLine(data.category);
  const hostName = normalizeLine(data.hostName);
  const rsvpName = normalizeLine(data.rsvpName);
  const rsvp = readRsvp(data.rsvp);
  const rsvpDeadline = normalizeLine(data.rsvpDeadline);
  const attire = normalizeLine(data.attire);
  const goodToKnow = firstText(data.goodToKnow, data.thingsToDo);

  if (category) pushUniqueLine(details, `Category: ${category}`);
  if (hostName) pushUniqueLine(details, `Host: ${hostName}`);
  if (rsvp) {
    pushUniqueLine(details, `RSVP${rsvpName ? ` (${rsvpName})` : ""}: ${rsvp}`);
  }
  if (rsvpDeadline) pushUniqueLine(details, `RSVP by: ${rsvpDeadline}`);
  if (attire) pushUniqueLine(details, `Attire: ${attire}`);

  const activities = readStringList(data.activities);
  if (activities.length) pushUniqueLine(details, `Activities: ${activities.join(", ")}`);
  if (goodToKnow) pushUniqueLine(details, `Good to know: ${goodToKnow}`);
  for (const line of buildAdditionalLocationLines(data.additionalLocations)) {
    pushUniqueLine(details, line);
  }
  for (const line of buildFactLines(data.ocrFacts)) pushUniqueLine(details, line);
  for (const line of buildRegistryLines(data.registries)) pushUniqueLine(details, line);
  if (details.length) sections.push(details.join("\n"));

  if (flyerUrl) sections.push(`Flyer / invite: ${flyerUrl}`);
  const footer = `View on Envitefy:\n${envitefyUrl}`;
  const body = sections.join("\n\n");
  const availableBodyLength = Math.max(0, 12_000 - footer.length - 2);
  // The Envitefy event URL intentionally remains intact on the final line.
  return body ? `${body.slice(0, availableBodyLength)}\n\n${footer}` : footer;
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
    description: buildDescription(data, params.envitefyUrl, flyer?.sourceUrl || ""),
    recurrence: firstText(data.recurrence) || null,
    reminders: buildReminders(data.reminders),
    attachment: flyer
      ? { name: flyer.name, type: flyer.mimeType, dataUrl: flyer.sourceUrl }
      : null,
  };
  return { ok: true, value: { event, flyer } };
}

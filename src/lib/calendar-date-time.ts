const LOCAL_DATE_TIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?)?$/;
const EXPLICIT_OFFSET_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function readPartsInTimeZone(date: Date, timeZone: string): DateTimeParts | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const values = new Map(parts.map((part) => [part.type, Number(part.value)]));
    const result: DateTimeParts = {
      year: values.get("year") || 0,
      month: values.get("month") || 0,
      day: values.get("day") || 0,
      hour: values.get("hour") || 0,
      minute: values.get("minute") || 0,
      second: values.get("second") || 0,
    };
    return result.year && result.month && result.day ? result : null;
  } catch {
    return null;
  }
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function sameParts(left: DateTimeParts, right: DateTimeParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second
  );
}

function hasValidLeadingCalendarDate(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return true;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  return (
    normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() === month - 1 &&
    normalized.getUTCDate() === day
  );
}

export function normalizeCalendarTimeZone(value: string | null | undefined): string {
  const candidate = String(value || "").trim();
  if (!candidate) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date(0));
    return candidate;
  } catch {
    return "UTC";
  }
}

export function parseCalendarDateTimeToIso(
  value: string | null | undefined,
  timeZone: string | null | undefined,
): string | null {
  const input = String(value || "").trim();
  if (!input) return null;
  if (!hasValidLeadingCalendarDate(input)) return null;

  if (EXPLICIT_OFFSET_RE.test(input)) {
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const match = input.match(LOCAL_DATE_TIME_RE);
  if (!match) {
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const desired: DateTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] || 0),
    minute: Number(match[5] || 0),
    second: Number(match[6] || 0),
  };
  const zone = normalizeCalendarTimeZone(timeZone);
  const desiredAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
    desired.second,
  );
  let instantMs = desiredAsUtc;

  // Resolve the zone offset at the event instant. Repeating handles DST boundaries.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = readPartsInTimeZone(new Date(instantMs), zone);
    if (!observed) return null;
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
    );
    const adjustment = desiredAsUtc - observedAsUtc;
    instantMs += adjustment;
    if (adjustment === 0) break;
  }

  const resolved = new Date(instantMs);
  const resolvedParts = readPartsInTimeZone(resolved, zone);
  if (!resolvedParts || !sameParts(resolvedParts, desired)) {
    // Nonexistent local times (for example, during a DST jump) are not safe to auto-create.
    return null;
  }
  return resolved.toISOString();
}

export function formatCalendarDateInTimeZone(
  value: string | null | undefined,
  timeZone: string | null | undefined,
): string | null {
  const input = String(value || "").trim();
  if (!input) return null;
  if (!hasValidLeadingCalendarDate(input)) return null;
  const localMatch = input.match(LOCAL_DATE_TIME_RE);
  if (localMatch && !EXPLICIT_OFFSET_RE.test(input)) {
    return `${localMatch[1]}-${localMatch[2]}-${localMatch[3]}`;
  }
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  const parts = readPartsInTimeZone(parsed, normalizeCalendarTimeZone(timeZone));
  if (!parts) return null;
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function formatCalendarDateTimeInTimeZone(
  value: string | null | undefined,
  timeZone: string | null | undefined,
): string | null {
  const iso = parseCalendarDateTimeToIso(value, timeZone);
  if (!iso) return null;
  const parts = readPartsInTimeZone(new Date(iso), normalizeCalendarTimeZone(timeZone));
  if (!parts) return null;
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(
    parts.minute,
  )}:${pad(parts.second)}`;
}

export function addCalendarDays(dateValue: string, days: number): string | null {
  const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

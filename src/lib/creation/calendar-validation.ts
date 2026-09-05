import * as chrono from "chrono-node";

type ClockParts = { year: number; month: number; day: number; hour: number; minute: number };
function clockParts(date: Date, timezone: string): ClockParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const number = (key: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === key)?.value);
  return {
    year: number("year"),
    month: number("month"),
    day: number("day"),
    hour: number("hour"),
    minute: number("minute"),
  };
}
const utc = (parts: ClockParts) =>
  Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);

/** Reject nonexistent and repeated daylight-saving wall times instead of silently moving the event. */
export function localClockToIso(parts: ClockParts, timezone: string): string | null {
  const target = utc(parts);
  if (!Number.isFinite(target)) return null;
  try {
    const offsets = new Set(
      [-86400000, 0, 86400000].map(
        (delta) => utc(clockParts(new Date(target + delta), timezone)) - target - delta,
      ),
    );
    const candidates = [...offsets]
      .map((offset) => new Date(target - offset))
      .filter((date) => {
        const actual = clockParts(date, timezone);
        return Object.entries(parts).every(
          ([key, value]) => actual[key as keyof ClockParts] === value,
        );
      });
    return candidates.length === 1 ? candidates[0].toISOString() : null;
  } catch {
    return null;
  }
}

export function resolveScheduleCorrection(input: {
  dateText?: string | null;
  timeText?: string | null;
  previousStart?: string | null;
  previousEnd?: string | null;
  timezone: string;
}): { startISO: string; endISO: string | null } | null {
  try {
    const previous =
      input.previousStart && Number.isFinite(Date.parse(input.previousStart))
        ? clockParts(new Date(input.previousStart), input.timezone)
        : null;
    const dateText =
      input.dateText ||
      (previous
        ? `${previous.year}-${String(previous.month).padStart(2, "0")}-${String(previous.day).padStart(2, "0")}`
        : "");
    const timeText =
      input.timeText ||
      (previous ? `${previous.hour}:${String(previous.minute).padStart(2, "0")}` : "");
    if (!dateText || !timeText) return null;
    const parsed = chrono.parse(`${dateText} ${timeText}`, new Date(), { forwardDate: true })[0];
    if (!parsed || !parsed.start.isCertain("hour")) return null;
    const parts = parsed.start;
    const startISO = localClockToIso(
      {
        year: parts.get("year")!,
        month: parts.get("month")!,
        day: parts.get("day")!,
        hour: parts.get("hour")!,
        minute: parts.get("minute") || 0,
      },
      input.timezone,
    );
    if (!startISO) return null;
    const duration = Date.parse(input.previousEnd || "") - Date.parse(input.previousStart || "");
    const endISO =
      Number.isFinite(duration) && duration > 0
        ? new Date(Date.parse(startISO) + duration).toISOString()
        : null;
    return { startISO, endISO };
  } catch {
    return null;
  }
}

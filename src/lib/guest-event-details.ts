export type PublicGuestContent = {
  guestInstructions?: string[];
  requiredArtworkLines?: string[];
  giftNote?: string | null;
  giftPreferenceNote?: string | null;
  giftGuidance?: string | null;
};

export function publicGuestInstructions(details: PublicGuestContent | null | undefined): string[] {
  const lines = [
    ...(details?.guestInstructions || []),
    ...(details?.requiredArtworkLines || []),
    details?.giftNote, details?.giftPreferenceNote, details?.giftGuidance,
  ];
  const seen = new Set<string>();
  return lines.filter((line): line is string => typeof line === "string" && Boolean(line.trim()))
    .map((line) => line.trim())
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });
}

function comparable(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** Deduplicate the venue prefix while retaining rooms and the full street address. */
export function composeGuestLocation(venue?: string | null, address?: string | null): string {
  const first = venue?.trim() || "";
  const second = address?.trim() || "";
  if (!first) return second;
  if (!second) return first;
  const firstKey = comparable(first);
  const secondKey = comparable(second);
  if (secondKey === firstKey || secondKey.startsWith(`${firstKey} `)) return second;
  if (firstKey.startsWith(`${secondKey} `)) return first;
  return `${first}, ${second}`;
}

export function isPhysicalGuestLocation(location: string): boolean {
  const value = location.trim();
  return Boolean(value) && !/^(?:https?:\/\/|(?:online|virtual|remote|zoom|tbd|tba|to be announced|location to be announced)(?:\s|$))/i.test(value);
}

export function formatGuestClock(value?: string | null): string {
  const raw = value?.trim() || "";
  const clock = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!clock) return raw;
  const hour = Number(clock[1]);
  if (hour > 23 || Number(clock[2]) > 59) return raw;
  return `${hour % 12 || 12}:${clock[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

/** Display only: these strings must never be reparsed into authoritative facts. */
export function formatGuestSchedule(input: { eventDate?: string; startTime?: string; endTime?: string }): string {
  const rawDate = input.eventDate?.trim() || "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? new Date(`${rawDate}T12:00:00Z`) : null;
  const dateText = date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(date)
    : rawDate;
  const start = formatGuestClock(input.startTime);
  const end = formatGuestClock(input.endTime);
  const time = start && end && end !== start && !start.includes(end) ? `${start}–${end}` : start;
  return [dateText, time].filter(Boolean).join(" at ");
}

export function formatGuestScheduleFromInstants(start: string | null, end: string | null, timezone: string): string {
  if (!start || !Number.isFinite(Date.parse(start))) return "";
  try {
    const date = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: timezone }).format(new Date(start));
    const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone });
    const startTime = clock.format(new Date(start));
    const endTime = end && Number.isFinite(Date.parse(end)) ? clock.format(new Date(end)) : "";
    return `${date} at ${startTime}${endTime && endTime !== startTime ? `–${endTime}` : ""}`;
  } catch { return ""; }
}

export function isPropertyOpenHouse(details: {
  category?: string; occasion?: string; semanticKind?: string | null; listingUrl?: string;
  realtorName?: string; brokerageName?: string;
} | null | undefined): boolean {
  if (!details) return false;
  if (/school|education|community/.test(details.semanticKind || "")) return false;
  if (/real_estate|property/.test(details.semanticKind || "")) return true;
  if (details.listingUrl || details.realtorName || details.brokerageName) return true;
  const context = `${details.category || ""} ${details.occasion || ""}`;
  if (/\b(?:school|teacher|classroom|campus|student|families|kindergarten)\b/i.test(context)) return false;
  return /\b(?:real[ -]estate|property|realtor|listing|MLS|home tour)\b/i.test(context);
}

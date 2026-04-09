/** Guest-facing copy for live card "Event Details" tab. */

import {
  formatTimeLabelEn,
  formatWeekdayMonthDayOrdinalEn,
} from "@/utils/format-month-day-ordinal";

export type LiveCardDetailsLike = {
  category?: string;
  name?: string;
  age?: string;
  venueName?: string;
  location?: string;
  eventTitle?: string;
  eventDate?: string;
  startTime?: string;
};

function readTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function ageToOrdinalWord(ageRaw: string): string {
  const m = readTrim(ageRaw).match(/\d{1,3}/);
  if (!m) return "";
  const n = Number.parseInt(m[0], 10);
  if (!Number.isFinite(n) || n < 1 || n > 130) return "";
  return `${n}${ordinalSuffix(n)}`;
}

function honoreeFromDetails(
  details: LiveCardDetailsLike | null | undefined,
  cardTitle?: string,
): string {
  const fromForm = readTrim(details?.name);
  if (fromForm) return fromForm;
  const title = readTrim(cardTitle);
  if (title) {
    const possessive = title.match(/^(.+?)'s\s+Birthday\b/i);
    if (possessive) return possessive[1].trim();
  }
  return "";
}

/**
 * Opening line for Event Details: birthday = celebrate honoree's age at venue; other categories = generic invite + venue.
 */
export function buildLiveCardDetailsWelcomeMessage(
  details: LiveCardDetailsLike | null | undefined,
  cardTitle?: string,
): string | null {
  const category = readTrim(details?.category);
  const venue = readTrim(details?.venueName) || readTrim(details?.location);
  const eventDate = readTrim(details?.eventDate);
  const dateLabel = eventDate ? formatWeekdayMonthDayOrdinalEn(eventDate) : "";
  const timeLabel = formatTimeLabelEn(readTrim(details?.startTime));
  const dateBit = dateLabel ? ` on ${dateLabel}${timeLabel ? ` at ${timeLabel}` : ""}` : "";

  if (category === "Birthday") {
    const honoree = honoreeFromDetails(details, cardTitle);
    if (!honoree) return null;
    const ord = ageToOrdinalWord(readTrim(details?.age));
    const ageBit = ord ? `${ord} ` : "";
    if (venue) {
      return `Join us to celebrate ${honoree}'s ${ageBit}birthday at ${venue}${dateBit}.`;
    }
    return `Join us to celebrate ${honoree}'s ${ageBit}birthday${dateBit}!`.replace(
      "'s  birthday",
      "'s birthday",
    );
  }

  const headline =
    readTrim(details?.eventTitle) || readTrim(cardTitle) || readTrim(category) || "";
  if (venue && headline) {
    return `You're invited to ${headline} at ${venue}${dateBit}.`;
  }
  if (venue) {
    return `Join us at ${venue}${dateBit}.`;
  }
  if (headline) {
    return `We'd love for you to join us for ${headline}${dateBit}.`;
  }
  return null;
}

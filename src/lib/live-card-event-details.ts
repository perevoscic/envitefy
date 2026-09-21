/** Guest-facing copy for live card "Event Details" tab. */

import { formatGuestClock } from "./guest-event-details.ts";
import type { LiveCardLocationAction } from "./live-card-locations.ts";

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
 * Opening line for Event Details: keep this as invitation copy only. Venue and time are
 * rendered as structured rows in the live-card Overview panel.
 */
export function buildLiveCardDetailsWelcomeMessage(
  details: LiveCardDetailsLike | null | undefined,
  cardTitle?: string,
): string | null {
  const category = readTrim(details?.category);
  if (category === "Birthday") {
    const honoree = honoreeFromDetails(details, cardTitle);
    if (!honoree) return null;
    const ord = ageToOrdinalWord(readTrim(details?.age));
    const ageBit = ord ? `${ord} ` : "";
    return `Join us to celebrate ${honoree}'s ${ageBit}birthday.`.replace(
      "'s  birthday",
      "'s birthday",
    );
  }

  const headline =
    readTrim(details?.eventTitle) || readTrim(cardTitle) || readTrim(category) || "";
  if (headline) {
    return `We'd love for you to join us for ${headline}.`;
  }
  return null;
}

function copyKey(value: string): string {
  return value.toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\b(\d+)(?:st|nd|rd|th)\b/g, "$1")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const PLAN_ACTIVITY = /^(movie|film|dinner|lunch|brunch|breakfast|dessert|cake|pizza|drinks?|snacks?|meal|reception|after[- ]?party|ceremony|party) at (.+)$/i;

/** Read only explicit movie wording in public copy, never a theme or artwork prompt. */
function overviewMovieTitle(descriptions: string[]): string {
  const labeled = descriptions.join("\n").match(/\bmovie\s*:\s*["“]?([^\n.!?;"”]+?)(?=["”]|[\n.!?;]|$)/i);
  if (labeled) return labeled[1].trim();
  for (const description of descriptions) {
    const match = description.match(
      /\b(?:watch(?:ing)?|see(?:ing)?)\s+(?:(?:the\s+)?(?:movie|film)\s+)?["“]?([^\n.!?;]+?)(?=["”]|,?\s+(?:at|then|followed by|before|after|on)\b|[\n.!?;]|$)/i,
    );
    const title = match?.[1]?.replace(/[,\s]+$/g, "").trim() || "";
    if (title && !/^(?:(?:a|the)\s+)?(?:movie|film)$|^(?:you|everyone|each other|what|how|if|whether)\b/i.test(title)) return title;
  }
  return "";
}

/** Expand saved stops into a readable plan without adding times or activities. */
export function buildLiveCardOverviewPlan(input: {
  locations: LiveCardLocationAction[];
  startTime?: string;
  descriptions: string[];
}): string[] {
  const movieTitle = overviewMovieTitle(input.descriptions);
  const startTime = formatGuestClock(input.startTime);
  return input.locations.map((location, index) => {
    const match = location.label.match(PLAN_ACTIVITY);
    const activity = match?.[1]?.toLowerCase() || "";
    const venue = match?.[2] || location.label;
    const movie = /^(movie|film)$/.test(activity);
    const purpose = movie
      ? `to watch ${movieTitle || "a movie"}`
      : activity ? `for ${/^(ceremony|reception|party|after[- ]?party|meal)$/.test(activity) ? "the " : ""}${activity}` : "";
    if (location.source === "primary") {
      const meeting = [`We're meeting at ${venue}`, startTime ? `at ${startTime}` : "", purpose]
        .filter(Boolean).join(" ");
      return `${meeting}.`;
    }
    const previousActivity = input.locations[index - 1]?.label.match(PLAN_ACTIVITY)?.[1] || "";
    const transition = /^(movie|film)$/i.test(previousActivity) ? "After the movie" : "Then";
    // An additional location can have a custom label instead of an activity/venue pair.
    // Preserve that wording without turning a label such as "Pickup" into a place name.
    if (!match) return `${location.label}${/[.!?]$/.test(location.label) ? "" : "."}`;
    return `${transition}, we'll head to ${venue}${purpose ? ` ${purpose}` : ""}.`;
  });
}

/** Remove repeated invitation introductions, retaining actual plans and instructions. */
export function buildLiveCardOverviewNotes(input: {
  title: string;
  welcome?: string | null;
  descriptions: string[];
  instructions: string[];
  plan?: string[];
}): string[] {
  const introductionKey = (value: string) => copyKey(value)
    .replace(/^(?:join us (?:to celebrate|for)|wed love for you to join us for)\s+/, "")
    .replace(/\b(?:is|turning|birthday)\b/g, "")
    .replace(/\s+/g, " ").trim();
  const introductions = new Set([input.title, input.welcome || ""]
    .filter(Boolean).map(introductionKey));
  const seen = new Set((input.plan || []).map(copyKey));
  const movieTitle = overviewMovieTitle([...input.descriptions, ...input.instructions]);
  if (movieTitle && input.plan?.some((line) => line.includes(`to watch ${movieTitle}.`))) {
    seen.add(copyKey(`Movie: ${movieTitle}.`));
  }
  const notes: string[] = [];
  for (const text of [...input.descriptions, ...input.instructions]) {
    for (const paragraph of text.split(/\n+/)) {
      const sentences = paragraph.trim().split(/(?<=[.!?])\s+(?=[A-Z])/);
      const kept = sentences.filter((sentence) => {
        const key = copyKey(sentence);
        if (!key || introductions.has(introductionKey(sentence)) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (kept.length) notes.push(kept.join(" "));
    }
  }
  return notes;
}

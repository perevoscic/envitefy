import type { CustomEventCategory } from "../event-custom-design";
import { detectSportActivity } from "../sports-discovery/detect";
import { getSportActivityProfile, SPORT_ACTIVITY_PROFILES } from "../sports-discovery/profiles";

/** Categories the Create page can route to. Sports carry a separate sport key. */
export const CREATE_CATEGORIES = [
  "birthdays",
  "weddings",
  "anniversaries",
  "baby-showers",
  "bridal-showers",
  "gender-reveal",
  "appointments",
  "medical-appointments",
  "graduations",
  "housewarming",
  "open-house",
  "religious-events",
  "workshops",
  "special-events",
  "signup-forms",
  "sports",
  "general",
] as const;
export type CreateCategory = (typeof CREATE_CATEGORIES)[number];

export const CREATE_CATEGORY_LABELS: Record<CreateCategory, string> = {
  birthdays: "Birthday",
  weddings: "Wedding",
  anniversaries: "Anniversary",
  "baby-showers": "Baby shower",
  "bridal-showers": "Bridal shower",
  "gender-reveal": "Gender reveal",
  appointments: "Appointment",
  "medical-appointments": "Medical appointment",
  graduations: "Graduation",
  housewarming: "Housewarming",
  "open-house": "Open house",
  "religious-events": "Religious celebration",
  workshops: "Workshop",
  "special-events": "Special event",
  "signup-forms": "Sign-up form",
  sports: "Sports",
  general: "General event",
};

export const CREATE_SPORT_KEYS = SPORT_ACTIVITY_PROFILES.map((profile) => profile.key);

export type CreateConfidence = "high" | "low";
export type CreateGuess = { category: CreateCategory; sport: string | null };
export type CreateClassification = CreateGuess & {
  confidence: CreateConfidence;
  /** Other likely answers, most likely first, never repeating the main guess. */
  alternatives: CreateGuess[];
};

export function normalizeCreateCategory(value: unknown): CreateCategory | null {
  return typeof value === "string" && (CREATE_CATEGORIES as readonly string[]).includes(value)
    ? (value as CreateCategory)
    : null;
}

export function normalizeCreateSport(value: unknown): string | null {
  return getSportActivityProfile(typeof value === "string" ? value : null)?.key || null;
}

export function createGuessLabel(guess: CreateGuess): string {
  if (guess.category === "sports" && guess.sport) {
    return getSportActivityProfile(guess.sport)?.label || CREATE_CATEGORY_LABELS.sports;
  }
  return CREATE_CATEGORY_LABELS[guess.category];
}

const CATEGORY_SIGNALS: Array<{ category: Exclude<CreateCategory, "sports" | "general">; patterns: RegExp[] }> = [
  { category: "bridal-showers", patterns: [/\bbridal\s+shower\b/i] },
  { category: "medical-appointments", patterns: [/\b(?:medical|doctor|dentist|dental|clinic|hospital|ENT|pediatric|physical therapy)\b.{0,60}\b(?:appointment|appt|visit)\b/i, /\b(?:appointment|appt)\b.{0,60}\b(?:medical|doctor|dentist|clinic|hospital)\b/i] },
  { category: "appointments", patterns: [/\b(?:appointment|appt)\b/i] },
  { category: "graduations", patterns: [/\b(?:graduation|commencement|class of 20\d{2})\b/i] },
  { category: "housewarming", patterns: [/\bhouse\s*warming\b/i] },
  { category: "open-house", patterns: [/\bopen house\b/i] },
  { category: "religious-events", patterns: [/\b(?:baptism|christening|communion|bar mitzvah|bat mitzvah)\b/i] },
  { category: "workshops", patterns: [/\b(?:workshop|seminar)\b/i] },
  { category: "signup-forms", patterns: [/\b(?:sign[- ]?up (?:sheet|form)|volunteer (?:slots|shifts)|potluck sign[- ]?up)\b/i] },
  {
    category: "birthdays",
    patterns: [
      /\bbirthday\b/i,
      /\bb[- ]?day\b/i,
      /\bturns?\s+\d{1,3}\b/i,
      /\bturning\s+\d{1,3}\b/i,
      /\b\d{1,3}(?:st|nd|rd|th)\s+birthday\b/i,
      /\bquincea[nñ]era\b/i,
      /\bsweet\s+(?:16|sixteen)\b/i,
    ],
  },
  {
    category: "weddings",
    patterns: [
      /\bwedding\b/i,
      /\bnuptials\b/i,
      /\bbride\b/i,
      /\bgroom\b/i,
      /\bgetting married\b/i,
      /\bsave the date\b/i,
      /\bceremony and reception\b/i,
    ],
  },
  {
    category: "anniversaries",
    patterns: [/\banniversary\b/i, /\bvow renewal\b/i, /\byears together\b/i, /\bgolden jubilee\b/i],
  },
  {
    category: "baby-showers",
    patterns: [/\bbaby shower\b/i, /\bbaby sprinkle\b/i, /\bmom[- ]to[- ]be\b/i, /\bdiaper party\b/i, /\boh,? baby\b/i],
  },
  {
    category: "gender-reveal",
    patterns: [/\bgender reveal\b/i, /\bboy or girl\b/i, /\bhe or she\b/i, /\bpink or blue\b/i],
  },
];

/**
 * Fast, local classification for typed descriptions and pasted links. It is deliberately
 * conservative: anything short of a clear signal is "low" so the Create page asks one question.
 */
export function classifyCreateText(input: string): CreateClassification {
  // Treat URL punctuation as word breaks so paths like /football-schedule are read.
  const text = String(input || "").replace(/[/_.?=&#-]+/g, " ").replace(/\s+/g, " ").trim();
  const scores = new Map<CreateCategory, number>();
  for (const signal of CATEGORY_SIGNALS) {
    const score = signal.patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
    if (score) scores.set(signal.category, score * 5);
  }
  if (scores.has("medical-appointments")) scores.delete("appointments");
  if (scores.has("bridal-showers")) scores.delete("weddings");
  const sport = detectSportActivity({ text });
  // A sport needs an actual sport name (an alias), not generic words such as "session". It
  // weighs the same as one occasion signal, so "football birthday party" asks which is meant.
  const sportNamed = sport.source === "detected" && sport.reasons.some((reason) => reason.startsWith("Matched"));
  if (sportNamed) scores.set("sports", 5);

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const sportGuesses = (exclude: string | null): CreateGuess[] =>
    sportNamed
      ? [sport.profile, ...sport.alternatives.map((item) => item.profile)]
          .filter((key, index, all) => key !== exclude && all.indexOf(key) === index)
          .map((key) => ({ category: "sports" as const, sport: key }))
      : [];
  const guessFor = (category: CreateCategory): CreateGuess =>
    category === "sports" ? { category, sport: sport.profile } : { category, sport: null };

  if (!ranked.length) {
    return { category: "general", sport: null, confidence: "low", alternatives: [] };
  }
  const [topCategory, topScore] = ranked[0];
  const second = ranked[1]?.[1] || 0;
  const main = guessFor(topCategory);
  const sportsAmbiguous = topCategory === "sports" && sport.needsConfirmation;
  const alternatives = [
    ...(topCategory === "sports" ? sportGuesses(main.sport) : []),
    ...ranked.slice(1).flatMap(([category]) =>
      category === "sports" ? sportGuesses(null).slice(0, 2) : [guessFor(category)],
    ),
  ].slice(0, 3);
  return {
    ...main,
    confidence: topScore > second && !sportsAmbiguous ? "high" : "low",
    alternatives,
  };
}

/** The custom Event Page category used by Create with Envitefy and information uploads. */
export function customCategoryForGuess(guess: CreateGuess): CustomEventCategory {
  if (guess.category !== "sports") {
    if (["medical-appointments", "graduations", "housewarming", "open-house", "religious-events", "signup-forms"].includes(guess.category)) return "general";
    return guess.category as CustomEventCategory;
  }
  switch (guess.sport) {
    case "football":
      return "football";
    case "gymnastics":
      return "gymnastics";
    case "soccer":
      return "soccer";
    case "cheerleading":
      return "cheerleading";
    case "dance":
      return "dance-ballet";
    default:
      return "sport-events";
  }
}

export type CreateDiscoveryTarget = {
  workflow: "gymnastics" | "football" | "sports";
  activityProfile: string | null;
  builderHref: (eventId: string) => string;
};

/** Which schedule/meet import pipeline and builder handles a sport. */
export function discoveryTargetForSport(sport: string): CreateDiscoveryTarget {
  const key = normalizeCreateSport(sport);
  if (!key) throw new Error("Choose a supported sport before importing the event.");
  const params = (eventId: string, extra: Record<string, string> = {}) =>
    new URLSearchParams({ edit: eventId, new: "1", ...extra }).toString();
  if (key === "gymnastics") {
    return {
      workflow: "gymnastics",
      activityProfile: null,
      builderHref: (eventId) => `/event/gymnastics/customize?${params(eventId)}`,
    };
  }
  if (key === "football") {
    return {
      workflow: "football",
      activityProfile: null,
      builderHref: (eventId) => `/event/football/customize?${params(eventId)}`,
    };
  }
  return {
    workflow: "sports",
    activityProfile: key,
    builderHref: (eventId) => `/event/sport-events/customize?${params(eventId, { sport: key })}`,
  };
}

export function isLikelyUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

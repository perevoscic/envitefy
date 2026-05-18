import { attachAmazonAffiliateTag } from "@/lib/affiliate/amazon";
import type { LiveCardRsvpChoice } from "@/lib/live-card-rsvp";
import { resolveStudioImageFinishPreset } from "@/lib/studio/image-finish-presets";
import {
  type StudioGenerateApiResponse,
  type StudioGenerateMode,
  type StudioGenerateRequest,
  type StudioGenerateSurface,
} from "@/lib/studio/types";
import {
  formatMonthDayOrdinalEn,
  formatWeekdayMonthDayOrdinalEn,
} from "@/utils/format-month-day-ordinal";
import {
  EMPTY_POSITIONS,
  getStudioDefaultCallToAction,
  getStudioDefaultRsvpMessage,
  supportsStudioCategoryRsvp,
} from "./studio-workspace-field-config";
import type {
  EventDetails,
  InvitationData,
  InviteCategory,
  MediaItem,
  MediaType,
} from "./studio-workspace-types";
import {
  readString,
  STUDIO_GUEST_IMAGE_URL_MAX,
  STUDIO_OPEN_HOUSE_PROPERTY_IMAGE_URL_MAX,
  STUDIO_OPEN_HOUSE_REALTOR_IMAGE_URL_MAX,
  STUDIO_OPEN_HOUSE_REALTOR_LOGO_URL_MAX,
  sanitizeGuestImageUrls,
} from "./studio-workspace-utils";

export function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

export function formatDate(dateStr: string) {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  return `${month}.${day}.${year}`;
}

export function clean(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

const INTERNAL_INSTRUCTION_COPY_PATTERNS = [
  /\bUse the [^.]{1,80}? Envitefy template family\.?/gi,
  /\bPreserve the full event flow in the generated live card and guest-facing details\.?/gi,
  /\bGenerate website hero\/background artwork for the event page\.[^.]*\.?/gi,
  /\bDo not bake large title text[\s\S]*?in HTML\.?/gi,
  /\bAdditional event stops?:\s*/gi,
  /\b(?:change|replace|update|fix)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s+to\b[^.]*\.?/gi,
];

export function stripStudioInternalInstructions(value: string | null | undefined) {
  let stripped = clean(value);
  if (!stripped) return "";
  for (const pattern of INTERNAL_INSTRUCTION_COPY_PATTERNS) {
    stripped = stripped.replace(pattern, " ");
  }
  return stripped
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/(?:^|\s)[,.;:!?]+(?=\s|$)/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeDescriptionComparable(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(?:turning|turns|turned)\b/g, "turn")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(
      (token) =>
        token &&
        ![
          "a",
          "an",
          "are",
          "as",
          "celebrate",
          "for",
          "is",
          "join",
          "the",
          "they",
          "to",
          "us",
        ].includes(token),
    )
    .join(" ");
}

function pushUniqueDescriptionPart(parts: string[], value: string | null | undefined) {
  const next = stripStudioInternalInstructions(value);
  if (!next) return;
  const comparableNext = normalizeDescriptionComparable(next);
  if (
    parts.some((part) => {
      const comparablePart = normalizeDescriptionComparable(part);
      return (
        comparablePart === comparableNext ||
        comparablePart.includes(comparableNext) ||
        comparableNext.includes(comparablePart)
      );
    })
  ) {
    return;
  }
  parts.push(next);
}

const DESIGN_IDEA_HELPER_TEXT_PATTERN =
  /\bDescribe the visual\/theme direction for the invite(?:\. Flyer uploads can leave this blank if the flyer already sets the look)?\.?/gi;

export function sanitizeStudioDesignIdea(value: string | null | undefined) {
  const stripped = clean(value)
    .replace(/^\s*Design\s+Idea\b:?\s*/i, "")
    .replace(DESIGN_IDEA_HELPER_TEXT_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped;
}

export function pickFirst(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = clean(value);
    if (trimmed) return trimmed;
  }
  return "";
}

function toOrdinal(value: string): string {
  const parsed = Number.parseInt(clean(value), 10);
  if (!Number.isFinite(parsed)) return clean(value);
  const mod100 = parsed % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${parsed}th`;
  const mod10 = parsed % 10;
  if (mod10 === 1) return `${parsed}st`;
  if (mod10 === 2) return `${parsed}nd`;
  if (mod10 === 3) return `${parsed}rd`;
  return `${parsed}th`;
}

function buildBirthdayHeadline(details: EventDetails): string {
  const name = clean(details.name);
  const age = clean(details.age);
  if (name && /^\d+$/.test(age)) {
    return `${name}'s ${toOrdinal(age)} Birthday`;
  }
  if (name && age) {
    return `${name} Celebrates ${age}`;
  }
  if (name) {
    return `${name}'s Birthday`;
  }
  return "";
}

export function getDisplayTitle(details: EventDetails) {
  if (details.category === "Birthday") {
    return pickFirst(buildBirthdayHeadline(details), details.eventTitle, "Birthday Celebration");
  }
  if (details.category === "Wedding") {
    return pickFirst(
      details.eventTitle,
      details.coupleNames ? `${details.coupleNames} Wedding` : "",
      "Wedding Celebration",
    );
  }
  if (details.category === "Open House") {
    return pickFirst(
      details.eventTitle ? `Open House: ${details.eventTitle}` : "",
      details.location ? `Open House: ${details.location}` : "",
      "Open House",
    );
  }
  if (details.category === "Baby Shower") {
    return pickFirst(
      details.eventTitle,
      details.honoreeNames ? `${details.honoreeNames} Baby Shower` : "",
      "Baby Shower",
    );
  }
  if (details.category === "Anniversary") {
    return pickFirst(
      details.eventTitle,
      details.coupleNames ? `${details.coupleNames} Anniversary` : "",
      "Anniversary Celebration",
    );
  }
  if (details.category === "Bridal Shower") {
    return pickFirst(
      details.eventTitle,
      details.honoreeNames ? `${details.honoreeNames} Bridal Shower` : "",
      "Bridal Shower",
    );
  }
  if (details.category === "Housewarming") {
    return pickFirst(
      details.eventTitle,
      details.honoreeNames ? `${details.honoreeNames} Housewarming` : "",
      "Housewarming",
    );
  }
  if (details.category === "Game Day") {
    return pickFirst(
      details.eventTitle,
      buildGameDayMatchup(details),
      details.teamName,
      details.sportType ? `${details.sportType} Game Day` : "",
      "Game Day",
    );
  }
  return pickFirst(details.eventTitle, details.occasion, `${details.category} Event`);
}

export function getHonoreeName(details: EventDetails) {
  return pickFirst(
    details.category === "Open House" ? details.realtorName : "",
    details.name,
    details.coupleNames,
    details.honoreeNames,
    details.teamName,
    details.mainPerson,
    details.eventTitle,
  );
}

export function getAgeOrMilestone(details: EventDetails) {
  return pickFirst(details.age);
}

export function getStudioThemeLine(details: EventDetails) {
  if (details.category === "Birthday") {
    return pickFirst(
      sanitizeStudioDesignIdea(details.theme),
      details.activityNote,
      buildDescription(details),
      details.category,
    );
  }
  return pickFirst(
    buildDescription(details),
    sanitizeStudioDesignIdea(details.theme),
    details.category,
  );
}

export function buildStudioSubtitleFallback(details: EventDetails) {
  if (details.category === "Birthday") {
    return pickFirst(details.activityNote, details.calloutText, "Join us to celebrate.");
  }
  if (details.category === "Wedding") {
    return pickFirst(details.activityNote, "Save the date.");
  }
  if (details.category === "Baby Shower") {
    return pickFirst(details.activityNote, "Join us for a sweet celebration.");
  }
  if (details.category === "Bridal Shower") {
    return pickFirst(details.activityNote, "Join us for a bridal shower.");
  }
  if (details.category === "Open House") {
    return pickFirst(details.propertyHighlights, details.activityNote, "Tour this featured home.");
  }
  if (details.category === "Anniversary") {
    return pickFirst(details.activityNote, "Celebrate with us.");
  }
  if (details.category === "Housewarming") {
    return pickFirst(details.activityNote, "Join us for a housewarming.");
  }
  if (details.category === "Field Trip/Day") {
    return pickFirst(details.activityNote, "Get ready for our school outing.");
  }
  if (details.category === "Game Day") {
    return pickFirst(buildGameDayMatchup(details), details.activityNote, "Game day is here.");
  }
  return pickFirst(details.activityNote, details.calloutText, "You're invited.");
}

export function hasStudioSubjectReferencePhotos(details: EventDetails) {
  return (
    details.sourceMediaMode === "subjectPhotos" &&
    (sanitizeGuestImageUrls(details.guestImageUrls).length > 0 ||
      sanitizeGuestImageUrls(details.propertyImageUrls).length > 0 ||
      sanitizeGuestImageUrls(details.realtorImageUrls).length > 0 ||
      sanitizeGuestImageUrls(details.realtorLogoUrls).length > 0)
  );
}

export function getRegistryText(details: EventDetails) {
  if (details.category === "Open House") {
    return pickFirst(details.listingUrl ? "Listing details available." : "");
  }
  return pickFirst(
    details.giftPreferenceNote,
    details.giftNote,
    details.bringABookNote,
    details.registryLink ? "Registry available for guests." : "",
    "Your presence is the best gift.",
  );
}

export function hasRegistryContent(details: EventDetails) {
  return Boolean(
    clean(details.registryLink) ||
      clean(details.listingUrl) ||
      clean(details.giftPreferenceNote) ||
      clean(details.giftNote) ||
      clean(details.bringABookNote),
  );
}

export function getStudioRegistryLinkLabel(category: InviteCategory | string | null | undefined) {
  const normalized = readString(category).toLowerCase();
  return normalized === "birthday" || normalized === "birthdays" || normalized === "housewarming"
    ? "Gift List"
    : "Registry";
}

export function accentClassForStudioRsvpChoice(choice: LiveCardRsvpChoice["key"]) {
  if (choice === "yes") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (choice === "no") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function getAbsoluteShareUrl(sharePath: string): string {
  if (typeof window === "undefined") return sharePath;
  return new URL(sharePath, window.location.origin).toString();
}

export function svgThumbnail(label: string, from: string, to: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="720" height="960" rx="56" fill="url(#g)" />
      <circle cx="610" cy="120" r="96" fill="rgba(255,255,255,0.18)" />
      <circle cx="120" cy="810" r="120" fill="rgba(255,255,255,0.12)" />
      <rect x="76" y="92" width="568" height="776" rx="44" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.35)" />
      <text x="92" y="640" fill="white" font-size="70" font-family="Arial, sans-serif" font-weight="700">${label}</text>
      <text x="92" y="718" fill="rgba(255,255,255,0.82)" font-size="26" font-family="Arial, sans-serif">Envitefy Studio</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getFallbackThumbnail(details: EventDetails) {
  return svgThumbnail(getDisplayTitle(details), "#111827", "#7c3aed");
}

export const COMMON_GIRL_BIRTHDAY_NAMES = new Set([
  "ava",
  "bella",
  "charlotte",
  "chloe",
  "ella",
  "emma",
  "eva",
  "grace",
  "harper",
  "isabella",
  "lara",
  "layla",
  "lily",
  "lucy",
  "mia",
  "olivia",
  "sophia",
  "zoe",
]);

export const COMMON_BOY_BIRTHDAY_NAMES = new Set([
  "alex",
  "ben",
  "charlie",
  "daniel",
  "ethan",
  "henry",
  "jack",
  "james",
  "leo",
  "liam",
  "logan",
  "lucas",
  "mason",
  "noah",
  "oliver",
  "owen",
  "theo",
  "wyatt",
]);

export function normalizeBirthdayFirstName(nameValue: string): string {
  const [firstName = ""] = readString(nameValue).split(/[\s-]+/);
  return firstName.replace(/[^a-z]/gi, "").toLowerCase();
}

export function inferBirthdayGenderFromName(nameValue: string): EventDetails["gender"] | null {
  const normalized = normalizeBirthdayFirstName(nameValue);
  if (!normalized) return null;
  if (COMMON_GIRL_BIRTHDAY_NAMES.has(normalized)) return "Girl";
  if (COMMON_BOY_BIRTHDAY_NAMES.has(normalized)) return "Boy";
  if (/(ella|emma|enna|ette|ia|ina|isha|la|lina|lyn|lynn|ria|ssa|yah|yn)$/.test(normalized)) {
    return "Girl";
  }
  if (/(son|ton|den|iel|ias|ard|ert|rick|aldo|enzo|ian|ias|o|on)$/.test(normalized)) {
    return "Boy";
  }
  return null;
}

export const STUDIO_IDEA_CATEGORY_LABELS: Record<InviteCategory, string> = {
  Birthday: "Birthday",
  Wedding: "Wedding",
  "Baby Shower": "Baby Shower",
  "Open House": "Open House",
  Anniversary: "Anniversary",
  "Bridal Shower": "Bridal Shower",
  Housewarming: "Housewarming",
  "Field Trip/Day": "Field Trip",
  "Game Day": "Game Day",
  "Custom Invite": "Custom Invite",
};

const STUDIO_DESIGN_IDEA_CATEGORY_PLACEHOLDERS: Partial<Record<InviteCategory, string>> = {
  Birthday:
    "e.g. A bold superhero-and-dino party with comic-book energy, bright primaries, and playful lighting.",
  "Open House":
    "e.g. A premium realtor flyer with a luxury property photo collage, refined typography, and logo-free editorial polish.",
};

export function getStudioDesignIdeaPlaceholder(category: InviteCategory) {
  const override = STUDIO_DESIGN_IDEA_CATEGORY_PLACEHOLDERS[category];
  if (override) return override;
  const label = STUDIO_IDEA_CATEGORY_LABELS[category];
  return `e.g. A ${label.toLowerCase()} invite with the colors, mood, texture, and visual direction you want...`;
}

export function getStudioEventDetailsPlaceholder(category: InviteCategory) {
  if (category === "Birthday") {
    return "e.g. Join us for pizza, cake, arcade games, and birthday fun.";
  }
  if (category === "Wedding") {
    return "e.g. Dinner and dancing follow the ceremony. Cocktail attire encouraged.";
  }
  if (category === "Open House") {
    return "e.g. Renovated kitchen, bright primary suite, pool, garage parking, and easy self-guided tour route.";
  }
  if (category === "Game Day") {
    return "e.g. Gates open at 6:00 PM. Wear blue and gold and arrive early for parking.";
  }
  return "e.g. Add anything guests should know.";
}

export function getThemeColors(details: EventDetails) {
  if (details.category === "Birthday") {
    return { primaryColor: "#9333ea", accentColor: "#ec4899" };
  }
  if (details.category === "Wedding") {
    return { primaryColor: "#111827", accentColor: "#f59e0b" };
  }
  if (details.category === "Baby Shower") {
    return { primaryColor: "#60a5fa", accentColor: "#f472b6" };
  }
  if (details.category === "Game Day") {
    return { primaryColor: "#0f172a", accentColor: "#f59e0b" };
  }
  if (details.category === "Open House") {
    return { primaryColor: "#1f2937", accentColor: "#0f766e" };
  }
  return { primaryColor: "#111827", accentColor: "#7c3aed" };
}

function buildGameDayMatchup(details: EventDetails) {
  const team = clean(details.teamName);
  const opponent = clean(details.opponentName);
  if (team && opponent) return `${team} vs ${opponent}`;
  return pickFirst(team, opponent);
}

function containsRsvpLanguage(value: string): boolean {
  return /\brsvp\b/i.test(value);
}

export function resolveStudioCallToAction(
  details: EventDetails,
  ...candidates: Array<string | null | undefined>
): string {
  const categorySupportsRsvp = supportsStudioCategoryRsvp(details.category);
  for (const candidate of candidates) {
    const next = clean(candidate);
    if (!next) continue;
    if (!categorySupportsRsvp && containsRsvpLanguage(next)) continue;
    return next;
  }
  return getStudioDefaultCallToAction(details.category);
}

export function resolveStudioRsvpMessage(
  details: EventDetails,
  ...candidates: Array<string | null | undefined>
): string {
  const categorySupportsRsvp = supportsStudioCategoryRsvp(details.category);
  for (const candidate of candidates) {
    const next = clean(candidate);
    if (!next) continue;
    if (!categorySupportsRsvp && containsRsvpLanguage(next)) continue;
    return next;
  }
  return getStudioDefaultRsvpMessage(details.category);
}

function buildGameDayContextNotes(details: EventDetails): string[] {
  if (details.category !== "Game Day") return [];

  const matchup = buildGameDayMatchup(details);
  return [
    clean(details.sportType) ? `Sport: ${clean(details.sportType)}.` : "",
    matchup ? `Matchup: ${matchup}.` : "",
    clean(details.leagueDivision) ? `League / Division: ${clean(details.leagueDivision)}.` : "",
    clean(details.broadcastInfo) ? `Broadcast / Stream: ${clean(details.broadcastInfo)}.` : "",
    clean(details.parkingInfo) ? `Parking / Arrival: ${clean(details.parkingInfo)}.` : "",
  ].filter(Boolean);
}

function buildOpenHouseContextNotes(details: EventDetails): string[] {
  if (details.category !== "Open House") return [];

  return [
    clean(details.propertyPrice) ? `Price: ${clean(details.propertyPrice)}.` : "",
    clean(details.bedrooms) ? `Bedrooms: ${clean(details.bedrooms)}.` : "",
    clean(details.bathrooms) ? `Bathrooms: ${clean(details.bathrooms)}.` : "",
    clean(details.squareFootage) ? `Square Feet: ${clean(details.squareFootage)}.` : "",
    clean(details.neighborhood) ? `Neighborhood: ${clean(details.neighborhood)}.` : "",
    clean(details.propertyHighlights)
      ? `Property highlights: ${clean(details.propertyHighlights)}.`
      : "",
    clean(details.parkingInfo) ? `Parking / Access: ${clean(details.parkingInfo)}.` : "",
  ].filter(Boolean);
}

export function buildDescription(details: EventDetails) {
  const parts: string[] = [];
  pushUniqueDescriptionPart(parts, details.detailsDescription);
  pushUniqueDescriptionPart(parts, details.message);
  pushUniqueDescriptionPart(parts, details.activityNote);
  pushUniqueDescriptionPart(parts, details.calloutText);
  for (const note of buildGameDayContextNotes(details)) pushUniqueDescriptionPart(parts, note);
  for (const note of buildOpenHouseContextNotes(details)) pushUniqueDescriptionPart(parts, note);
  return stripStudioInternalInstructions(parts.join(" "));
}

export function buildLinks(details: EventDetails) {
  return [
    details.ticketsLink ? { label: "Tickets", url: details.ticketsLink } : null,
    details.listingUrl ? { label: "Listing", url: details.listingUrl } : null,
    details.registryLink
      ? { label: getStudioRegistryLinkLabel(details.category), url: details.registryLink }
      : null,
    details.weddingWebsite ? { label: "Website", url: details.weddingWebsite } : null,
    details.optionalLink ? { label: "Event Link", url: details.optionalLink } : null,
  ].filter((value): value is { label: string; url: string } => Boolean(value));
}

function buildStudioThemeFramingGuidance(details: EventDetails) {
  const categoryThemeFraming: Record<InviteCategory, string> = {
    Birthday:
      "Interpret the user's theme words as a birthday-party version of that idea, not a generic standalone scene. If the user says Jurassic Park, make it feel like a Jurassic Park birthday party with birthday decor such as balloons, cake, candles, wrapped gifts, themed desserts, party tablescapes, and celebration energy instead of only jungle scenery or dinosaurs. Let the honoree name, age or milestone, and venue type shape the scene when those details are available so the result feels personalized rather than generic.",
    Wedding:
      "Interpret the user's theme words as a wedding or save-the-date version of that idea, with ceremony, reception, stationery, floral, and romantic celebration cues instead of generic scenery. Let venue type, floral direction, and formality cues steer the setting, and do not inflate a single-evening event into an unsupported wedding-weekend concept.",
    "Open House":
      "Interpret the user's theme words as a premium real-estate open house flyer version of that idea, with listing photography, architectural composition, logo-free editorial typography, and buyer-facing property marketing. Make it feel like a polished luxury listing flyer, not a housewarming party invite.",
    "Baby Shower":
      "Interpret the user's theme words as a baby-shower version of that idea, with baby-shower decor, favors, dessert-table styling, and welcoming celebration cues instead of generic scenery. If the theme implies a mascot such as teddy bears, moons, clouds, or animals, keep the motif restrained and design-led instead of filling the room with repeated plush props.",
    "Bridal Shower":
      "Interpret the user's theme words as a bridal-shower version of that idea, with bridal-party decor, gift-table, brunch or tea-party styling, and elevated celebration cues instead of generic scenery. Favor one polished hosted moment, such as a brunch table or tea service, instead of a collage of repeated garden scenes.",
    Anniversary:
      "Interpret the user's theme words as an anniversary celebration version of that idea, with couple-focused party styling, elegant decor, and relationship-celebration cues instead of generic scenery. If the milestone implies a traditional material or palette such as silver or gold, let that influence the decor and color story.",
    Housewarming:
      "Interpret the user's theme words as a housewarming celebration version of that idea, with welcoming home-party decor, hosting details, and lived-in gathering cues instead of generic scenery. Let the home style and hosting style shape the scene so it feels like a real gathering instead of an empty real-estate rendering.",
    "Field Trip/Day":
      "Interpret the user's theme words as a school-event or field-trip invitation version of that idea, with organized group-activity cues, age-appropriate school styling, and event-planning details instead of generic scenery. Prioritize destination realism, believable architecture, and documentary school-trip credibility over theme-park stylization. Frame it as an upcoming educational visit rather than a souvenir or tourism poster, and avoid making one specific student group feel like they authored the invite unless reference photos were provided.",
    "Game Day":
      "Interpret the user's theme words as a real game-day invitation version of that idea, with matchup energy, stadium or arena atmosphere, crowd cues, pep-rally or game-night styling, and sports-event presentation instead of generic sports photography or a random action shot. When team, opponent, or school colors are present, use them to make the scene feel specific without inventing logos, mascots, or branded signage.",
    "Custom Invite":
      "Interpret the user's theme words as an invitation-worthy celebration or hosted-event version of that idea. Do not leave it as generic scenery alone; add event styling, decor, and hosting cues so it clearly reads as an invitation. Let the event purpose and host identity do more work than the venue aesthetic so the concept does not collapse into a generic mood board.",
  };

  return categoryThemeFraming[details.category];
}

function splitStudioVisualExclusionTerms(value: string): string[] {
  return value
    .split(/\s+(?:and|or)\s+|\/|&/i)
    .map((item) =>
      clean(item)
        .replace(/^(?:all|any|the|a|an|every)\s+/i, "")
        .replace(/\s+(?:from|in|on|at|with|near|around|behind|inside)\b[\s\S]*$/i, ""),
    )
    .filter((item) => item.length >= 2 && item.length <= 60);
}

function extractStudioVisualExclusions(value: string): string[] {
  const text = clean(value);
  if (!text) return [];

  const exclusions: string[] = [];
  const patterns = [
    /\b(?:remove|delete|erase|eliminate|exclude|omit)\s+([^,.;\n]+)/gi,
    /\b(?:no|without)\s+([^,.;\n]+)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      exclusions.push(...splitStudioVisualExclusionTerms(match[1] || ""));
    }
  }

  return Array.from(new Set(exclusions.map((item) => item.toLowerCase())));
}

export function buildStudioVisualDirection(details: EventDetails) {
  const customIdea = sanitizeStudioDesignIdea(details.theme);
  const extraPreferences = clean(details.visualPreferences);
  const eventDetails = clean(details.detailsDescription);
  const combinedDirection = [customIdea, extraPreferences].filter(Boolean).join(". ");
  const instructions: string[] = [];
  const visualExclusions = extractStudioVisualExclusions(combinedDirection);

  if (combinedDirection) {
    instructions.push(
      `Highest-priority private visual direction from the user: ${combinedDirection}.`,
    );
    instructions.push(
      "Apply the Design Idea to artwork, palette, composition, mood, and themeStyle while still expressing the selected category clearly.",
    );
    instructions.push(buildStudioThemeFramingGuidance(details));
    if (eventDetails) {
      instructions.push(
        "Use Event Details as the source for guest-facing specificity, invitation copy, and factual grounding. Do not let Design Idea-only nouns become visible copy.",
      );
    }
  }

  if (visualExclusions.length > 0) {
    instructions.push(
      `Hard visual exclusions from the Design Idea: do not include these requested excluded visual elements anywhere in the artwork: ${visualExclusions.join(", ")}.`,
    );
    instructions.push(
      "Treat requested exclusions as higher priority than existing image content, themeStyle metadata, supporting context, or other visual direction. Replace excluded elements with category-appropriate decor and background details that do not contain the excluded elements.",
    );
  }

  if (
    /\b(realistic|photorealistic|photo[- ]?realistic|lifelike|naturalistic|real life)\b/i.test(
      combinedDirection,
    )
  ) {
    instructions.push(
      "Render subjects realistically with natural anatomy, realistic fur or skin texture, believable lighting, and real-world proportions.",
    );
    instructions.push(
      "Do not turn realistic subjects into cartoons, mascots, plush characters, anime, or anthropomorphic figures unless the user explicitly asks for that.",
    );
  }

  return instructions.join(" ");
}

export function buildStudioCategoryGuardrails(details: EventDetails) {
  const categoryPromptByType: Record<InviteCategory, string> = {
    Birthday:
      "Generate a birthday invitation image. Keep the composition, props, mood, and styling clearly birthday-focused.",
    Wedding:
      "Generate a wedding invitation image. Keep the composition, props, mood, and styling clearly wedding-focused.",
    "Open House":
      "Generate a premium real-estate open house flyer image. Keep the composition, typography, photo hierarchy, and styling clearly realtor/listing-focused.",
    "Baby Shower":
      "Generate a baby shower invitation image. Keep the composition, props, mood, and styling clearly baby-shower-focused.",
    "Bridal Shower":
      "Generate a bridal shower invitation image. Keep the composition, props, mood, and styling clearly bridal-shower-focused.",
    Anniversary:
      "Generate an anniversary invitation image. Keep the composition, props, mood, and styling clearly anniversary-focused.",
    Housewarming:
      "Generate a housewarming invitation image. Keep the composition, props, mood, and styling clearly housewarming-focused.",
    "Field Trip/Day":
      "Generate a field trip or school day invitation image. Keep the composition, props, mood, and styling clearly school-event-focused.",
    "Game Day":
      "Generate a game day invitation image. Keep the composition, props, mood, and styling clearly sports-event-focused.",
    "Custom Invite":
      "Generate an invitation image that fits the provided event details exactly and do not drift into a different celebration type.",
  };

  const categorySpecificGuardrailsByType: Record<InviteCategory, string[]> = {
    Birthday: [
      "Use honoree name, age or milestone, and venue context when present so the image feels like a real hosted birthday instead of a generic theme scene.",
      "If the venue implies a theater, arcade, restaurant, park, or backyard, reflect that type of place without inventing brand signage or unsupported architectural details.",
    ],
    Wedding: [
      "Use venue type, floral direction, and formality cues to make the invitation feel like a credible ceremony, reception, or save-the-date rather than generic romance imagery.",
      "Do not imply a full wedding weekend, destination takeover, or extra wedding events unless the user supplied those details.",
    ],
    "Open House": [
      "Treat uploaded property photos as the main source material for the poster. With 1 house photo, use it as a large editorial hero. With 2 house photos, use one dominant hero plus one refined secondary inset. With 3-5 house photos, create a premium real-estate collage with one dominant exterior or best interior photo and smaller supporting images.",
      "Treat an uploaded realtor photo as app-only Realtor tab material; do not direct the image generator to place the headshot/person inside the flyer artwork.",
      "Use listing facts exactly as supplied: address, date/time, price, beds, baths, square footage, neighborhood, brokerage, license, and contact details must not be invented.",
      "Use clean premium listing typography, architectural spacing, strong hierarchy, and logo-free real-estate editorial polish rather than cozy housewarming decor.",
    ],
    "Baby Shower": [
      "Keep theme mascots or motifs restrained and premium; one strong teddy-bear or nursery motif is better than a cluttered room full of repeated props.",
      "Use balloon styling, gift-table cues, florals, and palette to make the shower feel designed rather than crowded.",
    ],
    "Bridal Shower": [
      "Favor one polished brunch, tea, or gift-table moment over collage-like repeated setups.",
      "Use bride-focused hosting cues, florals, pastries, table styling, and venue type to make the shower feel premium and specific.",
    ],
    Anniversary: [
      "If the milestone maps to a traditional anniversary palette or material, let that influence decor and color choices.",
      "Use dinner, toast, dancing, or live-music cues when supported so the scene reads as an anniversary celebration rather than generic roses-and-candles decor.",
    ],
    Housewarming: [
      "Make the home feel warm, hosted, and lived-in with food, drinks, seating, and welcoming gathering cues rather than a sterile real-estate showcase.",
      "Use home style and hosting style to shape the scene without inventing unsupported luxury details.",
    ],
    "Field Trip/Day": [
      "Prioritize believable architecture, destination realism, and documentary group-activity staging.",
      "Use teacher or docent cues, age-appropriate students, and organized outing energy so the image reads as a real school event.",
      "Keep the concept future-facing and destination-led; do not imply that the pictured students designed, printed, or are personally presenting the invitation.",
    ],
    "Game Day": [
      "Use the provided sport details to steer the field, court, arena, rink, or ballpark atmosphere without inventing branding.",
      "When team, opponent, or school colors are provided, use them to make the scene feel specific and guest-useful.",
      "Do not hallucinate team logos, mascots, scoreboard text, jersey numbers, sponsor marks, branded venue signage, or specific players.",
    ],
    "Custom Invite": [
      "Keep the event purpose and host identity legible in the concept so appreciation nights, socials, dinners, and launches do not flatten into a generic venue mood board.",
      "Use hosted-event cues and clean invitation composition instead of treating the request like a poster for a place alone.",
    ],
  };

  const categorySpecificGuardrails = categorySpecificGuardrailsByType[details.category] ?? [];

  return [
    categoryPromptByType[details.category],
    "You may add generic category-appropriate celebration decor and styling cues when needed to make the selected event type obvious, as long as they do not introduce factual claims.",
    ...categorySpecificGuardrails,
    "Do not hallucinate specific people, animals, venue features, branded signage, logos, copyrighted character costumes, named activities, dates, times, or other factual details that are not supported by the event details or the user's visual direction.",
    "If an important visual detail is missing, keep it generic and restrained instead of inventing specifics.",
    "Any visible wording must match the provided event details exactly. Never fabricate names, phone numbers, addresses, schedules, or event copy.",
  ].join(" ");
}

export function isPosterFirstLiveCardCategory(category: string | null | undefined) {
  const normalized = clean(category).toLowerCase();
  return normalized === "birthday" || normalized === "wedding" || normalized === "open house";
}

export function resolveStudioGenerationSurface(
  details: EventDetails,
  type: MediaType,
  options?: { existingItemType?: MediaType | null },
): StudioGenerateSurface {
  if (type === "image") return "image";
  if (options?.existingItemType === "page") return "page";
  return "page";
}

export function getStudioEventYear(details: EventDetails): string {
  const match = getStudioEventDate(details).match(/^(\d{4})/);
  return match?.[1] || "";
}

function inferStudioMonthDayIsoDate(value: string, now = new Date()): string {
  const trimmed = readString(value);
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const monthDayMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!monthDayMatch) return trimmed;

  const month = Number.parseInt(monthDayMatch[1] || "", 10);
  const day = Number.parseInt(monthDayMatch[2] || "", 10);
  if (!Number.isInteger(month) || !Number.isInteger(day)) return trimmed;

  const currentYear = now.getFullYear();
  const candidateThisYear = new Date(Date.UTC(currentYear, month - 1, day));
  if (
    candidateThisYear.getUTCFullYear() !== currentYear ||
    candidateThisYear.getUTCMonth() !== month - 1 ||
    candidateThisYear.getUTCDate() !== day
  ) {
    return trimmed;
  }

  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  const todayKey = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const candidateKey = `${currentYear}-${paddedMonth}-${paddedDay}`;
  const resolvedYear = candidateKey < todayKey ? currentYear + 1 : currentYear;
  return `${resolvedYear}-${paddedMonth}-${paddedDay}`;
}

function shouldIncludeStudioEventYear(details: EventDetails): boolean {
  return details.category === "Wedding";
}

function formatStudioPromptDate(details: EventDetails): string {
  const rawDate = getStudioEventDate(details);
  if (shouldIncludeStudioEventYear(details)) return rawDate;
  const match = rawDate.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!match) return rawDate;
  return `${match[1]}/${match[2]}`;
}

function formatVisibleCardTime(timeValue: string): string {
  const trimmed = clean(timeValue);
  if (!trimmed) return "";
  const twentyFourHourMatch = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1]);
    const minute = twentyFourHourMatch[2];
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
  }
  return trimmed.replace(/\s*([AaPp][Mm])$/, (_, meridiem: string) => ` ${meridiem.toUpperCase()}`);
}

function formatStudioVisibleDate(details: EventDetails): string {
  if (shouldIncludeStudioEventYear(details)) {
    return formatWeekdayMonthDayOrdinalEn(getStudioEventDate(details), {
      includeComma: false,
    });
  }
  const rawDate = formatStudioPromptDate(details);
  const match = rawDate.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return rawDate;
  return formatMonthDayOrdinalEn(
    `2000-${String(match[1] || "").padStart(2, "0")}-${String(match[2] || "").padStart(2, "0")}`,
  );
}

export function buildDeterministicScheduleLine(details: EventDetails): string {
  const date = formatStudioVisibleDate(details);
  const time = formatVisibleCardTime(getStudioEventStartTime(details));
  if (date && time) return `${date} at ${time}`;
  return date;
}

function quoteStudioEditText(value: string): string {
  return `"${value.replace(/"/g, "'")}"`;
}

function buildExistingImageEditInstruction(
  details: EventDetails,
  refinement: string,
  previousDetails?: EventDetails,
): string {
  const instructions: string[] = [];
  const previousDate = previousDetails ? formatStudioVisibleDate(previousDetails) : "";
  const nextDate = formatStudioVisibleDate(details);
  const previousTime = previousDetails
    ? formatVisibleCardTime(getStudioEventStartTime(previousDetails))
    : "";
  const nextTime = formatVisibleCardTime(getStudioEventStartTime(details));
  const previousScheduleLine = previousDetails
    ? buildDeterministicScheduleLine(previousDetails)
    : "";
  const nextScheduleLine = buildDeterministicScheduleLine(details);
  const previousVisibleLocation = previousDetails
    ? resolveLiveCardVisibleLocationLine(previousDetails, previousDetails.location)
    : "";
  const nextVisibleLocation = resolveLiveCardVisibleLocationLine(details, details.location);
  const previousStreetAddress = previousDetails ? clean(previousDetails.location) : "";

  if (previousTime && nextTime && previousTime !== nextTime && previousDate === nextDate) {
    instructions.push(
      `Replace only the existing visible time text ${quoteStudioEditText(previousTime)} with ${quoteStudioEditText(nextTime)}.`,
    );
    instructions.push(
      "If the old and new time differ by only one or two characters, modify only those characters inside the existing time label.",
    );
    instructions.push("Do not change the visible date, title, venue, icons, artwork, or layout.");
  } else if (previousDate && nextDate && previousDate !== nextDate && previousTime === nextTime) {
    instructions.push(
      `Replace only the existing visible date text ${quoteStudioEditText(previousDate)} with ${quoteStudioEditText(nextDate)}.`,
    );
    instructions.push("Do not change the visible time, title, venue, icons, artwork, or layout.");
  } else if (
    previousScheduleLine &&
    nextScheduleLine &&
    previousScheduleLine !== nextScheduleLine
  ) {
    instructions.push(
      `Replace only the existing visible date/time line ${quoteStudioEditText(previousScheduleLine)} with ${quoteStudioEditText(nextScheduleLine)}.`,
    );
    instructions.push(
      "Use the replacement text exactly as written; do not convert it to numeric date format.",
    );
  }

  if (
    nextVisibleLocation &&
    previousVisibleLocation &&
    previousVisibleLocation !== nextVisibleLocation
  ) {
    instructions.push(
      `Replace the visible place/location chip or line ${quoteStudioEditText(previousVisibleLocation)} with ${quoteStudioEditText(nextVisibleLocation)}.`,
    );
    instructions.push(
      "Do not print the street address in the visible artwork; keep the address only for maps and calendar metadata.",
    );
  }
  if (
    nextVisibleLocation &&
    previousStreetAddress &&
    previousStreetAddress !== nextVisibleLocation &&
    looksLikeStreetAddress(previousStreetAddress)
  ) {
    instructions.push(
      `If the artwork currently shows the street address ${quoteStudioEditText(previousStreetAddress)}, replace that visible place text with ${quoteStudioEditText(nextVisibleLocation)}.`,
    );
    instructions.push(
      "Do not print the street address in the visible artwork; keep the address only for maps and calendar metadata.",
    );
  }

  if (refinement) {
    instructions.push(`Apply only this requested edit: ${refinement}.`);
    instructions.push(
      "The returned image must visibly reflect that requested edit; do not return the source image unchanged.",
    );
    instructions.push(
      "If the target is ambiguous, choose the most visually matching subject or prop and keep the edit localized there.",
    );
  }

  if (instructions.length === 0) {
    instructions.push("Preserve the existing live-card image exactly.");
  }

  instructions.push(
    "Do not redesign, recompose, regenerate, crop, zoom, restyle, or rewrite any other part of the image.",
  );
  instructions.push(
    "Keep all other visible text, photos, listing facts, icons, logos, stats, bottom image strips, layout, lighting, colors, and spacing unchanged.",
  );

  return instructions.join(" ");
}

function buildDeterministicLocationLine(details: EventDetails): string {
  if (details.category === "Open House") {
    return pickFirst(details.location, details.eventTitle, "Property location TBD");
  }
  return pickFirst(
    details.venueName,
    details.ceremonyVenue,
    details.receptionVenue,
    details.location,
    "Location TBD",
  );
}

function normalizeLocationComparable(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,]/g, "");
}

function looksLikeStreetAddress(value: string): boolean {
  return (
    /^\d{1,6}\s+\S+/.test(value.trim()) ||
    /\b(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|boulevard|blvd|court|ct|circle|cir|way|place|pl)\b/i.test(
      value,
    )
  );
}

export function resolveLiveCardVisibleLocationLine(
  details: EventDetails,
  previousLocationLine?: string | null,
): string {
  const fallback = buildDeterministicLocationLine(details);
  if (details.category === "Open House") return clean(previousLocationLine) || fallback;

  const venue = pickFirst(details.venueName, details.ceremonyVenue, details.receptionVenue);
  const previous = clean(previousLocationLine);
  if (!venue) return previous || fallback;
  if (!previous) return venue;

  const normalizedPrevious = normalizeLocationComparable(previous);
  const normalizedAddress = normalizeLocationComparable(clean(details.location));
  const normalizedVenue = normalizeLocationComparable(venue);

  if (normalizedPrevious === normalizedVenue) return venue;
  if (normalizedAddress && normalizedPrevious === normalizedAddress) return venue;
  if (looksLikeStreetAddress(previous)) return venue;

  return previous;
}

export function buildStudioRequest(
  details: EventDetails,
  mode: StudioGenerateMode,
  surface: StudioGenerateSurface,
  editPrompt?: string,
  sourceImageDataUrl?: string,
  previousDetails?: EventDetails,
): StudioGenerateRequest {
  const refinement = clean(editPrompt);
  const sourceImage = clean(sourceImageDataUrl);
  const editInstruction = sourceImage
    ? buildExistingImageEditInstruction(details, refinement, previousDetails)
    : "";
  const designIdea = sanitizeStudioDesignIdea(details.theme);
  const categorySupportsRsvp = supportsStudioCategoryRsvp(details.category);
  const baseDescription = buildDescription(details);
  const internalInstructions = clean(details.specialInstructions);
  const sanitizedGuestImageUrls = hasStudioSubjectReferencePhotos(details)
    ? sanitizeGuestImageUrls(details.guestImageUrls)
    : [];
  const sanitizedPropertyImageUrls =
    details.category === "Open House" && hasStudioSubjectReferencePhotos(details)
      ? sanitizeGuestImageUrls(details.propertyImageUrls).slice(
          0,
          STUDIO_OPEN_HOUSE_PROPERTY_IMAGE_URL_MAX,
        )
      : [];
  const sanitizedRealtorImageUrls =
    details.category === "Open House" && hasStudioSubjectReferencePhotos(details)
      ? sanitizeGuestImageUrls(details.realtorImageUrls).slice(
          0,
          STUDIO_OPEN_HOUSE_REALTOR_IMAGE_URL_MAX,
        )
      : [];
  const sanitizedRealtorLogoUrls =
    details.category === "Open House" && hasStudioSubjectReferencePhotos(details)
      ? sanitizeGuestImageUrls(details.realtorLogoUrls).slice(
          0,
          STUDIO_OPEN_HOUSE_REALTOR_LOGO_URL_MAX,
        )
      : [];
  const guestPhotoHint =
    sanitizedGuestImageUrls.length > 0 ||
    sanitizedPropertyImageUrls.length > 0 ||
    sanitizedRealtorImageUrls.length > 0 ||
    sanitizedRealtorLogoUrls.length > 0
      ? details.category === "Open House"
        ? ` Host provided ${sanitizedPropertyImageUrls.length} house photo(s) for premium real-estate poster generation, ${sanitizedRealtorImageUrls.length} realtor photo(s) for the app Realtor tab only, and ${sanitizedRealtorLogoUrls.length} logo image(s) for the app Logo tab only.`
        : ` Host provided ${sanitizedGuestImageUrls.length} reference photo(s) for invitation artwork; keep wording warm and personal where it fits.`
      : "";
  const categoryGuardrails = buildStudioCategoryGuardrails(details);
  const visualDirection = buildStudioVisualDirection(details);
  const imageFinishPreset = resolveStudioImageFinishPreset(
    details.category,
    details.imageFinishPreset,
  );
  const imageFinishPresetDirection = imageFinishPreset
    ? `Selected image finish preset: ${imageFinishPreset.label}. Apply a ${imageFinishPreset.label} finish with ${imageFinishPreset.description}.`
    : "";
  const studioGuardrails =
    "Preserve exact spelling from the event details when visible wording is baked into the generated invitation image. For live cards, the invitation text should feel like part of the designed image itself, not a detached app overlay. Keep the copy concentrated in the upper and middle portions of the card. Keep the lower zone decorative and art-led rather than empty or separated, but never place visible text, names, listing facts, contact details, faux buttons, icons, chips, circles, bars, logos, seals, signs, monograms, or device chrome in the bottom action-button area. Keep the top edge decorative too: no status bar, carrier text, clock text, battery icons, notches, camera cutouts, or phone chrome.";
  return {
    mode,
    surface,
    event: {
      title: getDisplayTitle(details),
      category: details.category,
      occasion: pickFirst(details.occasion, details.category),
      eventYear: shouldIncludeStudioEventYear(details) ? getStudioEventYear(details) || null : null,
      hostName:
        pickFirst(
          categorySupportsRsvp ? details.rsvpName : "",
          details.category === "Open House" ? details.realtorName : "",
          details.hostedBy,
          details.teacherName,
          details.mainPerson,
        ) || null,
      honoreeName: getHonoreeName(details) || null,
      sportType: clean(details.sportType) || null,
      teamName: clean(details.teamName) || null,
      opponentName: clean(details.opponentName) || null,
      leagueDivision: clean(details.leagueDivision) || null,
      broadcastInfo: clean(details.broadcastInfo) || null,
      parkingInfo: clean(details.parkingInfo) || null,
      propertyPrice: clean(details.propertyPrice) || null,
      bedrooms: clean(details.bedrooms) || null,
      bathrooms: clean(details.bathrooms) || null,
      squareFootage: clean(details.squareFootage) || null,
      neighborhood: clean(details.neighborhood) || null,
      propertyHighlights: clean(details.propertyHighlights) || null,
      realtorName: clean(details.realtorName) || null,
      realtorTitle: clean(details.realtorTitle) || null,
      brokerageName: clean(details.brokerageName) || null,
      realtorLicense: clean(details.realtorLicense) || null,
      ageOrMilestone: getAgeOrMilestone(details) || null,
      userIdea: designIdea || null,
      description:
        [baseDescription, refinement ? `Edit request: ${refinement}` : "", guestPhotoHint]
          .filter(Boolean)
          .join(" ") || null,
      date: formatStudioPromptDate(details) || null,
      startTime: getStudioEventStartTime(details) || null,
      endTime: getStudioEventEndTime(details) || null,
      timezone:
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago"
          : "America/Chicago",
      venueName:
        pickFirst(
          details.venueName,
          details.category === "Open House" ? details.eventTitle : "",
          details.ceremonyVenue,
          details.receptionVenue,
        ) || null,
      venueAddress: clean(details.location) || null,
      dressCode: clean(details.dressCode) || null,
      rsvpBy: categorySupportsRsvp ? clean(details.rsvpDeadline) || null : null,
      rsvpContact: categorySupportsRsvp ? clean(details.rsvpContact) || null : null,
      registryNote: getRegistryText(details) || null,
      links: buildLinks(details),
      referenceImageUrls:
        sanitizedGuestImageUrls.length > 0
          ? sanitizedGuestImageUrls.slice(0, STUDIO_GUEST_IMAGE_URL_MAX)
          : undefined,
      propertyImageUrls:
        sanitizedPropertyImageUrls.length > 0 ? sanitizedPropertyImageUrls : undefined,
      realtorImageUrls:
        sanitizedRealtorImageUrls.length > 0 ? sanitizedRealtorImageUrls : undefined,
    },
    guidance: {
      tone:
        pickFirst(
          details.style,
          details.category === "Open House" ? "Premium realtor marketing" : null,
          details.category === "Game Day" ? "Bold and energetic" : null,
          details.category === "Birthday" ? "Playful and polished" : "Warm and elevated",
        ) || null,
      visualPreferences: clean(details.visualPreferences) || null,
      style:
        [
          visualDirection,
          categoryGuardrails,
          imageFinishPresetDirection,
          internalInstructions,
          refinement,
          studioGuardrails,
        ]
          .filter(Boolean)
          .join(". ") || null,
      audience: pickFirst(details.invitedWho, details.audience, "Guests") || null,
      colorPalette:
        clean(details.colors) ||
        (details.category === "Open House"
          ? "Architectural neutrals, deep charcoal, warm white, and refined teal or gold accents"
          : null) ||
        (details.category === "Game Day"
          ? "Deep navy, bright stadium lights, crisp white, and bold gold accents"
          : null),
      imageFinishPreset: imageFinishPreset?.label,
      includeEmoji: true,
      subjectTransformMode:
        sanitizedGuestImageUrls.length > 0 || sanitizedPropertyImageUrls.length > 0
          ? "premium_makeover"
          : undefined,
      likenessStrength:
        sanitizedGuestImageUrls.length > 0 || sanitizedPropertyImageUrls.length > 0
          ? details.likenessStrength
          : undefined,
      visualStyleMode:
        sanitizedGuestImageUrls.length > 0 || sanitizedPropertyImageUrls.length > 0
          ? details.visualStyleMode
          : undefined,
    },
    imageEdit: sourceImage
      ? {
          sourceImageDataUrl: sourceImage,
          editInstruction,
        }
      : undefined,
  };
}

export function buildInvitationData(
  details: EventDetails,
  response: StudioGenerateApiResponse,
): InvitationData {
  const liveCard = response.liveCard;
  const invitation = liveCard?.invitation || response.invitation;
  return refreshLiveCardInvitationData(details, {
    title: liveCard?.title || invitation?.title,
    subtitle: invitation?.subtitle || buildStudioSubtitleFallback(details),
    description:
      stripStudioInternalInstructions(liveCard?.description) ||
      stripStudioInternalInstructions(invitation?.openingLine) ||
      buildDescription(details) ||
      "Celebrate together with a beautifully designed invitation.",
    scheduleLine: invitation?.scheduleLine,
    locationLine: invitation?.locationLine,
    callToAction: resolveStudioCallToAction(
      details,
      liveCard?.interactiveMetadata.ctaLabel,
      invitation?.callToAction,
      details.calloutText,
    ),
    socialCaption:
      stripStudioInternalInstructions(liveCard?.interactiveMetadata.shareNote) ||
      stripStudioInternalInstructions(invitation?.socialCaption) ||
      stripStudioInternalInstructions(liveCard?.description) ||
      stripStudioInternalInstructions(invitation?.openingLine),
    heroTextMode: "image",
    theme: liveCard
      ? {
          primaryColor: liveCard.palette.primary,
          secondaryColor: liveCard.palette.secondary,
          accentColor: liveCard.palette.accent,
          themeStyle: liveCard.themeStyle,
        }
      : undefined,
    interactiveMetadata: liveCard?.interactiveMetadata
      ? {
          rsvpMessage: liveCard.interactiveMetadata.rsvpMessage,
          funFacts: liveCard.interactiveMetadata.funFacts,
          ctaLabel: liveCard.interactiveMetadata.ctaLabel,
          shareNote: liveCard.interactiveMetadata.shareNote,
        }
      : undefined,
  });
}

export function refreshLiveCardInvitationData(
  details: EventDetails,
  previous?: Partial<InvitationData>,
): InvitationData {
  const fallbackTheme = getThemeColors(details);
  const description =
    stripStudioInternalInstructions(previous?.description) ||
    buildDescription(details) ||
    "Celebrate together with a beautifully designed invitation.";
  const title = stripStudioInternalInstructions(previous?.title) || getDisplayTitle(details);
  const subtitle =
    stripStudioInternalInstructions(previous?.subtitle) || buildStudioSubtitleFallback(details);
  const scheduleLine = clean(previous?.scheduleLine) || buildDeterministicScheduleLine(details);
  const locationLine = resolveLiveCardVisibleLocationLine(details, previous?.locationLine);
  const callToAction = resolveStudioCallToAction(
    details,
    previous?.callToAction,
    details.calloutText,
  );
  const socialCaption = clean(previous?.socialCaption) || description;
  const publicSocialCaption = stripStudioInternalInstructions(socialCaption) || description;
  const heroTextMode =
    previous?.heroTextMode === "overlay" || previous?.heroTextMode === "image"
      ? previous.heroTextMode
      : "overlay";

  return {
    title,
    subtitle,
    description,
    scheduleLine,
    locationLine,
    callToAction,
    socialCaption: publicSocialCaption,
    heroTextMode,
    theme: {
      primaryColor: clean(previous?.theme?.primaryColor) || fallbackTheme.primaryColor,
      secondaryColor: clean(previous?.theme?.secondaryColor) || fallbackTheme.primaryColor,
      accentColor: clean(previous?.theme?.accentColor) || fallbackTheme.accentColor,
      themeStyle: clean(previous?.theme?.themeStyle) || "editorial gradient",
    },
    interactiveMetadata: {
      rsvpMessage: resolveStudioRsvpMessage(details, previous?.interactiveMetadata?.rsvpMessage),
      funFacts: previous?.interactiveMetadata?.funFacts || [],
      ctaLabel: resolveStudioCallToAction(
        details,
        previous?.interactiveMetadata?.ctaLabel,
        callToAction,
      ),
      shareNote:
        stripStudioInternalInstructions(previous?.interactiveMetadata?.shareNote) ||
        publicSocialCaption,
    },
    eventDetails: details,
  };
}

export function normalizeStudioEventCategory(category: InviteCategory): string {
  switch (category) {
    case "Birthday":
      return "birthdays";
    case "Wedding":
      return "weddings";
    case "Open House":
      return "real estate open house";
    case "Baby Shower":
      return "baby showers";
    case "Game Day":
      return "sport events";
    case "Bridal Shower":
      return "bridal showers";
    case "Housewarming":
      return "housewarming";
    case "Anniversary":
      return "party";
    default:
      return "special events";
  }
}

export function toIsoFromLocalDateTime(dateValue: string, timeValue?: string): string | undefined {
  const date = readString(dateValue);
  if (!date) return undefined;

  const normalizedTime = readString(timeValue);
  if (!normalizedTime) return date;
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(normalizedTime)) return undefined;
  return `${date}T${normalizedTime.length === 5 ? `${normalizedTime}:00` : normalizedTime}`;
}

export function getStudioEventDate(details: EventDetails): string {
  const eventDate = readString(details.eventDate);
  if (eventDate) {
    return details.category === "Wedding" ? eventDate : inferStudioMonthDayIsoDate(eventDate);
  }
  return readString(details.ceremonyDate);
}

export function getStudioEventStartTime(details: EventDetails): string {
  return readString(details.startTime) || readString(details.ceremonyTime);
}

export function getStudioEventEndTime(details: EventDetails): string {
  return readString(details.endTime) || readString(details.receptionTime);
}

export function normalizeStudioExternalUrl(value: string): string {
  const trimmed = readString(value);
  if (!trimmed) return "";
  const normalized = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;
  return attachAmazonAffiliateTag(normalized);
}

export function buildStudioRsvpLine(details: EventDetails): string | undefined {
  if (!supportsStudioCategoryRsvp(details.category)) return undefined;
  const hostName = readString(details.rsvpName);
  const hostContact = readString(details.rsvpContact);
  const deadline = formatDate(details.rsvpDeadline);
  const contactLine = [hostName, hostContact].filter(Boolean).join(" - ");
  if (!contactLine && !deadline) return undefined;
  if (deadline && contactLine) {
    return `RSVP by ${deadline}: ${contactLine}`;
  }
  return deadline ? `RSVP by ${deadline}` : `RSVP: ${contactLine}`;
}

export function getStudioShareTitle(item: MediaItem): string {
  return item.data?.title || getDisplayTitle(item.details);
}

export function buildStudioPublishPayload(item: MediaItem, imageUrl: string | null) {
  const details = item.details;
  const title = getStudioShareTitle(item);
  const startISO = toIsoFromLocalDateTime(
    getStudioEventDate(details),
    getStudioEventStartTime(details),
  );
  const endISO = toIsoFromLocalDateTime(
    getStudioEventDate(details),
    getStudioEventEndTime(details),
  );
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const category = normalizeStudioEventCategory(details.category);
  const descriptionParts = [
    item.data?.description,
    readString(details.detailsDescription),
    readString(details.message),
    readString(details.specialInstructions),
    ...buildGameDayContextNotes(details),
    ...buildOpenHouseContextNotes(details),
    readString(details.optionalLink)
      ? `More info: ${normalizeStudioExternalUrl(details.optionalLink)}`
      : "",
    readString(details.listingUrl)
      ? `Listing: ${normalizeStudioExternalUrl(details.listingUrl)}`
      : "",
    readString(details.weddingWebsite)
      ? `Wedding website: ${normalizeStudioExternalUrl(details.weddingWebsite)}`
      : "",
  ].filter(Boolean);
  const registries = [
    readString(details.ticketsLink)
      ? { label: "Tickets", url: normalizeStudioExternalUrl(details.ticketsLink) }
      : null,
    readString(details.listingUrl)
      ? { label: "Listing", url: normalizeStudioExternalUrl(details.listingUrl) }
      : null,
    readString(details.registryLink)
      ? {
          label: getStudioRegistryLinkLabel(details.category),
          url: normalizeStudioExternalUrl(details.registryLink),
        }
      : null,
    readString(details.weddingWebsite)
      ? { label: "Wedding Website", url: normalizeStudioExternalUrl(details.weddingWebsite) }
      : null,
    readString(details.optionalLink)
      ? { label: "More Info", url: normalizeStudioExternalUrl(details.optionalLink) }
      : null,
  ]
    .filter(Boolean)
    .map((entry) => entry as { label: string; url: string });
  const rsvpLine = buildStudioRsvpLine(details);
  const venue =
    readString(details.venueName) ||
    readString(details.ceremonyVenue) ||
    readString(details.receptionVenue) ||
    (details.category === "Open House" ? readString(details.eventTitle) : "");
  const location =
    readString(details.location) ||
    (details.category === "Open House" ? readString(details.eventTitle) : "") ||
    venue ||
    undefined;

  return {
    title,
    data: {
      title,
      description:
        descriptionParts.join("\n\n") || "Celebrate together with a beautifully designed invite.",
      startISO,
      startAt: startISO,
      start: startISO,
      endISO,
      endAt: endISO,
      end: endISO,
      timezone,
      category,
      status: "published",
      ownership: "created",
      createdVia: "studio",
      primaryOutput: "live_card",
      productType: "live_card",
      publicRenderer: "live_card",
      ownerDefaultSurface: "card",
      venue: venue || undefined,
      location,
      address: location,
      rsvp: rsvpLine,
      rsvpEnabled: Boolean(rsvpLine),
      rsvpDeadline: readString(details.rsvpDeadline) || undefined,
      thumbnail: imageUrl || undefined,
      coverImageUrl: imageUrl || undefined,
      heroImage: imageUrl || undefined,
      customHeroImage: imageUrl || undefined,
      registries: registries.length > 0 ? registries : undefined,
      themeStyle: item.data?.theme.themeStyle || undefined,
      studioCard: {
        mediaType: item.type,
        imageUrl: imageUrl || undefined,
        invitationData: item.data || undefined,
        positions: item.positions || { ...EMPTY_POSITIONS },
      },
    },
  };
}

export function inputValue(value: EventDetails[keyof EventDetails]) {
  if (typeof value === "boolean") return value;
  return value ?? "";
}

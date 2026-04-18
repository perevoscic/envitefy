import type { LiveCardRsvpChoice } from "@/lib/live-card-rsvp";
import { resolveStudioImageFinishPreset } from "@/lib/studio/image-finish-presets";
import {
  type StudioGenerateApiResponse,
  type StudioGenerateMode,
  type StudioGenerateRequest,
  type StudioGenerateSurface,
} from "@/lib/studio/types";
import { formatWeekdayMonthDayOrdinalEn } from "@/utils/format-month-day-ordinal";
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
} from "./studio-workspace-types";
import {
  readString,
  STUDIO_GUEST_IMAGE_URL_MAX,
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
    return pickFirst(
      buildBirthdayHeadline(details),
      details.eventTitle,
      "Birthday Celebration",
    );
  }
  if (details.category === "Wedding") {
    return pickFirst(
      details.eventTitle,
      details.coupleNames ? `${details.coupleNames} Wedding` : "",
      "Wedding Celebration",
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
    return pickFirst(details.theme, details.activityNote, buildDescription(details), details.category);
  }
  return pickFirst(buildDescription(details), details.theme, details.category);
}

export function hasStudioSubjectReferencePhotos(details: EventDetails) {
  return (
    details.sourceMediaMode === "subjectPhotos" &&
    sanitizeGuestImageUrls(details.guestImageUrls).length > 0
  );
}

export function getRegistryText(details: EventDetails) {
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
      clean(details.giftPreferenceNote) ||
      clean(details.giftNote) ||
      clean(details.bringABookNote),
  );
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
  Anniversary: "Anniversary",
  "Bridal Shower": "Bridal Shower",
  Housewarming: "Housewarming",
  "Field Trip/Day": "Field Trip",
  "Game Day": "Game Day",
  "Custom Invite": "Custom Invite",
};

export function getStudioIdeaLabel(category: InviteCategory) {
  return `Enter Your ${STUDIO_IDEA_CATEGORY_LABELS[category]} Idea`;
}

export function getStudioIdeaPlaceholder(category: InviteCategory) {
  const label = STUDIO_IDEA_CATEGORY_LABELS[category];
  return `e.g. A ${label.toLowerCase()} design with the colors, mood, and details you want...`;
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

export function buildDescription(details: EventDetails) {
  const parts = [
    clean(details.detailsDescription),
    clean(details.message),
    clean(details.specialInstructions),
    clean(details.activityNote),
    clean(details.calloutText),
    ...buildGameDayContextNotes(details),
  ].filter(Boolean);
  return parts.join(" ").trim();
}

export function buildLinks(details: EventDetails) {
  return [
    details.ticketsLink ? { label: "Tickets", url: details.ticketsLink } : null,
    details.registryLink ? { label: "Registry", url: details.registryLink } : null,
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

export function buildStudioVisualDirection(details: EventDetails) {
  const customIdea = clean(details.theme);
  const extraPreferences = clean(details.visualPreferences);
  const combinedDirection = [customIdea, extraPreferences].filter(Boolean).join(". ");
  const instructions: string[] = [];

  if (combinedDirection) {
    instructions.push(`Highest-priority visual direction from the user: ${combinedDirection}.`);
    instructions.push(
      "Treat the user's words as the theme of the invitation, while still expressing the selected category clearly.",
    );
    instructions.push(buildStudioThemeFramingGuidance(details));
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

  if (/\bcats?\b/i.test(combinedDirection)) {
    instructions.push(
      "If cats appear, they should look like real cats unless the user explicitly requests a stylized or cartoon treatment.",
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
  return normalized === "birthday" || normalized === "wedding";
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
  return trimmed.replace(/\s*([AaPp][Mm])$/, (_, meridiem: string) => ` ${meridiem.toUpperCase()}`);
}

export function buildDeterministicScheduleLine(details: EventDetails): string {
  const date = formatWeekdayMonthDayOrdinalEn(getStudioEventDate(details), {
    includeComma: false,
  });
  const time = formatVisibleCardTime(getStudioEventStartTime(details));
  if (date && time) return `${date} at ${time}`;
  return date;
}

function buildDeterministicLocationLine(details: EventDetails): string {
  return pickFirst(
    details.venueName,
    details.ceremonyVenue,
    details.receptionVenue,
    details.location,
    "Location TBD",
  );
}

export function buildStudioRequest(
  details: EventDetails,
  mode: StudioGenerateMode,
  surface: StudioGenerateSurface,
  editPrompt?: string,
  sourceImageDataUrl?: string,
): StudioGenerateRequest {
  const refinement = clean(editPrompt);
  const categorySupportsRsvp = supportsStudioCategoryRsvp(details.category);
  const baseDescription = buildDescription(details);
  const sanitizedGuestImageUrls = hasStudioSubjectReferencePhotos(details)
    ? sanitizeGuestImageUrls(details.guestImageUrls)
    : [];
  const guestPhotoHint =
    sanitizedGuestImageUrls.length > 0
      ? ` Host provided ${sanitizedGuestImageUrls.length} reference photo(s) for invitation artwork; keep wording warm and personal where it fits.`
      : "";
  const visualDirection = buildStudioVisualDirection(details);
  const categoryGuardrails = buildStudioCategoryGuardrails(details);
  const imageFinishPreset = resolveStudioImageFinishPreset(
    details.category,
    details.imageFinishPreset,
  );
  const imageFinishPresetDirection = imageFinishPreset
    ? `Selected image finish preset: ${imageFinishPreset.label}. Apply a ${imageFinishPreset.label} finish with ${imageFinishPreset.description}.`
    : "";
  const studioGuardrails =
    "Preserve exact spelling from the event details when visible wording is baked into the generated invitation image. For live cards, the invitation text should feel like part of the designed image itself, not a detached app overlay. Keep the copy concentrated in the upper and middle portions of the card. Keep the lower zone decorative and art-led rather than empty or separated, but never place visible text, faux buttons, icons, chips, circles, bars, or device chrome in the bottom action-button area. Keep the top edge decorative too: no status bar, carrier text, clock text, battery icons, notches, camera cutouts, or phone chrome.";
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
          details.hostedBy,
          details.teacherName,
          details.mainPerson,
        ) ||
        null,
      honoreeName: getHonoreeName(details) || null,
      sportType: clean(details.sportType) || null,
      teamName: clean(details.teamName) || null,
      opponentName: clean(details.opponentName) || null,
      leagueDivision: clean(details.leagueDivision) || null,
      broadcastInfo: clean(details.broadcastInfo) || null,
      parkingInfo: clean(details.parkingInfo) || null,
      ageOrMilestone: getAgeOrMilestone(details) || null,
      userIdea: clean(details.theme) || null,
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
        pickFirst(details.venueName, details.ceremonyVenue, details.receptionVenue) || null,
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
    },
    guidance: {
      tone:
        pickFirst(
          details.style,
          details.category === "Game Day"
            ? "Bold and energetic"
            : null,
          details.category === "Birthday" ? "Playful and polished" : "Warm and elevated",
        ) || null,
      style:
        [
          visualDirection,
          categoryGuardrails,
          imageFinishPresetDirection,
          refinement,
          studioGuardrails,
        ]
          .filter(Boolean)
          .join(". ") || null,
      audience: pickFirst(details.invitedWho, details.audience, "Guests") || null,
      colorPalette:
        clean(details.colors) ||
        (details.category === "Game Day"
          ? "Deep navy, bright stadium lights, crisp white, and bold gold accents"
          : null),
      imageFinishPreset: imageFinishPreset?.label,
      includeEmoji: true,
      subjectTransformMode:
        sanitizedGuestImageUrls.length > 0 ? "premium_makeover" : undefined,
      likenessStrength: sanitizedGuestImageUrls.length > 0 ? details.likenessStrength : undefined,
      visualStyleMode: sanitizedGuestImageUrls.length > 0 ? details.visualStyleMode : undefined,
    },
    imageEdit: clean(sourceImageDataUrl)
      ? { sourceImageDataUrl: clean(sourceImageDataUrl) }
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
    subtitle:
      invitation?.subtitle ||
      getStudioThemeLine(details),
    description:
      liveCard?.description ||
      invitation?.openingLine ||
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
      liveCard?.interactiveMetadata.shareNote ||
      invitation?.socialCaption ||
      liveCard?.description ||
      invitation?.openingLine,
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
    clean(previous?.description) ||
    buildDescription(details) ||
    "Celebrate together with a beautifully designed invitation.";
  const title = clean(previous?.title) || getDisplayTitle(details);
  const subtitle = clean(previous?.subtitle) || getStudioThemeLine(details);
  const scheduleLine = clean(previous?.scheduleLine) || buildDeterministicScheduleLine(details);
  const locationLine = clean(previous?.locationLine) || buildDeterministicLocationLine(details);
  const callToAction = resolveStudioCallToAction(
    details,
    previous?.callToAction,
    details.calloutText,
  );
  const socialCaption = clean(previous?.socialCaption) || description;
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
    socialCaption,
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
      shareNote: clean(previous?.interactiveMetadata?.shareNote) || socialCaption,
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
    case "Baby Shower":
      return "baby showers";
    case "Game Day":
      return "sport events";
    case "Bridal Shower":
    case "Housewarming":
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
  return readString(details.eventDate) || readString(details.ceremonyDate);
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
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
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
    readString(details.optionalLink)
      ? `More info: ${normalizeStudioExternalUrl(details.optionalLink)}`
      : "",
    readString(details.weddingWebsite)
      ? `Wedding website: ${normalizeStudioExternalUrl(details.weddingWebsite)}`
      : "",
  ].filter(Boolean);
  const registries = [
    readString(details.ticketsLink)
      ? { label: "Tickets", url: normalizeStudioExternalUrl(details.ticketsLink) }
      : null,
    readString(details.registryLink)
      ? { label: "Registry", url: normalizeStudioExternalUrl(details.registryLink) }
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
    readString(details.receptionVenue);
  const location = readString(details.location) || venue || undefined;

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
      venue: venue || undefined,
      location,
      rsvp: rsvpLine,
      rsvpEnabled: Boolean(rsvpLine),
      rsvpDeadline: readString(details.rsvpDeadline) || undefined,
      thumbnail: imageUrl || undefined,
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

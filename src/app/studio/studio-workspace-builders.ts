import type { LiveCardRsvpChoice } from "@/lib/live-card-rsvp";
import {
  type StudioGenerateApiResponse,
  type StudioGenerateMode,
  type StudioGenerateRequest,
} from "@/lib/studio/types";
import { EMPTY_POSITIONS } from "./studio-workspace-field-config";
import type {
  EventDetails,
  InvitationData,
  InviteCategory,
  MediaItem,
} from "./studio-workspace-types";
import { readString, sanitizeGuestImageUrls, STUDIO_GUEST_IMAGE_URL_MAX } from "./studio-workspace-utils";

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

export function getDisplayTitle(details: EventDetails) {
  if (details.category === "Birthday") {
    return pickFirst(
      details.eventTitle,
      details.name ? `${details.name}'s Birthday` : "",
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
  return pickFirst(details.eventTitle, details.occasion, `${details.category} Event`);
}

export function getHonoreeName(details: EventDetails) {
  return pickFirst(
    details.name,
    details.coupleNames,
    details.honoreeNames,
    details.mainPerson,
    details.eventTitle,
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
  return { primaryColor: "#111827", accentColor: "#7c3aed" };
}


export function buildDescription(details: EventDetails) {
  const parts = [
    clean(details.detailsDescription),
    clean(details.message),
    clean(details.specialInstructions),
    clean(details.activityNote),
    clean(details.calloutText),
  ].filter(Boolean);
  return parts.join(" ").trim();
}

export function buildLinks(details: EventDetails) {
  return [
    details.registryLink ? { label: "Registry", url: details.registryLink } : null,
    details.weddingWebsite ? { label: "Website", url: details.weddingWebsite } : null,
    details.optionalLink ? { label: "Event Link", url: details.optionalLink } : null,
  ].filter((value): value is { label: string; url: string } => Boolean(value));
}

export function buildStudioVisualDirection(details: EventDetails) {
  const customIdea = clean(details.theme);
  const extraPreferences = clean(details.visualPreferences);
  const combinedDirection = [customIdea, extraPreferences].filter(Boolean).join(". ");
  const instructions: string[] = [];

  if (combinedDirection) {
    instructions.push(
      `Highest-priority visual direction from the user: ${combinedDirection}. Follow this literally and let it override generic preset, category, or celebration styling.`,
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
    "Custom Invite":
      "Generate an invitation image that fits the provided event details exactly and do not drift into a different celebration type.",
  };

  return [
    categoryPromptByType[details.category],
    "Do not hallucinate people, animals, venue features, decorations, dates, times, logos, outfits, gifts, cakes, rings, balloons, or activities that are not supported by the event details or the user's visual direction.",
    "If an important visual detail is missing, keep it generic and restrained instead of inventing specifics.",
    "Any visible wording must match the provided event details exactly. Never fabricate names, phone numbers, addresses, schedules, or event copy.",
  ].join(" ");
}

export function buildStudioRequest(
  details: EventDetails,
  mode: StudioGenerateMode,
  editPrompt?: string,
  sourceImageDataUrl?: string,
): StudioGenerateRequest {
  const refinement = clean(editPrompt);
  const baseDescription = buildDescription(details);
  const sanitizedGuestImageUrls = sanitizeGuestImageUrls(details.guestImageUrls);
  const guestPhotoHint =
    sanitizedGuestImageUrls.length > 0
      ? ` Host provided ${sanitizedGuestImageUrls.length} reference photo(s) for invitation artwork; keep wording warm and personal where it fits.`
      : "";
  const visualDirection = buildStudioVisualDirection(details);
  const categoryGuardrails = buildStudioCategoryGuardrails(details);
  const studioGuardrails =
    "Preserve exact spelling from the event details. Double-check visible words. Keep the lower button area visually clear and avoid placing important copy near the bottom of the card.";
  return {
    mode,
    event: {
      title: getDisplayTitle(details),
      occasion: pickFirst(details.occasion, details.category),
      hostName:
        pickFirst(details.rsvpName, details.hostedBy, details.teacherName, details.mainPerson) ||
        null,
      honoreeName: getHonoreeName(details) || null,
      description:
        [baseDescription, refinement ? `Edit request: ${refinement}` : "", guestPhotoHint]
          .filter(Boolean)
          .join(" ") || null,
      date: clean(details.eventDate) || null,
      startTime: clean(details.startTime) || null,
      endTime: clean(details.endTime) || null,
      timezone:
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago"
          : "America/Chicago",
      venueName:
        pickFirst(details.venueName, details.ceremonyVenue, details.receptionVenue) || null,
      venueAddress: clean(details.location) || null,
      dressCode: clean(details.dressCode) || null,
      rsvpBy: clean(details.rsvpDeadline) || null,
      rsvpContact: clean(details.rsvpContact) || null,
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
          details.category === "Birthday" ? "Playful and polished" : "Warm and elevated",
        ) || null,
      style:
        [visualDirection, categoryGuardrails, refinement, studioGuardrails]
          .filter(Boolean)
          .join(". ") || null,
      audience: pickFirst(details.invitedWho, details.audience, "Guests") || null,
      colorPalette: clean(details.colors) || null,
      includeEmoji: true,
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
  const fallbackTheme = getThemeColors(details);
  const title = liveCard?.title || invitation?.title || getDisplayTitle(details);
  const subtitle =
    invitation?.subtitle || buildDescription(details) || pickFirst(details.theme, details.category);
  const scheduleLine =
    invitation?.scheduleLine ||
    `${formatDate(details.eventDate)}${details.startTime ? ` at ${details.startTime}` : ""}`;
  const locationLine =
    invitation?.locationLine || pickFirst(details.venueName, details.location, "Location TBD");
  const callToAction =
    liveCard?.interactiveMetadata.ctaLabel ||
    invitation?.callToAction ||
    pickFirst(details.calloutText, "Tap for details and RSVP.");
  const description =
    liveCard?.description ||
    invitation?.openingLine ||
    buildDescription(details) ||
    "Celebrate together with a beautifully designed invitation.";

  return {
    title,
    subtitle,
    description,
    scheduleLine,
    locationLine,
    callToAction,
    socialCaption:
      liveCard?.interactiveMetadata.shareNote || invitation?.socialCaption || description,
    theme: {
      primaryColor: liveCard?.palette.primary || fallbackTheme.primaryColor,
      secondaryColor: liveCard?.palette.secondary || fallbackTheme.primaryColor,
      accentColor: liveCard?.palette.accent || fallbackTheme.accentColor,
      themeStyle: liveCard?.themeStyle || "editorial gradient",
    },
    interactiveMetadata: {
      rsvpMessage:
        liveCard?.interactiveMetadata.rsvpMessage || "Reply to let the host know you're coming.",
      funFacts: liveCard?.interactiveMetadata.funFacts || [],
      ctaLabel: liveCard?.interactiveMetadata.ctaLabel || callToAction,
      shareNote:
        liveCard?.interactiveMetadata.shareNote || invitation?.socialCaption || description,
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
    readString(details.optionalLink)
      ? `More info: ${normalizeStudioExternalUrl(details.optionalLink)}`
      : "",
    readString(details.weddingWebsite)
      ? `Wedding website: ${normalizeStudioExternalUrl(details.weddingWebsite)}`
      : "",
  ].filter(Boolean);
  const registries = [
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

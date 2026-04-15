import { resolveCoverImageUrlFromEventData } from "@/lib/upload-config";
import {
  normalizeInvitationText,
  normalizeLiveCardMetadata,
  type StudioGenerateApiResponse,
  type StudioGenerationError,
} from "@/lib/studio/types";
import {
  buildDescription,
  formatDate,
  getDisplayTitle,
  getFallbackThumbnail,
  getThemeColors,
  pickFirst,
} from "./studio-workspace-builders";
import { EMPTY_POSITIONS } from "./studio-workspace-field-config";
import type {
  EventDetails,
  InvitationData,
  InviteCategory,
  MediaItem,
} from "./studio-workspace-types";
import {
  isRecord,
  readNullableString,
  readString,
  sanitizeGuestImageUrls,
} from "./studio-workspace-utils";

export { STUDIO_GUEST_IMAGE_URL_MAX } from "./studio-workspace-utils";

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized === "[::1]"
  );
}

export function normalizeStudioLibraryImageUrl(value: unknown): string | undefined {
  const raw = readNullableString(value);
  if (!raw) return undefined;
  if (raw.startsWith("blob:")) return undefined;
  if (raw.startsWith("/") || raw.startsWith("data:")) return raw;
  if (!/^https?:\/\//i.test(raw)) return raw;

  try {
    const parsed = new URL(raw);
    if (isLoopbackHostname(parsed.hostname)) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return raw;
  }

  return raw;
}

export function createInitialDetails(): EventDetails {
  return {
    category: "Birthday",
    sourceMediaMode: "none",
    sourceFlyerUrl: "",
    sourceFlyerName: "",
    sourceFlyerPreviewUrl: "",
    eventTitle: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    venueName: "",
    location: "",
    rsvpName: "",
    rsvpContact: "",
    rsvpDeadline: "",
    detailsDescription: "",
    guestImageUrls: [],
    message: "",
    specialInstructions: "",
    orientation: "portrait",
    colors: "",
    style: "",
    visualPreferences: "",
    name: "",
    age: "",
    theme: "",
    invitedWho: "",
    dressCode: "",
    giftNote: "",
    isSurprise: false,
    isMilestone: false,
    activityNote: "",
    coupleNames: "",
    ceremonyDate: "",
    ceremonyTime: "",
    receptionTime: "",
    ceremonyVenue: "",
    receptionVenue: "",
    registryLink: "",
    weddingWebsite: "",
    adultsOnly: false,
    accommodationInfo: "",
    plusOnePolicy: "",
    transportationInfo: "",
    honoreeNames: "",
    babyName: "",
    gender: "Neutral",
    hostedBy: "",
    diaperRaffle: false,
    bookInsteadOfCard: false,
    bringABookNote: "",
    giftPreferenceNote: "",
    gradeLevel: "",
    teacherName: "",
    chaperonesNeeded: false,
    costPerStudent: "",
    permissionSlipRequired: false,
    lunchInfo: "",
    transportationType: "",
    emergencyContact: "",
    whatToBring: "",
    sportType: "",
    teamName: "",
    opponentName: "",
    leagueDivision: "",
    ticketsLink: "",
    broadcastInfo: "",
    parkingInfo: "",
    mainPerson: "",
    occasion: "",
    audience: "",
    calloutText: "",
    optionalLink: "",
    customLabel1: "",
    customValue1: "",
    customLabel2: "",
    customValue2: "",
  };
}

export function isInviteCategory(value: unknown): value is InviteCategory {
  return (
    value === "Birthday" ||
    value === "Field Trip/Day" ||
    value === "Game Day" ||
    value === "Bridal Shower" ||
    value === "Wedding" ||
    value === "Housewarming" ||
    value === "Baby Shower" ||
    value === "Anniversary" ||
    value === "Custom Invite"
  );
}

export function sanitizePositions(value: unknown): MediaItem["positions"] {
  if (!isRecord(value)) return { ...EMPTY_POSITIONS };

  const sanitizePoint = (point: unknown) => {
    if (!isRecord(point)) return { x: 0, y: 0 };
    const x = typeof point.x === "number" && Number.isFinite(point.x) ? point.x : 0;
    const y = typeof point.y === "number" && Number.isFinite(point.y) ? point.y : 0;
    return { x, y };
  };

  return {
    rsvp: sanitizePoint(value.rsvp),
    location: sanitizePoint(value.location),
    share: sanitizePoint(value.share),
    calendar: sanitizePoint(value.calendar),
    registry: sanitizePoint(value.registry),
    details: sanitizePoint(value.details),
  };
}

export function sanitizeEventDetails(value: unknown): EventDetails {
  const details: any = createInitialDetails();
  if (!isRecord(value)) return details;

  const stringKeys: Array<keyof EventDetails> = [
    "sourceFlyerUrl",
    "sourceFlyerName",
    "sourceFlyerPreviewUrl",
    "eventTitle",
    "eventDate",
    "startTime",
    "endTime",
    "venueName",
    "location",
    "rsvpName",
    "rsvpContact",
    "rsvpDeadline",
    "detailsDescription",
    "message",
    "specialInstructions",
    "colors",
    "style",
    "visualPreferences",
    "name",
    "age",
    "theme",
    "invitedWho",
    "dressCode",
    "giftNote",
    "activityNote",
    "coupleNames",
    "ceremonyDate",
    "ceremonyTime",
    "receptionTime",
    "ceremonyVenue",
    "receptionVenue",
    "registryLink",
    "weddingWebsite",
    "accommodationInfo",
    "plusOnePolicy",
    "transportationInfo",
    "honoreeNames",
    "babyName",
    "hostedBy",
    "bringABookNote",
    "giftPreferenceNote",
    "gradeLevel",
    "teacherName",
    "costPerStudent",
    "lunchInfo",
    "transportationType",
    "emergencyContact",
    "whatToBring",
    "sportType",
    "teamName",
    "opponentName",
    "leagueDivision",
    "ticketsLink",
    "broadcastInfo",
    "parkingInfo",
    "mainPerson",
    "occasion",
    "audience",
    "calloutText",
    "optionalLink",
    "customLabel1",
    "customValue1",
    "customLabel2",
    "customValue2",
  ];

  for (const key of stringKeys) {
    details[key] = readString(value[key]);
  }

  const category = readString(value.category);
  details.category = isInviteCategory(category) ? category : details.category;
  details.sourceMediaMode =
    value.sourceMediaMode === "flyer" ||
    value.sourceMediaMode === "subjectPhotos" ||
    value.sourceMediaMode === "none"
      ? value.sourceMediaMode
      : "none";
  details.orientation = value.orientation === "landscape" ? "landscape" : "portrait";
  details.gender =
    value.gender === "Boy" || value.gender === "Girl" || value.gender === "Neutral"
      ? value.gender
      : "Neutral";
  details.isSurprise =
    typeof value.isSurprise === "boolean" ? value.isSurprise : details.isSurprise;
  details.isMilestone =
    typeof value.isMilestone === "boolean" ? value.isMilestone : details.isMilestone;
  details.adultsOnly =
    typeof value.adultsOnly === "boolean" ? value.adultsOnly : details.adultsOnly;
  details.diaperRaffle =
    typeof value.diaperRaffle === "boolean" ? value.diaperRaffle : details.diaperRaffle;
  details.bookInsteadOfCard =
    typeof value.bookInsteadOfCard === "boolean"
      ? value.bookInsteadOfCard
      : details.bookInsteadOfCard;
  details.chaperonesNeeded =
    typeof value.chaperonesNeeded === "boolean" ? value.chaperonesNeeded : details.chaperonesNeeded;
  details.permissionSlipRequired =
    typeof value.permissionSlipRequired === "boolean"
      ? value.permissionSlipRequired
      : details.permissionSlipRequired;

  details.guestImageUrls = sanitizeGuestImageUrls(value.guestImageUrls);
  if (details.sourceMediaMode === "flyer") {
    details.guestImageUrls = [];
  } else if (details.guestImageUrls.length > 0) {
    details.sourceMediaMode = "subjectPhotos";
    details.sourceFlyerUrl = "";
    details.sourceFlyerName = "";
    details.sourceFlyerPreviewUrl = "";
  } else if (!details.sourceFlyerUrl) {
    details.sourceMediaMode = "none";
  }

  return details;
}

export function sanitizeGenerationError(value: unknown): StudioGenerationError | undefined {
  if (!isRecord(value)) return undefined;
  return {
    code: readString(value.code) || "unknown_error",
    message: readString(value.message) || "Studio generation failed.",
    retryable: typeof value.retryable === "boolean" ? value.retryable : true,
    provider: "gemini",
    status: typeof value.status === "number" ? value.status : undefined,
  };
}

export function sanitizeInvitationData(
  value: unknown,
  fallbackDetails: EventDetails,
): InvitationData | undefined {
  if (!isRecord(value)) return undefined;

  const theme = isRecord(value.theme) ? value.theme : null;
  const interactiveMetadata = isRecord(value.interactiveMetadata)
    ? value.interactiveMetadata
    : null;
  const eventDetails = sanitizeEventDetails(value.eventDetails);
  const defaultTheme = getThemeColors(fallbackDetails);

  return {
    title: readString(value.title) || getDisplayTitle(fallbackDetails),
    subtitle:
      readString(value.subtitle) || pickFirst(fallbackDetails.theme, fallbackDetails.category),
    description:
      readString(value.description) ||
      buildDescription(fallbackDetails) ||
      "Celebrate together with a beautifully designed invitation.",
    scheduleLine:
      readString(value.scheduleLine) ||
      `${formatDate(fallbackDetails.eventDate)}${fallbackDetails.startTime ? ` at ${fallbackDetails.startTime}` : ""}`,
    locationLine:
      readString(value.locationLine) ||
      pickFirst(fallbackDetails.venueName, fallbackDetails.location, "Location TBD"),
    callToAction:
      readString(value.callToAction) ||
      pickFirst(fallbackDetails.calloutText, "Tap for details and RSVP."),
    socialCaption:
      readString(value.socialCaption) ||
      readString(value.description) ||
      buildDescription(fallbackDetails),
    heroTextMode:
      value.heroTextMode === "overlay" || value.heroTextMode === "image"
        ? value.heroTextMode
        : undefined,
    theme: {
      primaryColor: readString(theme?.primaryColor) || defaultTheme.primaryColor,
      secondaryColor: readString(theme?.secondaryColor) || defaultTheme.primaryColor,
      accentColor: readString(theme?.accentColor) || defaultTheme.accentColor,
      themeStyle: readString(theme?.themeStyle) || "editorial gradient",
    },
    interactiveMetadata: {
      rsvpMessage:
        readString(interactiveMetadata?.rsvpMessage) || "Reply to let the host know you're coming.",
      funFacts: Array.isArray(interactiveMetadata?.funFacts)
        ? interactiveMetadata.funFacts.map(readString).filter(Boolean).slice(0, 5)
        : [],
      ctaLabel:
        readString(interactiveMetadata?.ctaLabel) ||
        readString(value.callToAction) ||
        "Tap for details and RSVP.",
      shareNote:
        readString(interactiveMetadata?.shareNote) ||
        readString(value.socialCaption) ||
        readString(value.description) ||
        "Share this live card with your guests.",
    },
    eventDetails,
  };
}

export function sanitizeMediaItem(value: unknown): MediaItem | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const type = value.type === "image" || value.type === "page" ? value.type : null;
  if (!id || !type) return null;

  const details = sanitizeEventDetails(value.details);
  return {
    id,
    type,
    url: normalizeStudioLibraryImageUrl(value.url),
    data: sanitizeInvitationData(value.data, details),
    errorMessage: readNullableString(value.errorMessage) || undefined,
    publishedEventId: readNullableString(value.publishedEventId) || undefined,
    sharePath: readNullableString(value.sharePath) || undefined,
    theme: readString(value.theme) || getDisplayTitle(details),
    status:
      value.status === "ready" || value.status === "loading" || value.status === "error"
        ? value.status
        : "error",
    details,
    createdAt: readString(value.createdAt) || new Date().toISOString(),
    positions: sanitizePositions(value.positions),
  };
}

export function sanitizeMediaItems(value: unknown): MediaItem[] {
  if (!Array.isArray(value)) return [];
  return value.map(sanitizeMediaItem).filter((item): item is MediaItem => Boolean(item));
}

/** True when url is a real asset, not the synthetic theme/SVG fallback used for empty previews. */
export function isNonFallbackStudioThumbnailUrl(
  url: string | undefined,
  details: EventDetails,
): boolean {
  const u = readNullableString(url);
  if (!u) return false;
  return u !== getFallbackThumbnail(details);
}

/**
 * Blob URLs and dev-machine absolute URLs cannot load on another device after library sync.
 * Treat them as missing so we re-resolve from published event history when possible.
 */
export function isEphemeralOrDevOnlyImageUrl(url: string | undefined): boolean {
  const u = readNullableString(url);
  if (!u) return true;
  if (u.startsWith("blob:")) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)\b/i.test(u)) {
    if (typeof window === "undefined") return false;
    const h = window.location.hostname;
    if (h !== "localhost" && h !== "127.0.0.1") return true;
  }
  return false;
}

export function extractHistoryStudioImageUrl(row: unknown): string | null {
  if (!isRecord(row)) return null;
  const data = isRecord(row.data) ? row.data : null;
  if (!data) return null;

  const fromCover = resolveCoverImageUrlFromEventData(data as Record<string, unknown>);
  if (fromCover) return fromCover;

  const studioCard = isRecord(data.studioCard) ? data.studioCard : null;
  const studioImage = studioCard ? readString(studioCard.imageUrl) : "";
  return studioImage || null;
}

export function extractHistoryStudioInvitationData(
  row: unknown,
  fallbackDetails: EventDetails,
): InvitationData | undefined {
  if (!isRecord(row)) return undefined;
  const data = isRecord(row.data) ? row.data : null;
  const studioCard = data && isRecord(data.studioCard) ? data.studioCard : null;
  const raw = studioCard?.invitationData;
  if (!raw || !isRecord(raw)) return undefined;
  return sanitizeInvitationData(raw, fallbackDetails);
}

export function restoreHydratedMediaItems(items: MediaItem[]): MediaItem[] {
  return items.map((item) => {
    if (item.status !== "loading" && item.status !== "error") return item;

    const fallbackUrl = item.url || getFallbackThumbnail(item.details);
    const nonFallbackImage = isNonFallbackStudioThumbnailUrl(item.url, item.details);

    const canRecoverReadyState =
      (item.type === "image" && Boolean(item.url)) ||
      (item.type === "page" && Boolean(item.data)) ||
      (item.type === "page" && nonFallbackImage);

    if (canRecoverReadyState) {
      const nextData =
        item.type === "page" && !item.data && nonFallbackImage
          ? sanitizeInvitationData({}, item.details)
          : item.data;

      return {
        ...item,
        status: "ready",
        url: item.url || getFallbackThumbnail(item.details),
        ...(item.type === "page" && nextData !== undefined ? { data: nextData } : {}),
        errorMessage: undefined,
      };
    }

    if (item.status === "loading") {
      return {
        ...item,
        status: "error",
        url: fallbackUrl,
        errorMessage:
          "This item was still generating when Studio closed. Open it in the editor to generate it again.",
      };
    }

    return item;
  });
}

export function sanitizeStudioGenerateResponse(value: unknown): StudioGenerateApiResponse | null {
  if (!isRecord(value)) return null;

  const mode =
    value.mode === "text" || value.mode === "image" || value.mode === "both" ? value.mode : "both";
  const liveCard = normalizeLiveCardMetadata(value.liveCard);
  const invitation = normalizeInvitationText(value.invitation);
  const imageDataUrl =
    typeof value.imageDataUrl === "string" && value.imageDataUrl.startsWith("data:image/")
      ? value.imageDataUrl
      : null;
  const warnings = Array.isArray(value.warnings)
    ? value.warnings.map(readString).filter(Boolean).slice(0, 8)
    : [];
  const errors = isRecord(value.errors)
    ? (() => {
        const nextErrors: NonNullable<StudioGenerateApiResponse["errors"]> = {};
        const textError = sanitizeGenerationError(value.errors.text);
        const imageError = sanitizeGenerationError(value.errors.image);
        if (textError) nextErrors.text = textError;
        if (imageError) nextErrors.image = imageError;
        return Object.keys(nextErrors).length > 0 ? nextErrors : undefined;
      })()
    : undefined;

  const ok = value.ok === true;
  if (!ok) {
    if (!errors) return null;
    return {
      ok: false,
      mode,
      liveCard: null,
      invitation: null,
      imageDataUrl: null,
      warnings,
      errors,
    };
  }

  if (!liveCard && !invitation && !imageDataUrl) return null;

  return {
    ok: true,
    mode,
    liveCard,
    invitation: invitation || liveCard?.invitation || null,
    imageDataUrl,
    warnings,
    errors,
  };
}

import {
  normalizeInvitationText,
  normalizeLiveCardMetadata,
  type StudioGenerateApiResponse,
  type StudioGenerationError,
  type StudioThemeNormalization,
} from "@/lib/studio/types";
import { resolveCoverImageUrlFromEventData } from "@/lib/upload-config";
import {
  buildDescription,
  buildDeterministicScheduleLine,
  buildStudioSubtitleFallback,
  getDisplayTitle,
  getFallbackThumbnail,
  getThemeColors,
  pickFirst,
  resolveStudioCallToAction,
  resolveStudioRsvpMessage,
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
  STUDIO_OPEN_HOUSE_PROPERTY_IMAGE_URL_MAX,
  STUDIO_OPEN_HOUSE_REALTOR_IMAGE_URL_MAX,
  STUDIO_OPEN_HOUSE_REALTOR_LOGO_URL_MAX,
  sanitizeGuestImageUrls,
} from "./studio-workspace-utils";

export { STUDIO_GUEST_IMAGE_URL_MAX } from "./studio-workspace-utils";

function normalizeStudioThemeNormalization(value: unknown): StudioThemeNormalization | null {
  if (!isRecord(value)) return null;
  const riskLevel = readString(value.riskLevel);
  if (riskLevel !== "safe" && riskLevel !== "rewrite" && riskLevel !== "block") return null;
  const visualMotifs = Array.isArray(value.visualMotifs)
    ? value.visualMotifs.map(readString).filter(Boolean).slice(0, 8)
    : [];
  const paletteHints = Array.isArray(value.paletteHints)
    ? value.paletteHints.map(readString).filter(Boolean).slice(0, 8)
    : [];

  return {
    riskLevel,
    originalTheme: readNullableString(value.originalTheme) || null,
    normalizedTheme: readNullableString(value.normalizedTheme) || null,
    visualMotifs,
    paletteHints,
    note: readNullableString(value.note) || null,
  };
}

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
    propertyImageUrls: [],
    realtorImageUrls: [],
    realtorLogoUrls: [],
    message: "",
    specialInstructions: "",
    orientation: "portrait",
    colors: "",
    style: "",
    visualPreferences: "",
    imageFinishPreset: "",
    subjectTransformMode: "default",
    likenessStrength: "balanced",
    visualStyleMode: "editorial_cinematic",
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
    propertyPrice: "",
    bedrooms: "",
    bathrooms: "",
    squareFootage: "",
    neighborhood: "",
    propertyHighlights: "",
    realtorName: "",
    realtorTitle: "",
    brokerageName: "",
    realtorLicense: "",
    listingUrl: "",
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
    value === "Open House" ||
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
    logo: sanitizePoint(value.logo),
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
    "imageFinishPreset",
    "subjectTransformMode",
    "likenessStrength",
    "visualStyleMode",
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
    "propertyPrice",
    "bedrooms",
    "bathrooms",
    "squareFootage",
    "neighborhood",
    "propertyHighlights",
    "realtorName",
    "realtorTitle",
    "brokerageName",
    "realtorLicense",
    "listingUrl",
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
  details.subjectTransformMode =
    value.subjectTransformMode === "premium_makeover" ? "premium_makeover" : "default";
  details.likenessStrength =
    value.likenessStrength === "strict" ||
    value.likenessStrength === "creative" ||
    value.likenessStrength === "balanced"
      ? value.likenessStrength
      : "balanced";
  details.visualStyleMode =
    value.visualStyleMode === "photoreal" ||
    value.visualStyleMode === "playful_stylized" ||
    value.visualStyleMode === "editorial_cinematic"
      ? value.visualStyleMode
      : "editorial_cinematic";
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
  details.propertyImageUrls = sanitizeGuestImageUrls(value.propertyImageUrls).slice(
    0,
    STUDIO_OPEN_HOUSE_PROPERTY_IMAGE_URL_MAX,
  );
  details.realtorImageUrls = sanitizeGuestImageUrls(value.realtorImageUrls).slice(
    0,
    STUDIO_OPEN_HOUSE_REALTOR_IMAGE_URL_MAX,
  );
  details.realtorLogoUrls = sanitizeGuestImageUrls(value.realtorLogoUrls).slice(
    0,
    STUDIO_OPEN_HOUSE_REALTOR_LOGO_URL_MAX,
  );
  if (details.sourceMediaMode === "flyer") {
    details.guestImageUrls = [];
    details.propertyImageUrls = [];
    details.realtorImageUrls = [];
    details.realtorLogoUrls = [];
  } else if (
    details.guestImageUrls.length > 0 ||
    details.propertyImageUrls.length > 0 ||
    details.realtorImageUrls.length > 0 ||
    details.realtorLogoUrls.length > 0
  ) {
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
  const provider = readString(value.provider);
  return {
    code: readString(value.code) || "unknown_error",
    message: readString(value.message) || "Studio generation failed.",
    retryable: typeof value.retryable === "boolean" ? value.retryable : true,
    provider: provider === "openai" ? "openai" : "gemini",
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
    subtitle: readString(value.subtitle) || buildStudioSubtitleFallback(fallbackDetails),
    description:
      readString(value.description) ||
      buildDescription(fallbackDetails) ||
      "Celebrate together with a beautifully designed invitation.",
    scheduleLine: readString(value.scheduleLine) || buildDeterministicScheduleLine(fallbackDetails),
    locationLine:
      readString(value.locationLine) ||
      pickFirst(fallbackDetails.venueName, fallbackDetails.location, "Location TBD"),
    callToAction: resolveStudioCallToAction(
      fallbackDetails,
      readString(value.callToAction),
      fallbackDetails.calloutText,
    ),
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
      rsvpMessage: resolveStudioRsvpMessage(
        fallbackDetails,
        readString(interactiveMetadata?.rsvpMessage),
      ),
      funFacts: Array.isArray(interactiveMetadata?.funFacts)
        ? interactiveMetadata.funFacts.map(readString).filter(Boolean).slice(0, 5)
        : [],
      ctaLabel: resolveStudioCallToAction(
        fallbackDetails,
        readString(interactiveMetadata?.ctaLabel),
        readString(value.callToAction),
      ),
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

  const studioCard = isRecord(data.studioCard) ? data.studioCard : null;
  const studioImage = studioCard ? readString(studioCard.imageUrl) : "";
  if (studioImage) return studioImage;

  return resolveCoverImageUrlFromEventData(data as Record<string, unknown>);
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

function normalizeHistoryStudioCategory(value: unknown): InviteCategory {
  const normalized = readString(value).toLowerCase().replace(/[_-]+/g, " ");
  if (normalized.includes("birthday")) return "Birthday";
  if (normalized.includes("field trip")) return "Field Trip/Day";
  if (normalized.includes("bridal")) return "Bridal Shower";
  if (normalized.includes("wedding")) return "Wedding";
  if (normalized.includes("open house")) return "Open House";
  if (normalized.includes("housewarming")) return "Housewarming";
  if (normalized.includes("baby") || normalized.includes("gender reveal")) return "Baby Shower";
  if (normalized.includes("anniversary")) return "Anniversary";
  if (
    normalized.includes("game day") ||
    normalized.includes("football") ||
    normalized.includes("sport")
  ) {
    return "Game Day";
  }
  return "Custom Invite";
}

function formatHistoryDateInput(value: unknown): string {
  const raw = readString(value);
  if (!raw) return "";
  const dateOnly = raw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (dateOnly) return dateOnly;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function formatHistoryTimeInput(value: unknown): string {
  const raw = readString(value);
  if (!raw) return "";
  const timeOnly = raw.match(/T(\d{2}:\d{2})/)?.[1] || raw.match(/^(\d{2}:\d{2})/)?.[1];
  if (timeOnly) return timeOnly;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(
    2,
    "0",
  )}`;
}

function firstHistoryString(...values: unknown[]): string {
  for (const value of values) {
    const next = readString(value);
    if (next) return next;
  }
  return "";
}

export function createStudioMediaItemFromHistoryRow(row: unknown): MediaItem | null {
  if (!isRecord(row)) return null;
  const eventId = readString(row.id);
  if (!eventId) return null;

  const data = isRecord(row.data) ? row.data : {};
  const studioCard = isRecord(data.studioCard) ? data.studioCard : null;
  const rawInvitationData =
    studioCard && isRecord(studioCard.invitationData) ? studioCard.invitationData : null;
  const rawEventDetails =
    rawInvitationData && isRecord(rawInvitationData.eventDetails)
      ? rawInvitationData.eventDetails
      : null;
  const imageUrl = normalizeStudioLibraryImageUrl(extractHistoryStudioImageUrl(row)) || "";
  if (!imageUrl) return null;

  const title = firstHistoryString(row.title, data.title, rawInvitationData?.title, "Invitation");
  const category = normalizeHistoryStudioCategory(
    firstHistoryString(
      rawEventDetails?.category,
      data.category,
      data.eventType,
      rawInvitationData?.category,
    ),
  );
  const startValue = firstHistoryString(
    rawEventDetails?.eventDate,
    data.startISO,
    data.startAt,
    data.start,
    data.date,
  );
  const endValue = firstHistoryString(data.endISO, data.endAt, data.end);
  const venueName = firstHistoryString(rawEventDetails?.venueName, data.venue, data.placeName);
  const location = firstHistoryString(
    rawEventDetails?.location,
    data.location,
    data.address,
    rawInvitationData?.locationLine,
  );
  const description = firstHistoryString(
    rawEventDetails?.detailsDescription,
    rawInvitationData?.description,
    data.description,
  );
  const rsvp = isRecord(data.rsvp) ? data.rsvp : null;
  const details = sanitizeEventDetails({
    ...rawEventDetails,
    category,
    eventTitle: title,
    eventDate: formatHistoryDateInput(startValue),
    startTime: firstHistoryString(rawEventDetails?.startTime) || formatHistoryTimeInput(startValue),
    endTime: firstHistoryString(rawEventDetails?.endTime) || formatHistoryTimeInput(endValue),
    venueName,
    location,
    rsvpName: firstHistoryString(rawEventDetails?.rsvpName, data.rsvpName, rsvp?.name),
    rsvpContact: firstHistoryString(
      rawEventDetails?.rsvpContact,
      data.rsvpContact,
      data.rsvp,
      rsvp?.contact,
      rsvp?.email,
      rsvp?.phone,
      rsvp?.url,
    ),
    rsvpDeadline: firstHistoryString(
      rawEventDetails?.rsvpDeadline,
      data.rsvpDeadline,
      rsvp?.deadline,
    ),
    detailsDescription: description,
    message: firstHistoryString(rawEventDetails?.message, rawInvitationData?.subtitle),
    theme: firstHistoryString(
      data.themeStyle,
      data.theme,
      data.tone,
      isRecord(rawInvitationData?.theme) ? rawInvitationData.theme.themeStyle : "",
    ),
    registryLink:
      firstHistoryString(rawEventDetails?.registryLink, data.registryLink) ||
      (Array.isArray(data.registries) && isRecord(data.registries[0])
        ? readString(data.registries[0].url)
        : ""),
  });
  const invitationData =
    extractHistoryStudioInvitationData(row, details) ||
    sanitizeInvitationData(
      {
        title,
        description,
        locationLine: location,
        heroTextMode: "image",
        eventDetails: details,
      },
      details,
    );

  return {
    id: `event-${eventId}`,
    type: "page",
    url: imageUrl,
    data: invitationData,
    errorMessage: undefined,
    publishedEventId: eventId,
    sharePath: undefined,
    theme: title,
    status: "ready",
    details,
    createdAt: readString(row.created_at) || readString(row.createdAt) || new Date().toISOString(),
    positions: sanitizePositions(studioCard?.positions || EMPTY_POSITIONS),
  };
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
  const imageUrl =
    typeof value.imageUrl === "string" && value.imageUrl.trim() ? value.imageUrl : null;
  const themeNormalization = normalizeStudioThemeNormalization(value.themeNormalization);
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
      imageUrl: null,
      themeNormalization,
      warnings,
      errors,
    };
  }

  if (!liveCard && !invitation && !imageDataUrl && !imageUrl) return null;

  return {
    ok: true,
    mode,
    liveCard,
    invitation: invitation || liveCard?.invitation || null,
    imageDataUrl,
    imageUrl,
    themeNormalization,
    warnings,
    errors,
  };
}

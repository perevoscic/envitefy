import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import SharedStudioCardPage from "@/components/studio/SharedStudioCardPage";
import { absoluteUrl } from "@/lib/absolute-url";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { sanitizeGuestCopy, sanitizeGuestTitle } from "@/lib/concierge/public-copy";
import { getEventHistoryPublicRenderBySlugOrId } from "@/lib/db";
import { canShowOwnerRsvpDashboard } from "@/lib/owner-rsvp-dashboard";
import { resolveEventCelebrationKind } from "@/utils/event-celebration";
import { buildEventPath, buildStudioCardPath } from "@/utils/event-url";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readFirstString(...values: unknown[]): string {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return "";
}

function readSearchParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? readString(value[0]) : readString(value);
}

function sanitizeInternalReturnHref(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "";
  try {
    const parsed = new URL(value, "https://envitefy.local");
    if (parsed.origin !== "https://envitefy.local") return "";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "";
  }
}

function buildOwnerPreviewSearch(returnHref: string): string {
  if (!returnHref) return "";
  const params = new URLSearchParams();
  params.set("preview", "owner");
  params.set("returnTo", returnHref);
  return `?${params.toString()}`;
}

const CONCIERGE_LIVE_CARD_IMAGE_BY_CATEGORY: Record<string, string> = {
  birthday: "/studio/birthday.webp",
  birthdays: "/studio/birthday.webp",
  wedding: "/studio/wedding.webp",
  weddings: "/studio/wedding.webp",
  "baby shower": "/studio/baby-shower.webp",
  baby_shower: "/studio/baby-shower.webp",
  "baby showers": "/studio/baby-shower.webp",
  "gender reveal": "/studio/baby-shower.webp",
  gender_reveal: "/studio/baby-shower.webp",
  "bridal shower": "/studio/bridal-shower.webp",
  bridal_shower: "/studio/bridal-shower.webp",
  "game day": "/studio/game-day.webp",
  game_day: "/studio/game-day.webp",
  football: "/studio/game-day.webp",
  sport_event: "/studio/game-day.webp",
  "field trip/day": "/studio/field-trip-day.webp",
  field_trip: "/studio/field-trip-day.webp",
  "open house": "/studio/open-house.webp",
  open_house: "/studio/open-house.webp",
  housewarming: "/studio/housewarming.webp",
  anniversary: "/studio/anniversary.webp",
};

function readOutputValues(data: Record<string, unknown>) {
  const outputs = [
    ...(Array.isArray(data.requestedOutputs) ? data.requestedOutputs : []),
    ...(Array.isArray(data.outputs) ? data.outputs : []),
  ].map((value) => readString(value).toLowerCase());
  return outputs;
}

function hasLiveCardOutput(data: Record<string, unknown>) {
  const outputs = readOutputValues(data);
  return outputs.includes("live_card");
}

function resolveConciergeLiveCardImagePath(data: Record<string, unknown>): string {
  const publicEvent = isRecord(data.publicEvent) ? data.publicEvent : null;
  const outputs = readOutputValues(data);
  const primaryOutput = readFirstString(
    publicEvent?.primaryOutput,
    publicEvent?.renderer,
    data.primaryOutput,
    data.productType,
    data.publicRenderer,
  )
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const isLiveCard =
    readString(publicEvent?.renderer).toLowerCase() === "live_card" ||
    outputs.includes("live_card");
  const isCardFirst =
    isLiveCard ||
    outputs.some((output) =>
      [
        "digital_flyer",
        "printable_flyer",
        "invitation",
        "instagram_story",
        "thank_you_card",
        "menu",
        "welcome_sign",
      ].includes(output),
    ) ||
    [
      "digital_flyer",
      "printable_flyer",
      "invitation",
      "instagram_story",
      "thank_you_card",
      "menu",
      "welcome_sign",
    ].includes(primaryOutput);
  if (!isCardFirst) return "";

  const category = readFirstString(data.eventType, data.category).toLowerCase();
  return CONCIERGE_LIVE_CARD_IMAGE_BY_CATEGORY[category] || "/studio/custom-invite.webp";
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

async function normalizeSharedCardImageUrl(value: unknown): Promise<string> {
  const raw = readString(value);
  if (!raw) return "";
  if (raw.startsWith("/")) return absoluteUrl(raw);
  if (!/^https?:\/\//i.test(raw)) return raw;

  try {
    const parsed = new URL(raw);
    if (isLoopbackHostname(parsed.hostname)) {
      return absoluteUrl(`${parsed.pathname}${parsed.search}`);
    }
  } catch {
    return raw;
  }

  return raw;
}

function readGuestImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of value) {
    const s = readString(entry);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 6) break;
  }
  return out;
}

function buildFallbackInvitationData(data: Record<string, unknown>) {
  const eventDetailsRaw = isRecord(data.eventDetails) ? data.eventDetails : null;
  const liveCard = isRecord(data.liveCard) ? data.liveCard : null;
  const publicEvent = isRecord(data.publicEvent) ? data.publicEvent : null;
  const previewCopy = isRecord(data.previewCopy) ? data.previewCopy : null;
  const heroTextMode =
    data.heroTextMode === "overlay" || data.heroTextMode === "image"
      ? data.heroTextMode
      : undefined;
  const title =
    sanitizeGuestTitle(
      readFirstString(liveCard?.headline, publicEvent?.headline, data.headlineTitle, data.title),
    ) || "";
  const subtitle = sanitizeGuestCopy(
    readFirstString(liveCard?.subheadline, publicEvent?.subheadline, previewCopy?.subheadline),
  );
  const description = sanitizeGuestCopy(
    readFirstString(liveCard?.body, publicEvent?.body, previewCopy?.body, data.description),
  );
  const rawDetailsDescription = sanitizeGuestCopy(eventDetailsRaw?.detailsDescription);
  const rawDetailsMessage = sanitizeGuestCopy(eventDetailsRaw?.message);
  const eventTitle =
    sanitizeGuestTitle(
      readFirstString(
        eventDetailsRaw?.eventTitle,
        liveCard?.headline,
        publicEvent?.headline,
        data.headlineTitle,
        data.title,
      ),
    ) || title;
  const scheduleLine = readFirstString(
    liveCard?.scheduleLine,
    publicEvent?.scheduleLine,
    data.scheduleLine,
    data.whenLabel,
  );
  const locationLine = readFirstString(
    liveCard?.locationLine,
    publicEvent?.locationLine,
    data.locationLabel,
    data.placeName,
    data.venue,
    data.location,
  );
  return {
    title: title || "Invitation",
    subtitle,
    description,
    scheduleLine,
    locationLine,
    heroTextMode: heroTextMode || (hasLiveCardOutput(data) ? "image" : undefined),
    theme: {
      themeStyle: readString(data.themeStyle) || "",
    },
    interactiveMetadata: {
      rsvpMessage: "",
      funFacts: [],
      ctaLabel: "",
      shareNote: "",
    },
    eventDetails: {
      category: readString(data.category) || "",
      eventDate: readString(eventDetailsRaw?.eventDate ?? data.startISO).slice(0, 10),
      startTime: readString(eventDetailsRaw?.startTime),
      endTime: readString(eventDetailsRaw?.endTime),
      venueName: readString(eventDetailsRaw?.venueName ?? data.venue),
      location: readString(eventDetailsRaw?.location) || locationLine,
      rsvpName: readString(eventDetailsRaw?.rsvpName),
      rsvpContact: readString(eventDetailsRaw?.rsvpContact ?? data.rsvp),
      rsvpDeadline: readString(eventDetailsRaw?.rsvpDeadline ?? data.rsvpDeadline),
      eventTitle,
      detailsDescription: rawDetailsDescription || description || "",
      guestImageUrls: readGuestImageUrls(eventDetailsRaw?.guestImageUrls),
      message: rawDetailsMessage || subtitle || "",
      registryLink:
        Array.isArray(data.registries) && data.registries[0] && isRecord(data.registries[0])
          ? readString(data.registries[0].url)
          : "",
    },
  };
}

function sanitizeInvitationData(value: Record<string, unknown>): Record<string, unknown> {
  const eventDetails = isRecord(value.eventDetails) ? value.eventDetails : {};
  const interactiveMetadata = isRecord(value.interactiveMetadata) ? value.interactiveMetadata : {};
  const theme = isRecord(value.theme) ? value.theme : {};
  const title = sanitizeGuestTitle(value.title) || sanitizeGuestTitle(eventDetails.eventTitle);
  const subtitle = sanitizeGuestCopy(value.subtitle) || sanitizeGuestCopy(eventDetails.message);
  const description =
    sanitizeGuestCopy(value.description) || sanitizeGuestCopy(eventDetails.detailsDescription);
  return {
    ...value,
    title: title || "Invitation",
    subtitle: subtitle || "",
    description: description || "",
    socialCaption: sanitizeGuestCopy(value.socialCaption) || description || title || "",
    theme: {
      ...theme,
      themeStyle: sanitizeGuestCopy(theme.themeStyle) || "",
    },
    interactiveMetadata: {
      ...interactiveMetadata,
      rsvpMessage: sanitizeGuestCopy(interactiveMetadata.rsvpMessage) || "",
      ctaLabel: sanitizeGuestCopy(interactiveMetadata.ctaLabel) || "",
      shareNote: sanitizeGuestCopy(interactiveMetadata.shareNote) || description || title || "",
    },
    eventDetails: {
      ...eventDetails,
      eventTitle: sanitizeGuestTitle(eventDetails.eventTitle) || title || "Invitation",
      detailsDescription: sanitizeGuestCopy(eventDetails.detailsDescription) || description || "",
      message: sanitizeGuestCopy(eventDetails.message) || subtitle || "",
      specialInstructions: "",
      theme: sanitizeGuestCopy(eventDetails.theme) || "",
      visualPreferences: sanitizeGuestCopy(eventDetails.visualPreferences) || "",
    },
  };
}

function withDirectRsvpInvitationData(args: {
  invitationData: Record<string, unknown>;
  row: Awaited<ReturnType<typeof getEventHistoryPublicRenderBySlugOrId>>;
  title: string;
}) {
  if (!args.row) return args.invitationData;
  const data = isRecord(args.row.data) ? args.row.data : {};
  const rsvp = isRecord(data.rsvp) ? data.rsvp : null;
  const rsvpEnabled =
    data.rsvpEnabled === true ||
    rsvp?.isEnabled === true ||
    rsvp?.enabled === true ||
    rsvp?.direct === true ||
    (typeof data.rsvpEnabled === "string" && data.rsvpEnabled.toLowerCase() === "true");
  if (!rsvpEnabled) return args.invitationData;

  const eventDetails = isRecord(args.invitationData.eventDetails)
    ? args.invitationData.eventDetails
    : {};
  return {
    ...args.invitationData,
    eventDetails: {
      ...eventDetails,
      eventId: args.row.id,
      rsvpEnabled: true,
      rsvpMode: readFirstString(eventDetails.rsvpMode, "envitefy"),
      rsvpName: readFirstString(eventDetails.rsvpName, data.rsvpName, data.hostName, "Host"),
      rsvpUrl: `${buildEventPath(
        args.row.id,
        args.title,
        undefined,
        args.row.public_slug,
      )}#event-rsvp`,
    },
  };
}

async function resolveSharedCard(value: string) {
  const row = await getEventHistoryPublicRenderBySlugOrId({ value, userId: undefined });
  if (!row) return null;

  const data = isRecord(row.data) ? row.data : {};
  const studioCard = isRecord(data.studioCard) ? data.studioCard : null;
  const title = sanitizeGuestTitle(row.title) || sanitizeGuestTitle(data.title) || "Invitation";
  const imageUrl = await normalizeSharedCardImageUrl(
    readString(data.coverImageUrl) ||
      readString(studioCard?.imageUrl) ||
      readString(data.customHeroImage) ||
      readString(data.heroImage) ||
      readString(data.thumbnail) ||
      resolveConciergeLiveCardImagePath(data),
  );

  if (!imageUrl) return null;

  return {
    row,
    title,
    imageUrl,
    invitationData: withDirectRsvpInvitationData({
      invitationData: isRecord(studioCard?.invitationData)
        ? sanitizeInvitationData(studioCard.invitationData)
        : sanitizeInvitationData(buildFallbackInvitationData(data)),
      row,
      title,
    }),
    positions: isRecord(studioCard?.positions) ? studioCard.positions : null,
  };
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const awaitedParams = await props.params;
  const sharedCard = await resolveSharedCard(awaitedParams.id);
  if (!sharedCard) {
    return {
      title: "Shared Card — Envitefy",
      description: "View a shared Envitefy Studio card.",
    };
  }

  const canonical = buildStudioCardPath(
    sharedCard.row.id,
    sharedCard.title,
    undefined,
    sharedCard.row.public_slug,
  );
  const url = await absoluteUrl(canonical);
  const description =
    sanitizeGuestCopy((sharedCard.invitationData as Record<string, unknown>)?.description) ||
    "View a shared Envitefy Studio card.";

  return {
    title: `${sharedCard.title} — Envitefy`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${sharedCard.title} — Envitefy`,
      description,
      url,
      images: [{ url: sharedCard.imageUrl }],
    },
  };
}

export default async function SharedCardPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const awaitedParams = await props.params;
  const awaitedSearchParams = props.searchParams ? await props.searchParams : {};
  const sharedCard = await resolveSharedCard(awaitedParams.id);
  if (!sharedCard) notFound();

  const canonical = buildStudioCardPath(
    sharedCard.row.id,
    sharedCard.title,
    undefined,
    sharedCard.row.public_slug,
  );
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  const isOwner = Boolean(userId && sharedCard.row.user_id && userId === sharedCard.row.user_id);
  const explicitOwnerPreview = readSearchParam(awaitedSearchParams.preview) === "owner";
  const ownerWorkspaceTab = canShowOwnerRsvpDashboard(sharedCard.row.data as any)
    ? "dashboard"
    : "design";
  const ownerWorkspaceHref = `${buildEventPath(
    sharedCard.row.id,
    sharedCard.title,
    undefined,
    sharedCard.row.public_slug,
  )}?tab=${ownerWorkspaceTab}`;
  const returnHref = explicitOwnerPreview
    ? sanitizeInternalReturnHref(readSearchParam(awaitedSearchParams.returnTo)) ||
      ownerWorkspaceHref
    : "";

  if (awaitedParams.id !== canonical.slice("/card/".length)) {
    redirect(`${canonical}${buildOwnerPreviewSearch(returnHref)}`);
  }

  if (isOwner && !explicitOwnerPreview) {
    redirect(ownerWorkspaceHref);
  }

  const shareUrl = await absoluteUrl(canonical);
  const celebrationKind = userId
    ? null
    : resolveEventCelebrationKind(sharedCard.row.data as any, sharedCard.title);

  return (
    <SharedStudioCardPage
      title={sharedCard.title}
      imageUrl={sharedCard.imageUrl}
      invitationData={sharedCard.invitationData as any}
      positions={sharedCard.positions as any}
      shareUrl={shareUrl}
      returnHref={returnHref}
      celebrationKind={celebrationKind}
    />
  );
}

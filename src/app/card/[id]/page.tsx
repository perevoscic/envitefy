import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import SharedStudioCardPage from "@/components/studio/SharedStudioCardPage";
import { absoluteUrl } from "@/lib/absolute-url";
import { getEventHistoryPublicRenderBySlugOrId } from "@/lib/db";
import { buildStudioCardPath } from "@/utils/event-url";

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

const CONCIERGE_LIVE_CARD_IMAGE_BY_CATEGORY: Record<string, string> = {
  birthday: "/studio/birthday.webp",
  birthdays: "/studio/birthday.webp",
  wedding: "/studio/wedding.webp",
  weddings: "/studio/wedding.webp",
  "baby shower": "/studio/baby-shower.webp",
  baby_shower: "/studio/baby-shower.webp",
  "baby showers": "/studio/baby-shower.webp",
};

function hasLiveCardOutput(data: Record<string, unknown>) {
  const outputs = [
    ...(Array.isArray(data.requestedOutputs) ? data.requestedOutputs : []),
    ...(Array.isArray(data.outputs) ? data.outputs : []),
  ].map((value) => readString(value).toLowerCase());
  return outputs.includes("live_card");
}

function resolveConciergeLiveCardImagePath(data: Record<string, unknown>): string {
  const publicEvent = isRecord(data.publicEvent) ? data.publicEvent : null;
  const isLiveCard =
    readString(publicEvent?.renderer).toLowerCase() === "live_card" || hasLiveCardOutput(data);
  if (!isLiveCard) return "";

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
    data.heroTextMode === "overlay" || data.heroTextMode === "image" ? data.heroTextMode : undefined;
  const title = readFirstString(
    liveCard?.headline,
    publicEvent?.headline,
    data.headlineTitle,
    data.title,
  );
  const subtitle = readFirstString(liveCard?.subheadline, publicEvent?.subheadline, previewCopy?.subheadline);
  const description = readFirstString(liveCard?.body, publicEvent?.body, previewCopy?.body, data.description);
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
      detailsDescription: readString(eventDetailsRaw?.detailsDescription) || description,
      guestImageUrls: readGuestImageUrls(eventDetailsRaw?.guestImageUrls),
      message: readString(eventDetailsRaw?.message) || subtitle,
      registryLink:
        Array.isArray(data.registries) && data.registries[0] && isRecord(data.registries[0])
          ? readString(data.registries[0].url)
          : "",
    },
  };
}

async function resolveSharedCard(value: string) {
  const row = await getEventHistoryPublicRenderBySlugOrId({ value, userId: undefined });
  if (!row) return null;

  const data = isRecord(row.data) ? row.data : {};
  const studioCard = isRecord(data.studioCard) ? data.studioCard : null;
  const title = readString(row.title) || readString(data.title) || "Invitation";
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
    invitationData: isRecord(studioCard?.invitationData)
      ? studioCard.invitationData
      : buildFallbackInvitationData(data),
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

  const canonical = buildStudioCardPath(sharedCard.row.id, sharedCard.title);
  const url = await absoluteUrl(canonical);

  return {
    title: `${sharedCard.title} — Envitefy`,
    description:
      readString((sharedCard.invitationData as Record<string, unknown>)?.description) ||
      "View a shared Envitefy Studio card.",
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${sharedCard.title} — Envitefy`,
      description:
        readString((sharedCard.invitationData as Record<string, unknown>)?.description) ||
        "View a shared Envitefy Studio card.",
      url,
      images: [{ url: sharedCard.imageUrl }],
    },
  };
}

export default async function SharedCardPage(props: { params: Promise<{ id: string }> }) {
  const awaitedParams = await props.params;
  const sharedCard = await resolveSharedCard(awaitedParams.id);
  if (!sharedCard) notFound();

  const canonical = buildStudioCardPath(sharedCard.row.id, sharedCard.title);
  if (awaitedParams.id !== canonical.slice("/card/".length)) {
    redirect(canonical);
  }

  const shareUrl = await absoluteUrl(canonical);

  return (
    <SharedStudioCardPage
      title={sharedCard.title}
      imageUrl={sharedCard.imageUrl}
      invitationData={sharedCard.invitationData as any}
      positions={sharedCard.positions as any}
      shareUrl={shareUrl}
    />
  );
}

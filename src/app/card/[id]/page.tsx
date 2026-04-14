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
  const heroTextMode =
    data.heroTextMode === "overlay" || data.heroTextMode === "image" ? data.heroTextMode : undefined;
  return {
    title: readString(data.title) || "Invitation",
    subtitle: readString(data.subtitle) || "",
    description: readString(data.description) || "",
    scheduleLine: readString(data.scheduleLine) || "",
    locationLine: readString(data.locationLine) || "",
    heroTextMode,
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
      location: readString(eventDetailsRaw?.location ?? data.location),
      rsvpName: readString(eventDetailsRaw?.rsvpName),
      rsvpContact: readString(eventDetailsRaw?.rsvpContact ?? data.rsvp),
      rsvpDeadline: readString(eventDetailsRaw?.rsvpDeadline ?? data.rsvpDeadline),
      detailsDescription: readString(eventDetailsRaw?.detailsDescription),
      guestImageUrls: readGuestImageUrls(eventDetailsRaw?.guestImageUrls),
      message: readString(eventDetailsRaw?.message),
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
      readString(data.thumbnail),
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

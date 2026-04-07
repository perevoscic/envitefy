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

function buildFallbackInvitationData(data: Record<string, unknown>) {
  const eventDetailsRaw = isRecord(data.eventDetails) ? data.eventDetails : null;
  return {
    title: readString(data.title) || "Invitation",
    description: readString(data.description) || "",
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
  const imageUrl =
    readString(data.coverImageUrl) ||
    readString(studioCard?.imageUrl) ||
    readString(data.customHeroImage) ||
    readString(data.heroImage) ||
    readString(data.thumbnail);

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

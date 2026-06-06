import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { EventPageRenderer } from "@/features/event-pages/renderer/EventPageRenderer";
import { validateEventPageBlueprint } from "@/features/event-pages/schemas/eventBlueprint.schema";
import { generateDeterministicEventBlueprint } from "@/features/event-pages/ai/generateEventBlueprint";
import { absoluteUrl } from "@/lib/absolute-url";
import {
  getEventHistoryPublicRenderById,
  getEventHistoryPublicRenderBySlugOrId,
  getEventPageBySlug,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getCachedEventPageBySlug = cache(async (slug: string) => getEventPageBySlug(slug));
const getCachedEventHistoryBySlug = cache(async (slug: string) =>
  getEventHistoryPublicRenderBySlugOrId({ value: slug }),
);
const getCachedEventHistoryById = cache(async (id: string) => getEventHistoryPublicRenderById(id));

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || fallback;
}

type PageParams = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const eventPage = await getCachedEventPageBySlug(slug);
  const row = eventPage
    ? await getCachedEventHistoryById(eventPage.event_id)
    : await getCachedEventHistoryBySlug(slug);
  if (!row) return {};
  const data = isRecord(row.data) ? row.data : {};
  const title = readText(data.headlineTitle, row.title || "Event");
  const description = readText(
    data.description || data.subheadline,
    "View this Envitefy event page.",
  );
  const url = await absoluteUrl(`/e/${eventPage?.slug || row.public_slug || slug}`);
  return {
    title: `${title} | Envitefy`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Envitefy",
      type: "website",
    },
  };
}

export default async function DynamicEventPage({ params }: PageParams) {
  const { slug } = await params;
  const eventPage = await getCachedEventPageBySlug(slug);
  const row = eventPage
    ? await getCachedEventHistoryById(eventPage.event_id)
    : await getCachedEventHistoryBySlug(slug);
  if (!row) return notFound();

  const data = isRecord(row.data) ? row.data : {};
  const shareUrl = await absoluteUrl(`/e/${eventPage?.slug || row.public_slug || slug}`);
  const candidate = eventPage?.page_blueprint_json || data.eventPageBlueprint;
  const validated = validateEventPageBlueprint(candidate);
  const blueprint = validated.ok
    ? validated.blueprint
    : generateDeterministicEventBlueprint({
        eventId: row.id,
        title: row.title,
        data,
        shareUrl,
      });

  return (
    <EventPageRenderer
      blueprint={blueprint}
      eventId={row.id}
      title={row.title}
      shareUrl={shareUrl}
    />
  );
}

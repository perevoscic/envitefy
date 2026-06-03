import type { MetadataRoute } from "next";
import { landingLiveCardSnapshots } from "@/components/landing/landing-live-card-snapshots";
import { listPublicEventSitemapRows } from "@/lib/db";
import { buildLandingShowcasePath } from "@/lib/landing-showcase";
import { buildEventProductPath } from "@/utils/event-product-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StaticEntry = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
};

type SitemapEntry = MetadataRoute.Sitemap[number];

const baseUrl = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.PUBLIC_BASE_URL ||
  "https://envitefy.com"
).replace(/\/+$/, "");

const buildTime = process.env.BUILD_TIME ? new Date(process.env.BUILD_TIME) : new Date();

const staticEntries: StaticEntry[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/snap", priority: 0.9, changeFrequency: "weekly" },
  { path: "/gymnastics", priority: 0.9, changeFrequency: "weekly" },
  { path: "/showcase", priority: 0.85, changeFrequency: "weekly" },
  { path: "/studio", priority: 0.8, changeFrequency: "weekly" },
  { path: "/guides", priority: 0.8, changeFrequency: "monthly" },
  { path: "/guides/pdf-to-event-page", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/flyer-to-event-page", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/live-card-invitations", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/rsvp-event-page", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/gymnastics-meet-page", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/share-event-page-without-app", priority: 0.7, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { path: "/who-its-for", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

function readPublicEventSitemapLimit(): number {
  const parsed = Number.parseInt(process.env.PUBLIC_EVENT_SITEMAP_LIMIT || "500", 10);
  if (!Number.isFinite(parsed)) return 500;
  return Math.max(0, Math.min(2000, parsed));
}

async function buildPublicEventUrls(): Promise<SitemapEntry[]> {
  const limit = readPublicEventSitemapLimit();
  if (limit <= 0) return [];

  try {
    const rows = await listPublicEventSitemapRows(limit);
    return rows
      .map((row) => {
        const path = buildEventProductPath({
          eventId: row.id,
          title: row.title,
          data: row.data,
          publicSlug: row.public_slug,
        });
        if (path.startsWith("/smart-signup-form/")) return null;

        return {
          url: `${baseUrl}${path}`,
          lastModified: row.created_at ? new Date(row.created_at) : buildTime,
          changeFrequency: "weekly" as const,
          priority: path.startsWith("/card/") ? 0.65 : 0.7,
        };
      })
      .filter((entry): entry is SitemapEntry => Boolean(entry));
  } catch (error) {
    console.warn("[sitemap] failed to load public event URLs", error);
    return [];
  }
}

function dedupeSitemapEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls = staticEntries.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: buildTime,
    changeFrequency,
    priority,
  }));
  const showcaseUrls = landingLiveCardSnapshots.map((snapshot) => ({
    url: `${baseUrl}${buildLandingShowcasePath(snapshot.slug)}`,
    lastModified: buildTime,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));
  const publicEventUrls = await buildPublicEventUrls();

  return dedupeSitemapEntries([...staticUrls, ...showcaseUrls, ...publicEventUrls]);
}

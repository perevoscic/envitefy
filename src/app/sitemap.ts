import type { MetadataRoute } from "next";
import { landingLiveCardSnapshots } from "@/components/landing/landing-live-card-snapshots";
import { buildLandingShowcasePath } from "@/lib/landing-showcase";

type StaticEntry = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
};

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
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { path: "/who-its-for", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticUrls, ...showcaseUrls];
}

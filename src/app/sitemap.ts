import type { MetadataRoute } from "next";

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
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { path: "/who-its-for", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/subscription", priority: 0.6, changeFrequency: "weekly" },
  { path: "/calendar", priority: 0.5, changeFrequency: "weekly" },
  { path: "/smart-signup-form", priority: 0.5, changeFrequency: "monthly" },
  { path: "/templates/signup", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticEntries.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: buildTime,
    changeFrequency,
    priority,
  }));
}

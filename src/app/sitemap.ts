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
  "https://www.snapmydate.com"
).replace(/\/+$/, "");

const lastModified = new Date();

const staticEntries: StaticEntry[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/landing", priority: 0.7, changeFrequency: "weekly" },
  { path: "/snap", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/subscription", priority: 0.6, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticEntries.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}

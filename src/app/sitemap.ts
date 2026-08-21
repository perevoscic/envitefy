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

const staticEntries: StaticEntry[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/invitation-maker", priority: 0.95, changeFrequency: "weekly" },
  { path: "/snap", priority: 0.9, changeFrequency: "weekly" },
  { path: "/chat", priority: 0.86, changeFrequency: "weekly" },
  { path: "/gymnastics", priority: 0.9, changeFrequency: "weekly" },
  { path: "/weddings", priority: 0.9, changeFrequency: "weekly" },
  { path: "/bridal-showers", priority: 0.82, changeFrequency: "weekly" },
  { path: "/baby-showers", priority: 0.86, changeFrequency: "weekly" },
  { path: "/signup-forms", priority: 0.84, changeFrequency: "weekly" },
  { path: "/gender-reveal", priority: 0.82, changeFrequency: "weekly" },
  { path: "/birthdays", priority: 0.84, changeFrequency: "weekly" },
  { path: "/showcase", priority: 0.85, changeFrequency: "weekly" },
  { path: "/studio", priority: 0.8, changeFrequency: "weekly" },
  { path: "/guides", priority: 0.8, changeFrequency: "monthly" },
  { path: "/guides/pdf-to-event-page", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/flyer-to-event-page", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/live-card-invitations", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/rsvp-event-page", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/gymnastics-meet-page", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/share-event-page-without-app", priority: 0.7, changeFrequency: "monthly" },
  { path: "/guides/smart-signup-forms", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/wedding-event-page", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/birthday-rsvp-invitation", priority: 0.75, changeFrequency: "monthly" },
  { path: "/guides/registry-invitation-page", priority: 0.75, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { path: "/who-its-for", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticEntries.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    changeFrequency,
    priority,
  }));
}

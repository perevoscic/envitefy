import { SPORT_EVENT_PRESETS } from "./sport-event-presets";
import type { ThemedEventDesign } from "./event-page-themed-designs";

export const BRIDAL_PRESETS = [
  {
    id: "champagne-gold",
    name: "Champagne Gold",
    style: "Timeless luxury",
    description: "Warm ivory, champagne details, and an elegant celebration of the bride.",
    heroImage: "/images/landing/hero/garden-brunch-desktop.webp",
    themeId: "golden_hour",
    accent: "#6e5638",
    background: "#f4ede3",
  },
  {
    id: "botanical-sage",
    name: "Botanical Sage",
    style: "Garden",
    description: "A garden gathering with soft sage, brunch details, and thoughtful host notes.",
    heroImage: "/images/landing/hero/galleries/bridal-hero-2.webp",
    themeId: "sage_green",
    accent: "#344c3b",
    background: "#e9efe8",
  },
  {
    id: "rose-quartz",
    name: "Rose Quartz",
    style: "Romantic",
    description: "Blush stationery and romantic lettering for a toast to the bride.",
    heroImage: "/images/landing/hero/galleries/bridal-hero-3.webp",
    themeId: "blush_pink",
    accent: "#6f3842",
    background: "#f8e7e9",
  },
] as const;
export type PublicTemplate = {
  id: string;
  name: string;
  style: string;
  description: string;
  heroImage: string;
  color?: string;
  season?: string;
  audience?: string;
  milestone?: string | number | null;
  sport?: string;
  keywords?: string;
  occasion?: string;
};
export const styleNames = { stadium: "Stadium", club: "Club", tournament: "Tournament" };
export const schoolSignupKeywords =
  "field day school classroom teacher parents pta pto volunteer supplies parent teacher conferences appointments class party classroom party room parent room mom class celebration";

export function matchesPublicTemplateSearch(template: PublicTemplate, query: string): boolean {
  const normalize = (text: string) =>
    text
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const searchable = normalize(
    `${template.name} ${template.description} ${template.style} ${template.audience || ""} ${template.keywords || ""}`,
  );
  return normalize(query)
    .split(/\s+/)
    .every((word) => searchable.includes(word));
}
const sportGalleryArtwork: Record<string, string> = {
  football: "/images/landing/sports/sports-editorial-football.webp",
  baseball: "/images/landing/sports/sports-editorial-baseball.webp",
  softball: "/templates/signup/photographic/sports-and-recreation/baseball-team.webp",
  basketball: "/images/landing/sports/sports-editorial-basketball.webp",
  soccer: "/templates/signup/photographic/sports-and-recreation/soccer-game.webp",
  volleyball: "/templates/signup/photographic/health-and-fitness/volleyball-league.webp",
  tennis: "/templates/signup/photographic/health-and-fitness/tennis-club.webp",
  "track-field": "/templates/signup/photographic/sports-and-recreation/track-meet.webp",
  swimming: "/templates/signup/photographic/sports-and-recreation/swim-team.webp",
  cheerleading: "/templates/signup/photographic/sports-and-recreation/cheer-squad.webp",
  dance: "/templates/signup/photographic/health-and-fitness/dance-class.webp",
};
export function themedEventPublicTemplate(design: ThemedEventDesign): PublicTemplate {
  return {
    id: design.id, name: design.name, style: design.style, description: design.description,
    heroImage: design.artwork,
    sport: design.collection === "bridal-showers" ? undefined : getSportEventPresetLabel(design.collection),
    keywords: `${design.subtype} ${design.tags.join(" ")}`,
  };
}
export function getSportEventPresetLabel(key: string) {
  return SPORT_EVENT_PRESETS.find((sport) => sport.key === key)?.label;
}
export function legacySportPublicTemplate(sport: typeof SPORT_EVENT_PRESETS[number], style: string, label: string): PublicTemplate {
  return {
    id: `${sport.key}--${style}`, name: `${sport.label} · ${label}`, style: label,
    sport: sport.label, description: sport.defaultDetails,
    heroImage: sportGalleryArtwork[sport.key] || "/templates/hero-images/general-sport-hero.jpeg",
  };
}

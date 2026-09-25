export type GalleryArtwork =
  | "football"
  | "soccer"
  | "gymnastics"
  | "cheerleading"
  | "dance"
  | "balloons"
  | "botanicals"
  | "ribbons"
  | "nursery"
  | "sports"
  | "calm"
  | "architecture"
  | "workshop"
  | "paper"
  | "celebration";

type GalleryTheme = {
  artwork: GalleryArtwork;
  wash: string;
  glow: string;
  ink: string;
  accent: string;
};

export const CATEGORY_GALLERY_THEMES = {
  football: {
    artwork: "football",
    wash: "#dce8d9",
    glow: "#f4e9d3",
    ink: "#78927b",
    accent: "#bd9471",
  },
  soccer: {
    artwork: "soccer",
    wash: "#dceee3",
    glow: "#e5eff3",
    ink: "#74968b",
    accent: "#adcab7",
  },
  gymnastics: {
    artwork: "gymnastics",
    wash: "#e7dff3",
    glow: "#f3e7e1",
    ink: "#9a83b0",
    accent: "#cbb2ca",
  },
  cheerleading: {
    artwork: "cheerleading",
    wash: "#f6ded5",
    glow: "#eadef5",
    ink: "#b28ea9",
    accent: "#dab091",
  },
  "dance-ballet": {
    artwork: "dance",
    wash: "#f0dfe4",
    glow: "#eee5f3",
    ink: "#b28e9b",
    accent: "#d1b0bd",
  },
  birthdays: {
    artwork: "balloons",
    wash: "#fff0c9",
    glow: "#f4ddd9",
    ink: "#b89ba9",
    accent: "#dfb58e",
  },
  weddings: {
    artwork: "botanicals",
    wash: "#e4e8d9",
    glow: "#f3e9d9",
    ink: "#92a28c",
    accent: "#cabb98",
  },
  anniversaries: {
    artwork: "ribbons",
    wash: "#efdfd8",
    glow: "#f2e6ce",
    ink: "#ba949a",
    accent: "#c5aa78",
  },
  "bridal-showers": {
    artwork: "botanicals",
    wash: "#f4dfe4",
    glow: "#f3e9dc",
    ink: "#b19c9a",
    accent: "#d8adbc",
  },
  "baby-showers": {
    artwork: "nursery",
    wash: "#e4ebdf",
    glow: "#faf0d6",
    ink: "#9aaa92",
    accent: "#d7bc85",
  },
  "gender-reveal": {
    artwork: "balloons",
    wash: "#c6e1f7",
    glow: "#f6dce7",
    ink: "#82acd3",
    accent: "#dfa9bc",
  },
  "sport-events": {
    artwork: "sports",
    wash: "#e0ecf6",
    glow: "#e8e4f7",
    ink: "#8ba8c4",
    accent: "#b1bbd8",
  },
  appointments: {
    artwork: "calm",
    wash: "#e0f0ed",
    glow: "#e7f1f6",
    ink: "#8cb4b2",
    accent: "#b2ced7",
  },
  "open-house": {
    artwork: "architecture",
    wash: "#ede4d7",
    glow: "#f6eee1",
    ink: "#b3a28d",
    accent: "#cbc1ab",
  },
  workshops: {
    artwork: "workshop",
    wash: "#f3e5d3",
    glow: "#e7e8da",
    ink: "#ad9983",
    accent: "#c1b88f",
  },
  "signup-forms": {
    artwork: "paper",
    wash: "#e4e5f8",
    glow: "#e1efe5",
    ink: "#a29dc3",
    accent: "#a7c3b4",
  },
  general: {
    artwork: "celebration",
    wash: "#e8e0fa",
    glow: "#dcf1f6",
    ink: "#a596c9",
    accent: "#98bfce",
  },
  "special-events": {
    artwork: "celebration",
    wash: "#e8dff5",
    glow: "#e1eefa",
    ink: "#ab96c4",
    accent: "#b0bbd9",
  },
} as const satisfies Record<string, GalleryTheme>;

export type GalleryCategory = keyof typeof CATEGORY_GALLERY_THEMES;

const CATEGORY_ALIASES: Record<string, GalleryCategory> = {
  birthday: "birthdays",
  wedding: "weddings",
  anniversary: "anniversaries",
  "baby-shower": "baby-showers",
  "bridal-shower": "bridal-showers",
  "gender-reveals": "gender-reveal",
  "football-season": "football",
  dance: "dance-ballet",
  ballet: "dance-ballet",
  sports: "sport-events",
  "sport-event": "sport-events",
  "general-events": "general",
  "medical-appointments": "appointments",
  "smart-sign-up": "signup-forms",
};

export function resolveGalleryCategory(category: string): GalleryCategory {
  const key = category
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  if (Object.hasOwn(CATEGORY_GALLERY_THEMES, key)) return key as GalleryCategory;
  return CATEGORY_ALIASES[key] ?? "general";
}

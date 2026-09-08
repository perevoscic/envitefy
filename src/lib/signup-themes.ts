import type { CSSProperties } from "react";
import { getSignupDesign, SIGNUP_DESIGN_PALETTES } from "@/lib/signup-designs";
import type {
  SignupAppearance,
  SignupFontPair,
  SignupForm,
  SignupHeaderLayout,
  SignupThemeId,
} from "@/types/signup";

export type SignupTheme = {
  id: SignupThemeId;
  name: string;
  description: string;
  category: string;
  artwork: string;
  accent: string;
  page: string;
  soft: string;
  ink: string;
  fontPair: SignupFontPair;
  headerLayout: SignupHeaderLayout;
  starterId: string;
};

const artwork = (id: string) => `/templates/signup/editorial/${id}.webp`;
export const SIGNUP_THEMES: readonly SignupTheme[] = [
  {
    id: "clean-clear",
    name: "Clean & Clear",
    description: "A little room to think. Warm paper, quiet blue, and a clear plan.",
    category: "Business & Professional",
    artwork: artwork("clean-clear"),
    accent: "#354B72",
    page: "#F3F2EE",
    soft: "#E8ECF2",
    ink: "#222D40",
    fontPair: "modern",
    headerLayout: "header-3",
    starterId: "workshop",
  },
  {
    id: "harvest-table",
    name: "Harvest Table",
    description: "Something good to share. A warm, welcoming place at the table.",
    category: "Fundraising & Food",
    artwork: artwork("harvest-table"),
    accent: "#8B452D",
    page: "#F7F1E8",
    soft: "#F1E1D5",
    ink: "#432E25",
    fontPair: "editorial",
    headerLayout: "header-3",
    starterId: "potluck",
  },
  {
    id: "school-days",
    name: "School Days",
    description: "Small supplies, big possibilities. A bright start for your classroom.",
    category: "School & Education",
    artwork: artwork("school-days"),
    accent: "#335477",
    page: "#F8F5E9",
    soft: "#ECEAD6",
    ink: "#293A47",
    fontPair: "friendly",
    headerLayout: "header-1",
    starterId: "classroom",
  },
  {
    id: "game-day",
    name: "Game Day",
    description: "For the people behind the team. Every role, ready to go.",
    category: "Sports & Recreation",
    artwork: artwork("game-day"),
    accent: "#25493E",
    page: "#F0F2EC",
    soft: "#E1E9DD",
    ink: "#213C35",
    fontPair: "modern",
    headerLayout: "header-3",
    starterId: "team-snacks",
  },
  {
    id: "community-garden",
    name: "Community Garden",
    description: "Good things grow together. A few helping hands make a difference.",
    category: "Church & Community",
    artwork: artwork("community-garden"),
    accent: "#456044",
    page: "#F2F2E8",
    soft: "#E5E8D8",
    ink: "#2B3F2A",
    fontPair: "editorial",
    headerLayout: "header-1",
    starterId: "volunteers",
  },
  {
    id: "celebrate-together",
    name: "Celebrate Together",
    description: "Make a little occasion of it. Flowers, friends, and thoughtful details.",
    category: "Parties & Events",
    artwork: artwork("celebrate-together"),
    accent: "#794559",
    page: "#F8F0EF",
    soft: "#F0E0E5",
    ink: "#4B3040",
    fontPair: "editorial",
    headerLayout: "header-3",
    starterId: "gathering",
  },
];

export const SIGNUP_HEADER_LAYOUTS: { id: SignupHeaderLayout; name: string }[] = [
  { id: "designed", name: "Original design" },
  { id: "header-3", name: "Wide cover" },
  { id: "header-1", name: "Photo on left" },
  { id: "header-2", name: "Photo on right" },
  { id: "header-4", name: "Cover & portrait" },
  { id: "header-5", name: "Two photos" },
  { id: "header-6", name: "Three photos" },
  { id: "none", name: "Text only" },
];
export const SIGNUP_FONT_PAIRS: {
  id: SignupFontPair;
  name: string;
  heading: string;
  body: string;
}[] = [
  {
    id: "editorial",
    name: "Editorial",
    heading: "var(--font-playfair), Georgia, serif",
    body: '"Josefin Sans", system-ui, sans-serif',
  },
  {
    id: "modern",
    name: "Modern",
    heading: '"Josefin Sans", system-ui, sans-serif',
    body: "system-ui, sans-serif",
  },
  {
    id: "friendly",
    name: "Friendly",
    heading: '"Josefin Slab", Georgia, serif',
    body: '"Josefin Sans", system-ui, sans-serif',
  },
  {
    id: "classic",
    name: "Classic",
    heading: 'Georgia, "Times New Roman", serif',
    body: '"Josefin Sans", system-ui, sans-serif',
  },
  {
    id: "literary",
    name: "Literary",
    heading: 'Georgia, "Times New Roman", serif',
    body: 'Georgia, "Times New Roman", serif',
  },
  {
    id: "display",
    name: "Bold",
    heading: '"Josefin Sans", system-ui, sans-serif',
    body: "system-ui, sans-serif",
  },
];
export const getSignupTheme = (id?: string | null) =>
  SIGNUP_THEMES.find((theme) => theme.id === id);
export function createSignupAppearance(
  id: SignupThemeId,
  designId = `editorial--${id}`,
): SignupAppearance {
  const theme = getSignupTheme(id) || SIGNUP_THEMES[0];
  const design = getSignupDesign(designId);
  return {
    version: 1,
    themeId: theme.id,
    themeRevision: 1,
    ...(design ? { designId: design.id } : {}),
    palette: "original",
    fontPair: design?.fontPair || theme.fontPair,
    headerLayout: design ? "designed" : theme.headerLayout,
    slotLayout: design?.board === "ledger" || design?.board === "menu" ? "rows" : "cards",
    density: "comfortable",
    imagePosition: { x: 50, y: 50 },
  };
}

export function normalizeSignupAppearance(value: unknown): SignupAppearance | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const theme = typeof raw.themeId === "string" ? getSignupTheme(raw.themeId) : null;
  if (!theme) return null;
  const design = typeof raw.designId === "string" ? getSignupDesign(raw.designId) : undefined;
  const base = createSignupAppearance(theme.id, design?.id || "");
  const position =
    raw.imagePosition && typeof raw.imagePosition === "object"
      ? (raw.imagePosition as Record<string, unknown>)
      : {};
  const coordinate = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 50;
  return {
    ...base,
    designId: design?.id,
    palette: raw.palette === "soft" || raw.palette === "ink" ? raw.palette : "original",
    fontPair: SIGNUP_FONT_PAIRS.some((pair) => pair.id === raw.fontPair)
      ? (raw.fontPair as SignupFontPair)
      : base.fontPair,
    headerLayout: SIGNUP_HEADER_LAYOUTS.some((layout) => layout.id === raw.headerLayout)
      ? (raw.headerLayout as SignupHeaderLayout)
      : design
        ? "designed"
        : theme.headerLayout,
    slotLayout: raw.slotLayout === "rows" ? "rows" : "cards",
    density: raw.density === "compact" ? "compact" : "comfortable",
    ...(typeof raw.accent === "string" && /^#[0-9a-f]{6}$/i.test(raw.accent)
      ? { accent: raw.accent }
      : {}),
    imagePosition: { x: coordinate(position.x), y: coordinate(position.y) },
  };
}

export function signupContrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0;
    const rgb = [1, 3, 5]
      .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function applySignupTheme(form: SignupForm, id: SignupThemeId): SignupForm {
  const theme = getSignupTheme(id)!;
  return {
    ...form,
    appearance: createSignupAppearance(id),
    header: {
      ...form.header,
      backgroundColor: null,
      backgroundCss: null,
      textColor1: null,
      textColor2: null,
      templateId:
        theme.headerLayout === "none" || theme.headerLayout === "designed"
          ? "header-3"
          : theme.headerLayout,
      backgroundImage: { name: theme.name, type: "image/webp", dataUrl: theme.artwork },
      images: [],
    },
  };
}

export function resolveSignupThemeStyle(form: SignupForm): CSSProperties {
  const appearance = normalizeSignupAppearance(form.appearance);
  const theme = getSignupTheme(appearance?.themeId) || SIGNUP_THEMES[0];
  const design = getSignupDesign(appearance?.designId);
  const colors = design ? SIGNUP_DESIGN_PALETTES[design.palette] : theme;
  const font =
    SIGNUP_FONT_PAIRS.find((pair) => pair.id === appearance?.fontPair) || SIGNUP_FONT_PAIRS[0];
  const custom = appearance?.accent;
  const accent =
    custom && signupContrast(custom, "#FFFFFF") >= 4.5
      ? custom
      : appearance?.palette === "ink"
        ? colors.ink
        : colors.accent;
  return {
    "--signup-page": appearance
      ? appearance.palette === "soft"
        ? colors.soft
        : colors.page
      : form.header?.backgroundColor || "#F5F5F4",
    "--signup-surface": design ? SIGNUP_DESIGN_PALETTES[design.palette].surface : "#FFFFFF",
    "--signup-text": appearance ? colors.ink : "#222D40",
    "--signup-muted": design ? `color-mix(in srgb, ${colors.ink} 80%, ${colors.page})` : "#5D625F",
    "--signup-border": design ? `color-mix(in srgb, ${colors.ink} 24%, ${colors.page})` : "#DEDCD5",
    "--signup-accent": accent,
    "--signup-on-accent": "#FFFFFF",
    "--signup-soft": colors.soft,
    "--signup-secondary": design ? SIGNUP_DESIGN_PALETTES[design.palette].secondary : theme.soft,
    "--signup-focus": accent,
    "--signup-heading-font": font.heading,
    "--signup-body-font": font.body,
    "--signup-radius": appearance?.slotLayout === "rows" ? "0.5rem" : "1rem",
    "--signup-slot-padding": appearance?.density === "compact" ? "0.75rem" : "1rem",
    "--signup-gap": appearance?.density === "compact" ? "0.5rem" : "0.85rem",
  } as CSSProperties;
}

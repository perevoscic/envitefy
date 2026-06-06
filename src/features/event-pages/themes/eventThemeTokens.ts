import type { EventTheme } from "../schemas/eventBlueprint.schema";

export type EventThemeCssVariables = {
  "--event-page-bg": string;
  "--event-page-bg-soft": string;
  "--event-page-surface": string;
  "--event-page-primary": string;
  "--event-page-secondary": string;
  "--event-page-text": string;
  "--event-page-muted": string;
  "--event-page-border": string;
  "--event-page-radius": string;
  "--event-page-section-gap": string;
  "--event-page-card-gap": string;
  "--event-page-heading-font": string;
  "--event-page-body-font": string;
};

export const EVENT_THEME_DEFAULTS: EventTheme = {
  mood: "intentional",
  formality: "semi_formal",
  visualDensity: "medium",
  palette: "envitefy_balanced",
  typography: "clean",
  heroStyle: "dashboard",
  sectionRhythm: "balanced",
  backgroundTreatment: "soft_gradient",
  colors: {
    primary: "#5B4DCC",
    secondary: "#F3B3C8",
    background: "#F8F6FF",
    surface: "#FFFFFF",
    text: "#1F2233",
    mutedText: "#606579",
  },
};

export const SECTION_GAP_BY_RHYTHM = {
  compact: "1rem",
  balanced: "1.5rem",
  spacious: "2.25rem",
} as const;

export const CARD_GAP_BY_DENSITY = {
  low: "1.25rem",
  medium: "0.875rem",
  high: "0.625rem",
} as const;

export const RADIUS_BY_FORMALITY = {
  casual: "20px",
  semi_formal: "14px",
  formal: "8px",
} as const;

export const FONT_BY_TYPOGRAPHY = {
  clean: {
    heading: "var(--font-josefin-sans), ui-sans-serif, system-ui, sans-serif",
    body: "var(--font-josefin-sans), ui-sans-serif, system-ui, sans-serif",
  },
  rounded: {
    heading: "var(--font-josefin-sans), ui-sans-serif, system-ui, sans-serif",
    body: "var(--font-josefin-sans), ui-sans-serif, system-ui, sans-serif",
  },
  editorial: {
    heading: "Georgia, 'Times New Roman', serif",
    body: "var(--font-josefin-sans), ui-sans-serif, system-ui, sans-serif",
  },
  classic: {
    heading: "Georgia, 'Times New Roman', serif",
    body: "Georgia, 'Times New Roman', serif",
  },
} as const;

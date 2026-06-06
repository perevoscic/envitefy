import type { CSSProperties } from "react";
import type { EventTheme } from "../schemas/eventBlueprint.schema";
import {
  CARD_GAP_BY_DENSITY,
  EVENT_THEME_DEFAULTS,
  FONT_BY_TYPOGRAPHY,
  RADIUS_BY_FORMALITY,
  SECTION_GAP_BY_RHYTHM,
  type EventThemeCssVariables,
} from "./eventThemeTokens";

const HEX_RE = /^#[0-9a-f]{6}$/i;

function safeColor(value: string | undefined, fallback: string): string {
  return value && HEX_RE.test(value) ? value.toUpperCase() : fallback;
}

function mixWithWhite(hex: string, amount: number): string {
  const clean = safeColor(hex, EVENT_THEME_DEFAULTS.colors.background).slice(1);
  const n = Number.parseInt(clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `#${[mix(r), mix(g), mix(b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function buildCssVariablesFromTheme(theme: EventTheme): EventThemeCssVariables {
  const colors = theme.colors || EVENT_THEME_DEFAULTS.colors;
  const fonts = FONT_BY_TYPOGRAPHY[theme.typography] || FONT_BY_TYPOGRAPHY.clean;
  const background = safeColor(colors.background, EVENT_THEME_DEFAULTS.colors.background);
  return {
    "--event-page-bg": background,
    "--event-page-bg-soft": mixWithWhite(background, 0.55),
    "--event-page-surface": safeColor(colors.surface, EVENT_THEME_DEFAULTS.colors.surface),
    "--event-page-primary": safeColor(colors.primary, EVENT_THEME_DEFAULTS.colors.primary),
    "--event-page-secondary": safeColor(colors.secondary, EVENT_THEME_DEFAULTS.colors.secondary),
    "--event-page-text": safeColor(colors.text, EVENT_THEME_DEFAULTS.colors.text),
    "--event-page-muted": safeColor(colors.mutedText, EVENT_THEME_DEFAULTS.colors.mutedText),
    "--event-page-border": mixWithWhite(safeColor(colors.primary, EVENT_THEME_DEFAULTS.colors.primary), 0.78),
    "--event-page-radius": RADIUS_BY_FORMALITY[theme.formality] || RADIUS_BY_FORMALITY.semi_formal,
    "--event-page-section-gap":
      SECTION_GAP_BY_RHYTHM[theme.sectionRhythm] || SECTION_GAP_BY_RHYTHM.balanced,
    "--event-page-card-gap": CARD_GAP_BY_DENSITY[theme.visualDensity] || CARD_GAP_BY_DENSITY.medium,
    "--event-page-heading-font": fonts.heading,
    "--event-page-body-font": fonts.body,
  };
}

export function buildEventThemeStyle(theme: EventTheme): CSSProperties {
  return buildCssVariablesFromTheme(theme) as CSSProperties;
}

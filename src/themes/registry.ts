import type {
  ThemeDefinition,
  ThemeKey,
  ThemeVariant,
  ThemeVariantDefinition,
} from "./types";
import { THEME_KEYS } from "./types";

const DEFAULT_THEME_KEY: ThemeKey = "general";

function vars(input: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    out[`--${key}`] = value;
  }
  return out;
}

const generalLight: ThemeVariantDefinition = {
  label: "General Light",
  cssVariables: {
    ...vars({
      background: "#F6ECE1",
      surface: "#FBF7F2",
      "surface-alt": "#F0E2D7",
      foreground: "#2B1B16",
      card: "#FFFFFF",
      "card-foreground": "#2B1B16",
      popover: "#FFFFFF",
      "popover-foreground": "#2B1B16",
      muted: "#F4EDF8",
      "field-background": "#FFFFFF",
      "surface-raised": "#FFFFFF",
      placeholder: "#737083",
      input: "#D9C5B8",
      ring: "#7052C1",
      "focus-ring": "#7052C1",
      "navigation-foreground": "#251B47",
      "navigation-muted": "#61597C",
      "accent-soft": "#F4EDF8",
      "primary-foreground": "#FFFFFF",
      "primary-hover": "#B47B58",
      "primary-active": "#9F6948",
      "secondary-foreground": "#FDFAF7",
      "accent-foreground": "#2B1B16",
      destructive: "#C15F5A",
      "destructive-foreground": "#FFFFFF",
      "muted-foreground": "#6A5549",
      border: "#D9C5B8",
      primary: "#C98F6B",
      secondary: "#6B4C3F",
      accent: "#E5C2A7",
      success: "#3F8A7A",
      info: "#5F7CB5",
      warning: "#D17A45",
      error: "#C15F5A",
      "on-primary": "#FFFFFF",
      "on-secondary": "#FDF6F0",
      "on-accent": "#2B1B16",
      "theme-overlay": "rgba(201, 143, 107, 0.12)",
      "theme-overlay-secondary": "rgba(107, 76, 63, 0.12)",
      "theme-card-glow": "rgba(191, 135, 103, 0.3)",
      "theme-hero-gradient":
        "radial-gradient(90% 90% at 20% -10%, rgba(255, 200, 120, 0.95), transparent 60%), radial-gradient(100% 110% at 80% 0%, rgba(255, 125, 85, 0.75), transparent 65%), radial-gradient(120% 140% at 50% 120%, rgba(50, 130, 170, 0.6), transparent 65%), radial-gradient(120% 140% at 0% 90%, rgba(15, 84, 132, 0.55), transparent 65%), linear-gradient(180deg, rgba(248, 190, 108, 0.4), rgba(112, 171, 211, 0.85))",
    }),
  },
  accentIcon: undefined,
  accentAlt: "Confetti illustration",
};

const generalDark: ThemeVariantDefinition = {
  label: "General Dark",
  cssVariables: {
    ...vars({
      background: "#181818",
      surface: "#251F2D",
      "surface-alt": "#302738",
      "surface-raised": "#382D42",
      card: "#251F2D",
      "card-foreground": "#F2EAFA",
      popover: "#382D42",
      "popover-foreground": "#F2EAFA",
      foreground: "#F2EAFA",
      muted: "#302738",
      "muted-foreground": "#C0B3D0",
      placeholder: "#B2A4C1",
      "field-background": "#302738",
      border: "#51435F",
      input: "#857294",
      ring: "#C5A7FF",
      "focus-ring": "#C5A7FF",
      "navigation-foreground": "#F2C6DE",
      "navigation-muted": "#CDB5C8",
      primary: "#C5A7FF",
      "primary-hover": "#D3BAFF",
      "primary-active": "#B590F2",
      "primary-foreground": "#25103E",
      secondary: "#302738",
      "secondary-foreground": "#F2EAFA",
      accent: "#382D42",
      "accent-soft": "#382D42",
      "accent-foreground": "#F2EAFA",
      destructive: "#FFA7B5",
      "destructive-foreground": "#422A34",
      success: "#80D8B3",
      "success-background": "#203A32",
      info: "#90C7F4",
      "info-background": "#233649",
      warning: "#F2C879",
      "warning-background": "#3D3222",
      error: "#FFA7B5",
      "error-background": "#422A34",
      "on-primary": "#25103E",
      "on-secondary": "#F2EAFA",
      "on-accent": "#F2EAFA",
      "mobile-chrome-top": "#181818",
      "mobile-chrome-bottom": "#181818",
      "ios-browser-chrome-background": "#181818",
      "mobile-chrome-top-clouds": "none",
      "mobile-chrome-bottom-clouds": "none",
      "mobile-browser-surface-gradient": "none",
      "theme-overlay": "rgba(197, 167, 255, 0.12)",
      "theme-overlay-secondary": "rgba(35, 58, 78, 0.18)",
      "theme-card-glow": "rgba(197, 167, 255, 0.12)",
      "theme-hero-gradient":
        "linear-gradient(180deg, transparent, #211B2A 88%), linear-gradient(110deg, #462F4D, #233A4E)",
    }),
  },
  accentIcon: undefined,
  accentAlt: "Night confetti illustration",
};

const GENERAL_THEME: ThemeDefinition = {
  key: DEFAULT_THEME_KEY,
  label: "General",
  description: "Default Envitefy experience with teal + indigo accent colors.",
  order: 0,
  variants: {
    light: generalLight,
    dark: generalDark,
  },
};

export function getThemeDefinition(_key: ThemeKey): ThemeDefinition {
  return GENERAL_THEME;
}

export function resolveThemeCssVariables(
  key: ThemeKey,
  variant: ThemeVariant
): Record<string, string> {
  const theme = getThemeDefinition(key);
  return (
    theme.variants[variant]?.cssVariables ?? theme.variants.light.cssVariables
  );
}

export function listThemesSorted(): ThemeDefinition[] {
  return [GENERAL_THEME];
}

export function isValidThemeKey(value: unknown): value is ThemeKey {
  return typeof value === "string" && (THEME_KEYS as string[]).includes(value);
}

export function isValidVariant(value: unknown): value is ThemeVariant {
  return value === "light" || value === "dark";
}

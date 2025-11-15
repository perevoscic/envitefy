import {
  ThemeDefinition,
  ThemeKey,
  ThemeVariant,
  ThemeVariantDefinition,
  THEME_KEYS,
} from "./types";

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
      background: "#1C1B1A",
      surface: "#272625",
      "surface-alt": "#2F2D2C",
      foreground: "#F8F8F9",
      "muted-foreground": "#B0ADAA",
      border: "#3D3C3B",
      primary: "#2DD4BF",
      secondary: "#818CF8",
      accent: "#C084FC",
      success: "#4ADE80",
      info: "#60A5FA",
      warning: "#FB923C",
      error: "#F87171",
      "on-primary": "#052725",
      "on-secondary": "#0E1036",
      "on-accent": "#2B063C",
      "theme-overlay": "rgba(129, 140, 248, 0.16)",
      "theme-overlay-secondary": "rgba(45, 212, 191, 0.12)",
      "theme-card-glow": "rgba(192, 132, 252, 0.22)",
      "theme-hero-gradient":
        "radial-gradient(140% 140% at 0% -10%, rgba(192,132,252,0.28), transparent 70%), radial-gradient(100% 80% at 90% 10%, rgba(45,212,191,0.24), transparent 75%)",
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

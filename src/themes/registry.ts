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
      background: "#FFFBF7",
      surface: "#FFFFFF",
      "surface-alt": "#F8F5F1",
      foreground: "#3F3C3C",
      "muted-foreground": "#6F6C69",
      border: "#E4DED4",
      primary: "#2DD4BF",
      secondary: "#6366F1",
      accent: "#A855F7",
      success: "#22C55E",
      info: "#3B82F6",
      warning: "#F97316",
      error: "#EF4444",
      "on-primary": "#FFFFFF",
      "on-secondary": "#FFFFFF",
      "on-accent": "#FFFFFF",
      "theme-overlay": "rgba(45, 212, 191, 0.12)",
      "theme-overlay-secondary": "rgba(99, 102, 241, 0.10)",
      "theme-card-glow": "rgba(168, 85, 247, 0.16)",
      "theme-hero-gradient":
        "radial-gradient(120% 120% at 10% -10%, rgba(99,102,241,0.12), transparent 60%), radial-gradient(80% 60% at 80% 0%, rgba(45,212,191,0.18), transparent 70%)",
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

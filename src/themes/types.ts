export type ThemeVariant = "light" | "dark";

export type ThemeKey =
  | "general"
  | "halloween"
  | "thanksgiving"
  | "christmas"
  | "new-years"
  | "valentines"
  | "st-patricks"
  | "easter"
  | "childrens-day"
  | "independence-day"
  | "labor-day";

export const THEME_KEYS: ThemeKey[] = [
  "general",
  "halloween",
  "thanksgiving",
  "christmas",
  "new-years",
  "valentines",
  "st-patricks",
  "easter",
  "childrens-day",
  "independence-day",
  "labor-day",
];

export type ThemeCssVariables = Record<string, string>;

export type ThemeVariantDefinition = {
  label: string;
  cssVariables: ThemeCssVariables;
  accentIcon: string; // relative path to svg/png served from /public
  accentAlt: string;
};

export type ThemeDefinition = {
  key: ThemeKey;
  label: string;
  description: string;
  order: number;
  variants: Record<ThemeVariant, ThemeVariantDefinition>;
  scheduleSummary: string;
};

export type ThemeOverride = {
  themeKey: ThemeKey;
  variant: ThemeVariant;
  expiresAt?: string | null;
};

export type ThemeWindow = {
  key: ThemeKey;
  label: string;
  start: Date;
  end: Date;
};


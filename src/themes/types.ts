export type ThemeVariant = "light" | "dark";

export type ThemeKey = "general";

export const THEME_KEYS: ThemeKey[] = ["general"];

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
};


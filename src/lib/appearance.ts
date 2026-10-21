import type { ThemePreference, ThemeVariant } from "../themes/types";
import { resolveThemeCssVariables } from "../themes/registry";

export const APPEARANCE_STORAGE_KEY = "envitefy:appearance:v1";
export const APPEARANCE_CHANGE_EVENT = "envitefy:appearance-changed";

export function normalizeAppearance(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveAppearance(preference: ThemePreference, deviceDark: boolean): ThemeVariant {
  return preference === "system" ? (deviceDark ? "dark" : "light") : preference;
}

export function applyAppearance(preference: ThemePreference, deviceDark: boolean): ThemeVariant {
  const variant = resolveAppearance(preference, deviceDark);
  const root = document.documentElement;
  // Clear every variant's properties first: returning to light must restore CSS
  // defaults for properties (such as safe-area clouds) only defined by dark.
  for (const mode of ["light", "dark"] as const) {
    for (const property of Object.keys(resolveThemeCssVariables("general", mode))) {
      root.style.removeProperty(property);
    }
  }
  for (const [property, value] of Object.entries(resolveThemeCssVariables("general", variant))) {
    root.style.setProperty(property, value);
  }
  root.dataset.theme = `general-${variant}`;
  root.dataset.themeKey = "general";
  root.dataset.appearancePreference = preference;
  root.classList.toggle("dark", variant === "dark");
  root.style.colorScheme = variant;
  root.style.backgroundColor = "var(--background)";
  window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT));
  return variant;
}

/** Runs synchronously before the page's content, using the authoritative palette. */
export function buildAppearanceBootstrap(): string {
  const palettes = JSON.stringify({
    light: resolveThemeCssVariables("general", "light"),
    dark: resolveThemeCssVariables("general", "dark"),
  }).replaceAll("<", "\\u003c");
  return `(function(){var p='system';try{var s=localStorage.getItem('${APPEARANCE_STORAGE_KEY}');if(s==='light'||s==='dark')p=s;}catch(e){}var v=p==='system'?(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;var r=document.documentElement,t=${palettes};Object.keys(t.light).concat(Object.keys(t.dark)).forEach(function(k){r.style.removeProperty(k)});Object.keys(t[v]).forEach(function(k){r.style.setProperty(k,t[v][k])});r.dataset.theme='general-'+v;r.dataset.themeKey='general';r.dataset.appearancePreference=p;r.classList.toggle('dark',v==='dark');r.style.colorScheme=v;r.style.backgroundColor='var(--background)';document.querySelectorAll('meta[name="color-scheme"]').forEach(function(m){m.content=v});if(v==='dark')document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content='#181818'});})();`;
}

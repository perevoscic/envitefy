import type { CSSProperties } from "react";
import {
  IMPORTED_THEME_FONTS,
  readImportedEventTheme,
  themeHash,
  type ImportedEventTheme,
} from "./imported-event-theme";
import { colorContrast } from "./color-contrast";

export function activeImportedTheme(value: unknown) {
  const theme = readImportedEventTheme(value);
  return theme?.enabled ? theme : null;
}
export function importedThemeStyle(value: unknown): CSSProperties | undefined {
  const theme = activeImportedTheme(value);
  if (!theme) return undefined;
  const { colors: c } = theme;
  const readableAccent = colorContrast(c.accent, c.page) >= 4.5 ? c.accent : c.ink;
  return {
    backgroundColor: c.page,
    backgroundImage: `radial-gradient(ellipse at top right, ${c.secondary}18, transparent 55%)`,
    color: c.ink,
    "--event-paper": c.page,
    "--event-surface": c.surface,
    "--event-ink": c.ink,
    "--event-accent": c.accent,
    "--event-on-accent": c.onAccent,
    "--event-font": IMPORTED_THEME_FONTS[theme.font],
    "--gym-paper": c.page,
    "--gym-ink": c.ink,
    "--gym-accent": readableAccent,
    "--gym-font": IMPORTED_THEME_FONTS[theme.font],
    "--ft-ink": c.ink,
    "--ft-accent": readableAccent,
    "--ft-paper": c.surface,
    "--ft-ground": c.page,
    "--ft-font": IMPORTED_THEME_FONTS[theme.font],
    "--program-radius": theme.shape === "angular" ? "0.25rem" : "1.5rem",
    "--program-card-radius": theme.shape === "angular" ? "0.25rem" : "1rem",
  } as CSSProperties;
}
export function importedSportsTheme(value: unknown) {
  const theme = activeImportedTheme(value);
  return theme
    ? {
        id: theme.id,
        name: theme.name,
        bg: "bg-[color:var(--event-paper)]",
        text: "text-[color:var(--event-ink)]",
        accent: "text-[color:var(--event-ink)]",
        preview: "bg-white",
        bgStyle: importedThemeStyle(theme),
      }
    : null;
}
export function importedFootballChrome<T extends Record<string, any>>(
  chrome: T,
  value: unknown,
): T {
  if (!activeImportedTheme(value)) return chrome;
  return {
    ...chrome,
    pageClass: "min-h-screen bg-[color:var(--event-paper)] text-[color:var(--event-ink)]",
    shellClass:
      "overflow-hidden rounded-3xl border border-black/10 bg-[color:var(--event-paper)] shadow-xl",
    textClass: "text-[color:var(--event-ink)]",
    accentClass: "text-[color:var(--event-ink)]",
    mutedClass: "text-[color:var(--event-ink)] opacity-75",
    summaryCardClass: "rounded-2xl border border-black/10 bg-[color:var(--event-surface)] p-5",
    navShellClass: "flex gap-2 overflow-x-auto rounded-2xl bg-[color:var(--event-surface)] p-2",
    navActiveClass:
      "min-h-11 rounded-xl bg-[color:var(--event-accent)] px-4 py-3 text-[color:var(--event-on-accent)]",
    navIdleClass: "min-h-11 rounded-xl px-4 py-3 text-[color:var(--event-ink)] hover:underline",
  };
}
const escapeXml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!,
  );

/** Original, local vector artwork. No source markup, image editing, or generation request. */
export function importedArtworkSrc(
  value: unknown,
  customImage?: string | null,
  templateImage?: string | null,
): string | undefined {
  const theme = activeImportedTheme(value);
  if (!theme || (customImage && customImage !== templateImage))
    return customImage || templateImage || undefined;
  if (theme.artworkUrl) return theme.artworkUrl;
  // Keep the actual template photo while original generation is pending/failed.
  if (templateImage) return templateImage;
  const { accent, secondary, page, ink } = theme.colors;
  const hash = themeHash(theme.id);
  const offset = 50 + (hash % 120);
  const motif: Record<ImportedEventTheme["motif"], string> = {
    gymnastics:
      '<path d="M-220-20H220V15H-220Z" stroke-width="18"/><path d="M-150 15L-175 190M150 15L175 190M-220 190H-125M125 190H220" stroke-width="16"/><path d="M-240 220H240" stroke-width="24"/>',
    field:
      '<rect x="-210" y="-155" width="420" height="310" rx="30"/><path d="M0-155V155M-210-110H-160V110H-210M210-110H160V110H210"/><ellipse cx="0" cy="0" rx="65" ry="90"/><path d="M-30 0H30M-20-25V25M0-25V25M20-25V25" stroke-width="7"/>',
    court:
      '<circle r="180"/><path d="M-180 0H180M0-180V180M-126-126C40-130 130-40 126 126M126-126C-40-130-130-40-126 126"/>',
    water:
      '<path d="M-240 10Q-180-65-120 10T0 10 120 10 240 10M-240 90Q-180 15-120 90T0 90 120 90 240 90M-240 170Q-180 95-120 170T0 170 120 170 240 170"/><circle cx="0" cy="-100" r="38"/><path d="M-100-70L-20-130 90-60 170-125"/>',
    track:
      '<path d="M-60-200H60A160 160 0 0 1 60 200H-60A160 160 0 0 1-60-200ZM-60-150H60A110 110 0 0 1 60 150H-60A110 110 0 0 1-60-150ZM-60-100H60A60 60 0 0 1 60 100H-60A60 60 0 0 1-60-100Z"/>',
    ribbon:
      '<path d="M-180 170C-290-60 140-290 190-70S-250 180-70 30 240-90 160 180" stroke-width="26"/><circle cx="-135" cy="-155" r="20" fill="currentColor" stroke="none"/>',
  };
  const city = escapeXml(theme.context.city.toUpperCase());
  const sport = escapeXml(theme.context.sport.replace(/[_-]/g, " ").toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 800"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="${secondary}"/></linearGradient><pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${page}" opacity=".24"/></pattern></defs><path fill="url(#g)" d="M0 0H1440V800H0z"/><path fill="url(#dots)" d="M0 0H1440V800H0z"/><circle cx="${1050 + offset}" cy="250" r="430" fill="none" stroke="${page}" stroke-width="1" opacity=".4"/><circle cx="${1050 + offset}" cy="250" r="370" fill="none" stroke="${page}" stroke-width="36" opacity=".09"/><path d="M-100 680L660-80M-80 790L790-80" stroke="${page}" stroke-width="48" opacity=".1"/><rect x="72" y="68" width="6" height="72" fill="${page}"/><text x="100" y="100" font-family="Arial,sans-serif" font-weight="700" font-size="24" letter-spacing="5" fill="${theme.colors.onAccent}">${sport}</text>${city ? `<text x="100" y="134" font-family="Arial,sans-serif" font-size="18" letter-spacing="3" fill="${theme.colors.onAccent}">${city}</text>` : ""}<g transform="translate(920 420) rotate(${hash % 2 ? -8 : 8})" fill="none" stroke="${page}" color="${page}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">${motif[theme.motif]}</g><path d="M72 700H460" stroke="${page}" stroke-width="2"/><text x="72" y="740" font-family="Arial,sans-serif" font-size="14" letter-spacing="7" fill="${theme.colors.onAccent}">THE MOMENT IS YOURS</text><circle cx="1320" cy="700" r="26" fill="${ink}" opacity=".16"/></svg>`;
  // Catalog image frames have different crops. Keep visible lettering in the page's HTML.
  const artwork = svg
    .replace(/<text\b[\s\S]*?<\/text>/g, "")
    .replace("<defs>", `<title>${sport}${city ? ` · ${city}` : ""}</title><defs>`);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(artwork)}`;
}

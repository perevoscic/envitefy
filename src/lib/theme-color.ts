const BRAND_THEME_COLOR = "#7F67D3";
const BRAND_BACKGROUND_COLOR = "#F8F5FF";
const GYMNASTICS_THEME_COLOR = "#7C5CDB";
const FOOTBALL_THEME_COLOR = "#1F5A45";
const EVENT_THEME_COLOR_FALLBACK = BRAND_THEME_COLOR;

export type ThemeColorSource = "route" | "hero" | "event" | "default";

export type ThemeColorDefinition = {
  color: string;
  source: ThemeColorSource;
};

export const THEME_COLOR_META_NAME = "theme-color";
export const THEME_COLOR_SELECTOR = 'meta[name="theme-color"]';
export const HERO_THEME_COLOR_ATTRIBUTE = "data-theme-color";

const EVENT_ROUTE_PATTERN = /^\/event(?:\/|$)/;

function normalizeColor(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(trimmed)) return trimmed;
  if (/^rgb(a)?\(/i.test(trimmed)) return trimmed;
  if (/^hsl(a)?\(/i.test(trimmed)) return trimmed;
  return null;
}

export function getThemeColorForPath(pathname?: string | null): string {
  const path = pathname || "/";

  if (path === "/gymnastics" || path.startsWith("/event/gymnastics")) {
    return GYMNASTICS_THEME_COLOR;
  }

  if (path === "/football" || path.startsWith("/event/football")) {
    return FOOTBALL_THEME_COLOR;
  }

  if (EVENT_ROUTE_PATTERN.test(path)) {
    return EVENT_THEME_COLOR_FALLBACK;
  }

  return BRAND_THEME_COLOR;
}

export function getThemeColorDefinitionForPath(
  pathname?: string | null,
): ThemeColorDefinition {
  const color = getThemeColorForPath(pathname);
  const source: ThemeColorSource = pathname
    ? EVENT_ROUTE_PATTERN.test(pathname)
      ? "event"
      : pathname === "/gymnastics" || pathname.startsWith("/event/gymnastics")
        ? "route"
        : pathname === "/football" || pathname.startsWith("/event/football")
          ? "route"
          : "default"
    : "default";

  return { color, source };
}

export function resolveEventThemeColor(input?: unknown): string {
  if (!input || typeof input !== "object") return EVENT_THEME_COLOR_FALLBACK;
  const data = input as Record<string, unknown>;
  const theme = typeof data.theme === "object" && data.theme ? (data.theme as Record<string, unknown>) : null;
  const event = typeof data.event === "object" && data.event ? (data.event as Record<string, unknown>) : null;
  const imageColors =
    typeof data.imageColors === "object" && data.imageColors
      ? (data.imageColors as Record<string, unknown>)
      : null;
  const flyerColors =
    typeof data.flyerColors === "object" && data.flyerColors
      ? (data.flyerColors as Record<string, unknown>)
      : null;

  const candidateColors = [
    data.themeColor,
    theme?.color,
    theme?.accentColor,
    data.accentColor,
    data.color,
    event?.themeColor,
    event?.accentColor,
    event?.color,
    imageColors?.headerDark,
    imageColors?.headerLight,
    flyerColors?.themeColor,
    flyerColors?.accentColor,
    flyerColors?.dominant,
  ];

  for (const candidate of candidateColors) {
    const normalized = normalizeColor(
      typeof candidate === "string"
        ? extractSolidColor(candidate)
        : null,
    );
    if (normalized) return normalized;
  }

  return EVENT_THEME_COLOR_FALLBACK;
}

function extractSolidColor(value: string): string | null {
  const direct = normalizeColor(value);
  if (direct) return direct;

  const hexMatch = value.match(/#[0-9a-f]{3,8}/i);
  if (hexMatch) return hexMatch[0];

  const rgbMatch = value.match(/rgba?\([^\)]+\)/i);
  if (rgbMatch) return rgbMatch[0];

  const hslMatch = value.match(/hsla?\([^\)]+\)/i);
  if (hslMatch) return hslMatch[0];

  return null;
}

export function setThemeColor(color: string) {
  if (typeof document === "undefined") return;
  const normalized = normalizeColor(extractSolidColor(color) || color);
  if (!normalized) return;

  let meta = document.querySelector<HTMLMetaElement>(THEME_COLOR_SELECTOR);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", THEME_COLOR_META_NAME);
    document.head.appendChild(meta);
  }

  if (meta.content !== normalized) {
    meta.content = normalized;
  }
}

export function getHeroThemeColor(): string | null {
  if (typeof document === "undefined") return null;
  const hero = document.querySelector<HTMLElement>(`[${HERO_THEME_COLOR_ATTRIBUTE}]`);
  return normalizeColor(hero?.getAttribute(HERO_THEME_COLOR_ATTRIBUTE));
}

export function getPreferredThemeColor(pathname?: string | null): string {
  return getHeroThemeColor() || getThemeColorForPath(pathname);
}

export const themeColorPalette = {
  brand: BRAND_THEME_COLOR,
  background: BRAND_BACKGROUND_COLOR,
  gymnastics: GYMNASTICS_THEME_COLOR,
  football: FOOTBALL_THEME_COLOR,
  eventFallback: EVENT_THEME_COLOR_FALLBACK,
} as const;

// TODO: When server-side dominant-color extraction for event flyers becomes stable,
// prefer a persisted event.branding.themeColor value before generic fallback colors.

import { colorContrast } from "./color-contrast.ts";

export type SourceBranding = {
  version: 1;
  origin: "website" | "pdf" | "image";
  colors: string[];
  font?: string;
  tone?: "dark" | "light" | "mixed";
  sourceUrl?: string;
};
export const IMPORTED_THEME_FONTS = {
  athletic: '"Event Athletic", "Arial Narrow", sans-serif',
  editorial: '"Event Editorial", Georgia, serif',
  modern: '"Event Modern", Arial, sans-serif',
  technical: '"Event Technical", monospace',
} as const;
export type ImportedEventTheme = {
  version: 1;
  enabled: boolean;
  id: string;
  revision: number;
  name: string;
  context: { title: string; sport: string; city: string; seed: string; venue?: string; address?: string; date?: string };
  /** Generate original artwork while retaining a deliberately selected template's presentation. */
  preserveTemplateStyle?: true;
  /** Accent roles only; template surfaces and typography remain authored. */
  templateColorCombination?: { templateId: string; index: number };
  branding: SourceBranding | null;
  colors: {
    page: string;
    surface: string;
    ink: string;
    accent: string;
    secondary: string;
    onAccent: string;
  };
  font: keyof typeof IMPORTED_THEME_FONTS;
  motif: "gymnastics" | "field" | "court" | "water" | "track" | "ribbon";
  shape: "rounded" | "angular" | "arched";
  artworkUrl?: string;
};
const hex = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  return match
    ? `#${(match[1].length === 3 ? [...match[1]].map((char) => char + char).join("") : match[1]).toLowerCase()}`
    : null;
};
const clean = (value: unknown, max = 160) =>
  typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f]/g, " ")
        .trim()
        .slice(0, max)
    : "";
export function importedArtworkUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2000) return undefined;
  if (/^\/(?:api\/blob\/|media\/event-media\/)[\w./-]+$/.test(value) && !value.split("/").includes("..")) return value;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}

/** Generated sports artwork is public; its display must not depend on a database lookup. */
export function importedArtworkDisplayUrl(value: unknown): string | undefined {
  const url = importedArtworkUrl(value);
  return url?.startsWith("/api/blob/event-media/")
    ? `/media/event-media/${url.slice("/api/blob/event-media/".length)}`
    : url;
}
export function themeHash(value: string): number {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function readSourceBranding(value: unknown): SourceBranding | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as SourceBranding;
  if (
    raw.version !== 1 ||
    !["website", "pdf", "image"].includes(raw.origin) ||
    !Array.isArray(raw.colors)
  )
    return null;
  return {
    version: 1,
    origin: raw.origin,
    colors: [...new Set(raw.colors.map(hex).filter((color): color is string => !!color))].slice(
      0,
      6,
    ),
    ...(clean(raw.font, 100) ? { font: clean(raw.font, 100) } : {}),
    ...(["dark", "light", "mixed"].includes(String(raw.tone))
      ? { tone: raw.tone as SourceBranding["tone"] }
      : {}),
    ...(typeof raw.sourceUrl === "string" && /^https?:\/\//i.test(raw.sourceUrl)
      ? { sourceUrl: raw.sourceUrl.slice(0, 2000) }
      : {}),
  };
}
export function readImportedEventTheme(value: unknown): ImportedEventTheme | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as ImportedEventTheme;
  if (
    raw.version !== 1 ||
    typeof raw.enabled !== "boolean" ||
    !raw.context ||
    !raw.colors ||
    !Number.isInteger(raw.revision) ||
    raw.revision < 0 ||
    raw.revision > 1000 ||
    !Object.hasOwn(IMPORTED_THEME_FONTS, raw.font) ||
    !["gymnastics", "field", "court", "water", "track", "ribbon"].includes(raw.motif) ||
    !["rounded", "angular", "arched"].includes(raw.shape)
  )
    return null;
  const colors = Object.fromEntries(
    ["page", "surface", "ink", "accent", "secondary", "onAccent"].map((key) => [
      key,
      hex(raw.colors[key as keyof typeof raw.colors]),
    ]),
  ) as ImportedEventTheme["colors"];
  if (
    Object.values(colors).some((color) => !color) ||
    [colors.page, colors.surface].some((color) => colorContrast(colors.ink, color) < 4.5) ||
    colorContrast(colors.accent, colors.onAccent) < 4.5
  )
    return null;
  if (!clean(raw.id) || !clean(raw.context.seed)) return null;
  return {
    version: 1,
    enabled: raw.enabled,
    id: clean(raw.id),
    revision: raw.revision,
    name: clean(raw.name),
    context: {
      title: clean(raw.context.title),
      sport: clean(raw.context.sport, 60),
      city: clean(raw.context.city, 100),
      seed: clean(raw.context.seed),
      ...(clean(raw.context.venue, 240) ? { venue: clean(raw.context.venue, 240) } : {}),
      ...(clean(raw.context.address, 400) ? { address: clean(raw.context.address, 400) } : {}),
      ...(clean(raw.context.date, 160) ? { date: clean(raw.context.date, 160) } : {}),
    },
    ...(raw.preserveTemplateStyle === true ? { preserveTemplateStyle: true as const } : {}),
    ...(raw.templateColorCombination && clean(raw.templateColorCombination.templateId) &&
      Number.isInteger(raw.templateColorCombination.index) && raw.templateColorCombination.index >= 0 && raw.templateColorCombination.index < 6
      ? { templateColorCombination: { templateId: clean(raw.templateColorCombination.templateId), index: raw.templateColorCombination.index } } : {}),
    branding: readSourceBranding(raw.branding),
    colors,
    font: raw.font,
    motif: raw.motif,
    shape: raw.shape,
    ...(importedArtworkUrl(raw.artworkUrl)
      ? { artworkUrl: importedArtworkUrl(raw.artworkUrl) }
      : {}),
  };
}
function mix(color: string, target: string, fraction: number) {
  return `#${[0, 2, 4]
    .map((index) =>
      Math.round(
        parseInt(color.slice(index + 1, index + 3), 16) * (1 - fraction) +
          parseInt(target.slice(index + 1, index + 3), 16) * fraction,
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
function relativeLuminance(color: string) {
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(color.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
const profiles = [
  { match: /gymnastics/i, motif: "gymnastics", color: "#127c94", font: "editorial" },
  { match: /swim|water|rowing|surf/i, motif: "water", color: "#087f8c", font: "modern" },
  { match: /dance|ballet|cheer|skating/i, motif: "ribbon", color: "#914767", font: "editorial" },
  {
    match: /basketball|volleyball|tennis|pickleball|badminton/i,
    motif: "court",
    color: "#b95525",
    font: "athletic",
  },
  {
    match: /track|running|cross.country|cycling/i,
    motif: "track",
    color: "#3459a1",
    font: "modern",
  },
  { match: /./, motif: "field", color: "#25705c", font: "athletic" },
] as const;

/** A stable, bounded design recipe; source prose can never become CSS or executable markup. */
export function createImportedEventTheme(input: {
  title: string;
  sport: string;
  city?: string;
  venue?: string;
  address?: string;
  date?: string;
  seed: string;
  branding?: unknown;
  hostNotes?: string;
  revision?: number;
}): ImportedEventTheme {
  const context = {
    title: clean(input.title),
    sport: clean(input.sport, 60) || "sport",
    city: clean(input.city, 100),
    seed: clean(input.seed),
    ...(clean(input.venue, 240) ? { venue: clean(input.venue, 240) } : {}),
    ...(clean(input.address, 400) ? { address: clean(input.address, 400) } : {}),
    ...(clean(input.date, 160) ? { date: clean(input.date, 160) } : {}),
  };
  const revision = Math.min(1000, Math.max(0, Math.trunc(input.revision || 0)));
  const hash = themeHash(
    `${context.seed}|${context.title}|${context.sport}|${context.city}|${revision}${context.venue || context.date ? `|${context.venue || ""}|${context.date || ""}` : ""}${context.address ? `|${context.address}` : ""}`,
  );
  const shapeIndex =
    (themeHash(`${context.seed}|${context.title}|${context.sport}|${context.city}|0`) + revision) %
    3;
  const profile =
    profiles.find((item) => item.match.test(context.sport)) || profiles[profiles.length - 1];
  const branding = readSourceBranding(input.branding);
  const hostColors =
    (input.hostNotes || "")
      .match(/\b(?:colou?rs?|palette)\s*[:=]\s*((?:#[\da-f]{3,6}[,\s]*){1,4})/i)?.[1]
      .match(/#[\da-f]{3,6}/gi)
      ?.map(hex)
      .filter((color): color is string => !!color) || [];
  const palette = hostColors.length ? hostColors : branding?.colors || [];
  const darkSource = branding?.tone === "dark";
  const sourceGround = darkSource
    ? palette
        .filter((color) => relativeLuminance(color) < 0.16)
        .sort((a, b) => relativeLuminance(a) - relativeLuminance(b))[0]
    : undefined;
  const accent = darkSource
    ? palette.find((color) => relativeLuminance(color) >= 0.2) || profile.color
    : palette[0] || profile.color;
  const secondary =
    palette.find((color) => color !== accent && color !== sourceGround) ||
    mix(accent, hash % 2 ? "#e6b15d" : "#254363", 0.5);
  const page = sourceGround || mix(accent, "#ffffff", 0.96);
  const surface = darkSource ? mix(page, "#ffffff", 0.08) : mix(secondary, "#ffffff", 0.94);
  const ink = darkSource ? "#fff8f4" : "#142431";
  const sourceFont = branding?.font?.toLowerCase() || "";
  const font =
    /serif|playfair|georgia|cormorant/.test(sourceFont) && !/sans-serif/.test(sourceFont)
      ? "editorial"
      : /mono/.test(sourceFont)
        ? "technical"
        : /oswald|anton|condensed|bebas/.test(sourceFont)
          ? "athletic"
          : /inter|manrope|arial|helvetica|franklin|roboto|open sans|montserrat|sans-serif/.test(
                sourceFont,
              ) && !revision
            ? "modern"
            : revision
              ? ([profile.font, "modern", "editorial", "athletic"] as const)[hash % 4]
              : profile.font;
  return {
    version: 1,
    enabled: true,
    id: `event-theme-${hash.toString(36)}`,
    revision,
    name: `${context.title || context.sport}${context.city ? ` · ${context.city}` : ""}`,
    context,
    branding,
    colors: {
      page,
      surface,
      ink,
      accent,
      secondary,
      onAccent: colorContrast(accent, "#ffffff") >= 4.5 ? "#ffffff" : "#000000",
    },
    font,
    motif: profile.motif,
    shape: (["rounded", "angular", "arched"] as const)[shapeIndex],
  };
}
export type TemplateAccentPalette = {
  id: string;
  name: string;
  background: string;
  foreground: string;
  accent: string;
};

/** Accent choices start from the event's saved palette, including generated dark pages. */
export function importedEventAccentPalette(palette: TemplateAccentPalette, value: unknown): TemplateAccentPalette {
  const theme = readImportedEventTheme(value);
  if (!theme?.enabled || theme.preserveTemplateStyle) return palette;
  const { page, ink, accent } = theme.colors;
  // Keep the source hue even when it needs contrast correction for text. Replacing
  // it with body ink here makes every generated alternative inherit the same ink.
  return { ...palette, name: "Custom", background: page, foreground: ink, accent };
}

function accentLch(color: string) {
  const [r, g, b] = [1, 3, 5].map(offset => {
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const axisB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { hue: Math.atan2(axisB, a) * 180 / Math.PI, chroma: Math.hypot(a, axisB) };
}

/** OKLCH keeps hue spacing perceptually useful; reduce chroma to fit sRGB without clipping hues. */
function accentHex(hue: number, chroma: number, lightness: number) {
  let channels: number[] = [];
  for (let step = 0; step <= 24; step++) {
    const a = chroma * Math.cos(hue * Math.PI / 180), b = chroma * Math.sin(hue * Math.PI / 180);
    const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
    channels = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    if (channels.every(channel => channel >= 0 && channel <= 1)) break;
    chroma *= 0.85;
  }
  return `#${channels.map(channel => {
    const value = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0");
  }).join("")}`;
}

/** Six hue-related accent recipes; the saved surfaces, body ink and artwork stay intact. */
export function templateAccentColorCombinations(palette: TemplateAccentPalette) {
  const { background, foreground, accent } = palette;
  // Links and titles also sit on the template's lightly tinted information panels.
  const surfaces = [background, mix(accent, background, 0.92), mix(accent, background, 0.84)];
  const readable = (color: string) => {
    for (let step = 0; step <= 20; step++) {
      const candidate = mix(color, foreground, step / 20);
      if (surfaces.every(surface => colorContrast(candidate, surface) >= 4.5)) return candidate;
    }
    return foreground;
  };
  const base = readable(accent);
  const source = accentLch(accent);
  // Neutral themes get restrained tinted alternatives, rather than unrelated bright colors.
  const neutral = source.chroma < 0.015;
  const chroma = neutral ? 0.035 : Math.min(0.18, Math.max(0.12, source.chroma));
  const hue = neutral ? accentLch(foreground).hue : source.hue;
  const dark = relativeLuminance(background) < 0.18;
  const tone = (offset: number, strength = 1, lightnessOffset = 0) => {
    const initial = Math.max(0, Math.min(1, (dark ? 0.78 : 0.48) + lightnessOffset));
    // Correct lightness along the same hue instead of mixing every choice into body ink.
    for (let step = 0; step <= 100; step++) {
      const lightness = initial + ((dark ? 1 : 0) - initial) * step / 100;
      const candidate = accentHex(hue + offset, chroma * strength, lightness);
      if (surfaces.every(surface => colorContrast(candidate, surface) >= 4.5)) return candidate;
    }
    return foreground;
  };
  const vivid = tone(0), adjacent = tone(-36), soft = tone(36, 0.6, dark ? 0.08 : 0.06);
  const complement = tone(160), split = tone(208);
  return [
    { name: "Original", button: foreground, heading: foreground, link: base },
    { name: "Vivid", button: vivid, heading: vivid, link: tone(-12) },
    { name: "Analogous", button: adjacent, heading: adjacent, link: vivid },
    { name: "Soft", button: soft, heading: soft, link: tone(22, 0.75) },
    { name: "Complement", button: vivid, heading: complement, link: complement },
    { name: "Split tone", button: split, heading: split, link: vivid },
  ].map((colors, index) => {
    let inverseHeading = mix(background, colors.heading, index ? 0.25 : 0);
    for (let step = 0; colorContrast(inverseHeading, foreground) < 4.5 && step <= 20; step++) {
      inverseHeading = mix(inverseHeading, background, step / 20);
    }
    return { ...colors, index, inverseHeading,
      onButton: colorContrast(colors.button, "#ffffff") >= 4.5 ? "#ffffff" : "#000000",
    };
  });
}

/** Color changes retain the artwork job identity, typography and saved media. */
export function importedEventThemeColorCombinations(theme: ImportedEventTheme) {
  const palettes = [
    { name: "Rose & violet", accent: "#ff78b7", secondary: "#b787ff", page: "#111b3a", surface: "#202b49", ink: "#fff8fc" },
    { name: "Ocean blue", accent: "#036f86", secondary: "#3b66ae", page: "#f0f8fc", surface: "#ffffff", ink: "#142431" },
    { name: "Emerald & gold", accent: "#17624f", secondary: "#b38a27", page: "#f2f8f3", surface: "#ffffff", ink: "#142d25" },
    { name: "Berry & blush", accent: "#9c3158", secondary: "#945f98", page: "#fff3f6", surface: "#ffffff", ink: "#36202e" },
    { name: "Midnight & gold", accent: "#f0c66c", secondary: "#8faff2", page: "#131d30", surface: "#202d43", ink: "#fff8eb" },
  ].map(({ name, ...colors }) => ({ name, colors: {
    ...colors,
    onAccent: colorContrast(colors.accent, "#ffffff") >= 4.5 ? "#ffffff" : "#000000",
  } }));
  const usesPreset = palettes.some(({ colors }) => Object.entries(colors).every(([key, color]) => theme.colors[key as keyof typeof colors] === color));
  const original = usesPreset
    ? createImportedEventTheme({ ...theme.context, branding: theme.branding }).colors
    : theme.colors;
  return [{ name: "Event colors", colors: original }, ...palettes];
}

export function redesignImportedEventTheme(theme: ImportedEventTheme) {
  const next = createImportedEventTheme({
    ...theme.context,
    branding: theme.branding,
    hostNotes: `palette: ${theme.colors.accent}, ${theme.colors.secondary}`,
    revision: theme.revision + 1,
  });
  return theme.motif === "gymnastics" && theme.artworkUrl ? { ...next, artworkUrl: theme.artworkUrl } : next;
}

/** Read a locality printed in an address; never infer it from a meet or venue name. */
export function importedArtworkCity(city: unknown, address?: unknown): string {
  const explicit = clean(city, 100);
  if (explicit) return explicit;
  const parts = (typeof address === "string" ? address.slice(0, 500) : "")
    .split(/[,\r\n]+/).map((part) => clean(part, 100)).filter(Boolean);
  const states = /^(?:AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)(?:\s+\d{5}(?:-\d{4})?)?$/i;
  for (let index = 1; index < parts.length; index++) {
    const locality = parts[index - 1];
    if (states.test(parts[index]) && /^[\p{L}][\p{L} .'-]{1,79}$/u.test(locality))
      return `${locality}, ${parts[index].slice(0, 2).toUpperCase()}`;
  }
  return "";
}

/** Add identity once. An explicit save, a host's choice or a retained theme always wins. */
export function attachImportedEventTheme(input: {
  currentData: Record<string, any>;
  mappedData: Record<string, any>;
  workflow: string;
  activityProfile?: string | null;
  sourceUrl?: string | null;
  sourceText?: string;
  hostNotes?: string;
  branding?: unknown;
}) {
  const { currentData, mappedData } = input;
  const city = importedArtworkCity(mappedData.city, mappedData.address);
  const hasSelectedTemplate = Boolean(currentData.templateEditor || currentData.manualEditor);
  // Native gymnastics drafts start with null before any import or image choice.
  const initialGymTemplate = input.workflow === "gymnastics" && hasSelectedTemplate && currentData.importedTheme === null;
  if (Object.hasOwn(currentData, "importedTheme") && !initialGymTemplate)
    return { ...mappedData, importedTheme: currentData.importedTheme };
  if (hasSelectedTemplate && input.workflow !== "gymnastics") return mappedData;
  return {
    ...mappedData,
    ...(city ? { city } : {}),
    importedTheme: {
      ...createImportedEventTheme({
        title: mappedData.title || currentData.title || "Sports event",
        sport:
          input.activityProfile ||
          mappedData.activityProfile ||
          (input.workflow === "sports" ? mappedData.customFields?.sport : input.workflow) ||
          "sport",
        city,
        venue: mappedData.venue || "",
        address: mappedData.address || "",
        date: mappedData.date || mappedData.startISO || mappedData.startAt || "",
        branding: input.branding,
        hostNotes: input.hostNotes,
        seed: `${input.sourceUrl || "document"}|${mappedData.date || mappedData.startAt || ""}|${themeHash(input.sourceText || "")}`,
      }),
      ...(hasSelectedTemplate ? { preserveTemplateStyle: true as const } : {}),
    },
  };
}

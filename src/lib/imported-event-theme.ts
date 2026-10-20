import { colorContrast } from "./color-contrast";

export type SourceBranding = {
  version: 1;
  origin: "website" | "pdf" | "image";
  colors: string[];
  font?: string;
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
  context: { title: string; sport: string; city: string; seed: string };
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
  if (/^\/api\/blob\/[\w./-]+$/.test(value) && !value.split("/").includes("..")) return value;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
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
    },
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
  };
  const revision = Math.min(1000, Math.max(0, Math.trunc(input.revision || 0)));
  const hash = themeHash(
    `${context.seed}|${context.title}|${context.sport}|${context.city}|${revision}`,
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
  const accent = palette[0] || profile.color;
  const secondary = palette[1] || mix(accent, hash % 2 ? "#e6b15d" : "#254363", 0.5);
  const page = mix(accent, "#ffffff", 0.96);
  const surface = mix(secondary, "#ffffff", 0.94);
  const ink = "#142431";
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
export function redesignImportedEventTheme(theme: ImportedEventTheme) {
  return createImportedEventTheme({
    ...theme.context,
    branding: theme.branding,
    hostNotes: `palette: ${theme.colors.accent}, ${theme.colors.secondary}`,
    revision: theme.revision + 1,
  });
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
  if (Object.hasOwn(currentData, "importedTheme"))
    return { ...mappedData, importedTheme: currentData.importedTheme };
  if (currentData.templateEditor || currentData.manualEditor) return mappedData;
  return {
    ...mappedData,
    importedTheme: createImportedEventTheme({
      title: mappedData.title || currentData.title || "Sports event",
      sport:
        input.activityProfile ||
        mappedData.activityProfile ||
        (input.workflow === "sports" ? mappedData.customFields?.sport : input.workflow) ||
        "sport",
      city: mappedData.city || "",
      branding: input.branding,
      hostNotes: input.hostNotes,
      seed: `${input.sourceUrl || "document"}|${mappedData.date || mappedData.startAt || ""}|${themeHash(input.sourceText || "")}`,
    }),
  };
}

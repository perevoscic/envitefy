import { parseCalendarDateTimeToIso } from "./calendar-date-time";
import { normalizeEventGuestActions, type EventGuestActionVisibility } from "./event-guest-actions";
import { colorContrast } from "./color-contrast";
import { GALLERY_FONT_PAIRS, LIBRARY_FONT_PAIRS, type GalleryFontPairId } from "./font-library";

export const CUSTOM_EVENT_CATEGORIES = {
  general: "General Events",
  birthdays: "Birthdays",
  weddings: "Weddings",
  anniversaries: "Anniversaries",
  "baby-showers": "Baby Showers",
  "bridal-showers": "Bridal Showers",
  "gender-reveal": "Gender Reveal",
  gymnastics: "Gymnastics",
  football: "Football",
  "sport-events": "Sports",
  soccer: "Soccer",
  cheerleading: "Cheerleading",
  "dance-ballet": "Dance / Ballet",
  appointments: "Appointments",
  workshops: "Workshops",
  "special-events": "Special Events",
} as const;
export type CustomEventCategory = keyof typeof CUSTOM_EVENT_CATEGORIES;
export function customEventCategory(value: unknown): CustomEventCategory | null {
  return typeof value === "string" && Object.hasOwn(CUSTOM_EVENT_CATEGORIES, value)
    ? (value as CustomEventCategory)
    : null;
}
export const EVENT_DESIGN_LAYOUTS = ["split", "banner", "poster", "editorial"] as const;
type EventDesignFontId = "editorial" | "modern" | "classic" | "friendly" | GalleryFontPairId;
export const EVENT_DESIGN_FONTS: Record<EventDesignFontId, string> = {
  editorial: '"Playfair Display", Georgia, serif',
  modern: '"Space Grotesk", Arial, sans-serif',
  classic: 'Georgia, "Times New Roman", serif',
  friendly: '"Nunito", Arial, sans-serif',
  ...Object.fromEntries([...GALLERY_FONT_PAIRS, ...LIBRARY_FONT_PAIRS].map((pair) => [pair.id, pair.heading])) as Record<GalleryFontPairId, string>,
} as const;
export const EVENT_DESIGN_FONT_PAIRS = [
  ...(["editorial", "modern", "classic", "friendly"] as const).map((id) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    heading: EVENT_DESIGN_FONTS[id],
    body: "system-ui, sans-serif",
  })),
  ...GALLERY_FONT_PAIRS,
  ...LIBRARY_FONT_PAIRS,
];
export const EVENT_DESIGN_PROMPT_LIMIT = 12000;
export const EVENT_DESIGN_REFERENCE_LIMIT = 2 * 1024 * 1024;
export type EventCustomDesign = {
  version: 1;
  name: string;
  description: string;
  layout: (typeof EVENT_DESIGN_LAYOUTS)[number];
  font: keyof typeof EVENT_DESIGN_FONTS;
  colors: { page: string; surface: string; ink: string; accent: string };
};
export const EVENT_DETAIL_FIELDS = [
  "title",
  "description",
  "date",
  "time",
  "endDate",
  "endTime",
  "timezone",
  "venue",
  "location",
  "host",
  "rsvpEmail",
  "rsvpPhone",
] as const;
export type CustomEventDetails = Record<(typeof EVENT_DETAIL_FIELDS)[number], string> & {
  guestActions?: EventGuestActionVisibility;
  rsvpEnabled: boolean;
  sections: Array<{ title: string; body: string }>;
  registryLinks: Array<{ label: string; url: string }>;
};
export type CustomEventPage = {
  version: 1;
  category: CustomEventCategory;
  design: EventCustomDesign;
  artwork: string;
  details: CustomEventDetails;
};
export const emptyCustomEventDetails = (): CustomEventDetails => ({
  ...(Object.fromEntries(EVENT_DETAIL_FIELDS.map((field) => [field, ""])) as Record<
    (typeof EVENT_DETAIL_FIELDS)[number],
    string
  >),
  rsvpEnabled: false,
  sections: [],
  registryLinks: [],
});
export function customEventWording(details: CustomEventDetails): string[] {
  return [
    details.title,
    details.description,
    ...details.sections.flatMap((section) => [section.title, section.body]),
  ];
}
export function applyCustomEventWording(
  details: CustomEventDetails,
  wording: unknown,
): CustomEventDetails {
  const before = customEventWording(details);
  if (!Array.isArray(wording) || wording.length !== before.length)
    throw new Error("The wording could not be prepared. Please try again.");
  const protectedValues = (text: string) =>
    (
      text.match(
        /https?:\/\/[^\s<>]+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\d+(?:[./:-]\d+)*|\b[ap]\.?m\.?\b/gi,
      ) || []
    )
      .map((value) => value.replace(/[.,;!?]+$/, "").toLowerCase())
      .sort();
  const polished = before.map((original, index) => {
    const next = wording[index];
    if (
      typeof next !== "string" ||
      next.length > 6000 ||
      Boolean(original.trim()) !== Boolean(next.trim()) ||
      JSON.stringify(protectedValues(original)) !== JSON.stringify(protectedValues(next))
    )
      throw new Error("The wording changed an event detail. Please try again.");
    return next.trim();
  });
  return {
    ...details,
    title: polished[0],
    description: polished[1],
    sections: details.sections.map((section, i) => ({
      ...section,
      title: polished[2 + i * 2],
      body: polished[3 + i * 2],
    })),
  };
}
const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
export function safeEventLink(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2000) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function normalizeEventCustomDesign(value: unknown): EventCustomDesign | null {
  const raw = record(value),
    colors = record(raw?.colors);
  if (
    raw?.version !== 1 ||
    typeof raw.name !== "string" ||
    !raw.name.trim() ||
    raw.name.length > 80 ||
    typeof raw.description !== "string" ||
    raw.description.length > 800 ||
    !EVENT_DESIGN_LAYOUTS.includes(raw.layout as EventCustomDesign["layout"]) ||
    !Object.hasOwn(EVENT_DESIGN_FONTS, String(raw.font)) ||
    !colors ||
    !["page", "surface", "ink", "accent"].every(
      (key) => typeof colors[key] === "string" && /^#[0-9a-f]{6}$/i.test(colors[key] as string),
    )
  )
    return null;
  const palette = {
    page: String(colors.page),
    surface: String(colors.surface),
    ink: String(colors.ink),
    accent: String(colors.accent),
  };
  if ([palette.page, palette.surface].some((color) => colorContrast(palette.ink, color) < 4.5)) {
    const ink = ["#17212b", "#ffffff"].find((candidate) =>
      [palette.page, palette.surface].every((color) => colorContrast(candidate, color) >= 4.5),
    );
    if (!ink) return null;
    palette.ink = ink;
  }
  if (colorContrast(palette.accent, "#ffffff") < 4.5) palette.accent = "#57406d";
  return {
    version: 1,
    name: raw.name.trim(),
    description: raw.description.trim(),
    layout: raw.layout as EventCustomDesign["layout"],
    font: raw.font as EventCustomDesign["font"],
    colors: palette,
  };
}
export function normalizeCustomEventDetails(value: unknown): CustomEventDetails | null {
  const raw = record(value);
  if (!raw) return null;
  const details = emptyCustomEventDetails();
  for (const field of EVENT_DETAIL_FIELDS) {
    if (raw[field] != null && typeof raw[field] !== "string") return null;
    const text = String(raw[field] || "").trim();
    if (text.length > (field === "description" ? 6000 : field === "location" ? 1000 : 300))
      return null;
    details[field] = text;
  }
  for (const field of ["date", "endDate"] as const) {
    if (
      details[field] &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(details[field]) ||
        !parseCalendarDateTimeToIso(details[field], "UTC"))
    )
      return null;
  }
  for (const field of ["time", "endTime"] as const)
    if (details[field] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(details[field])) return null;
  if (details.timezone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: details.timezone });
    } catch {
      return null;
    }
  }
  if (raw.rsvpEnabled != null && typeof raw.rsvpEnabled !== "boolean") return null;
  details.rsvpEnabled = raw.rsvpEnabled === true;
  if (raw.guestActions != null) details.guestActions = normalizeEventGuestActions(raw.guestActions);
  for (const key of ["sections", "registryLinks"] as const) {
    if (raw[key] != null && !Array.isArray(raw[key])) return null;
    const rows = (raw[key] || []) as unknown[];
    if (rows.length > 20) return null;
    for (const item of rows) {
      const row = record(item);
      if (!row) return null;
      if (key === "sections") {
        if (
          typeof row.title !== "string" ||
          row.title.length > 180 ||
          typeof row.body !== "string" ||
          row.body.length > 6000
        )
          return null;
        details.sections.push({ title: row.title, body: row.body });
      } else {
        const url = safeEventLink(row.url);
        if ((row.url !== "" && !url) || typeof row.label !== "string" || row.label.length > 180)
          return null;
        details.registryLinks.push({ label: row.label, url: url || "" });
      }
    }
  }
  return details;
}
export function normalizeCustomEventPage(value: unknown): CustomEventPage | null {
  const raw = record(value);
  const category = customEventCategory(raw?.category);
  const design = normalizeEventCustomDesign(raw?.design);
  const details = normalizeCustomEventDetails(raw?.details);
  if (
    raw?.version !== 1 ||
    !category ||
    !design ||
    !details ||
    typeof raw.artwork !== "string" ||
    raw.artwork.length > 12_000_000 ||
    !(
      /^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(raw.artwork) ||
      /^\/templates\/[\w/.-]+\.webp$/.test(raw.artwork) ||
      safeEventLink(raw.artwork)
    )
  )
    return null;
  return { version: 1, category, design, details, artwork: raw.artwork };
}
export function customEventGalleryHref(category: CustomEventCategory): string {
  return category === "bridal-showers" ? "/bridal-showers/templates" : `/event/${category}`;
}
export function customEventPageData(page: CustomEventPage) {
  const d = page.details;
  const start = d.date
    ? parseCalendarDateTimeToIso(`${d.date}${d.time ? `T${d.time}` : ""}`, d.timezone || "UTC")
    : null;
  const end =
    d.endTime && (d.endDate || d.date)
      ? parseCalendarDateTimeToIso(`${d.endDate || d.date}T${d.endTime}`, d.timezone || "UTC")
      : null;
  return {
    title: d.title,
    description: d.description,
    category: CUSTOM_EVENT_CATEGORIES[page.category],
    customEventPage: page,
    customEventPageDraft: null,
    createdVia: "custom-event-page",
    ownership: "owned",
    primaryOutput: "event_page",
    templateId: "custom-event-page",
    heroImage: page.artwork,
    startAt: start,
    startISO: start,
    start,
    endAt: end,
    endISO: end,
    end,
    date: d.date,
    time: d.time,
    allDay: Boolean(d.date && !d.time),
    timezone: d.timezone || "UTC",
    tz: d.timezone || "UTC",
    venue: d.venue,
    location: d.location || d.venue,
    hostName: d.host,
    rsvpEnabled: d.rsvpEnabled,
    rsvpEmail: d.rsvpEmail,
    rsvpPhone: d.rsvpPhone,
    registryLinks: d.registryLinks,
  };
}

// Candidates cross a client-side route transition only; generation never saves a draft.
const previews = new Map<string, { page: CustomEventPage; expires: number }>();
export function stageCustomEventPage(page: CustomEventPage): string {
  for (const [key, value] of previews) if (value.expires < Date.now()) previews.delete(key);
  while (previews.size >= 3) previews.delete(previews.keys().next().value!);
  const token = crypto.randomUUID();
  previews.set(token, { page: structuredClone(page), expires: Date.now() + 10 * 60 * 1000 });
  return token;
}
export function takeCustomEventPage(
  token: string,
  category: CustomEventCategory,
): CustomEventPage | null {
  const preview = previews.get(token);
  if (!preview || preview.page.category !== category) return null;
  previews.delete(token);
  return preview.expires > Date.now() ? preview.page : null;
}

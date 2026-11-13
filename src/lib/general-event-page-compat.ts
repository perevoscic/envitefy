import { resolveGeneralCreationDesign, getGeneralCreationDesigns } from "./create/event-page-collections";
import { emptyCustomEventDetails, EVENT_DESIGN_FONT_PAIRS, normalizeCustomEventDetails, type CustomEventDetails, type CustomEventPage } from "./event-custom-design";
import { readEventRsvpContact } from "./event-rsvp-contact";
import { readEventRsvpSettings } from "./event-rsvp-settings";
import { getHolidayBackground } from "./holiday-backgrounds";
import { schoolStarterSections } from "./school-events";
import { normalizeEventSectionLayout } from "./event-section-layout";
import { normalizeEventPageComposition } from "./event-page-composition";
import { eventTitleFontFamily } from "./event-title-font";

const record = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
const text = (value: unknown) => typeof value === "string" ? value : "";

function eventDateParts(value: unknown, timezone: string) {
  if (typeof value !== "string" || !timezone || !Number.isFinite(Date.parse(value))) return { date: "", time: "" };
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const part = (type: string) => parts.find(value => value.type === type)?.value;
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour")}:${part("minute")}` };
}

function currentSections(value: unknown) {
  const composition = record(normalizeEventPageComposition(value) || value);
  const sections = (Array.isArray(composition.sections) ? composition.sections : []).map((section: any) => ({ ...section, title: text(section.title), body: text(section.body) }));
  const sectionIds = new Map<string, string>(sections.map((section: any, index: number) => [text(section.id), `section:${index}`]));
  sectionIds.set("details", "overview");
  const oldLayout = normalizeEventSectionLayout(composition.sectionLayout);
  const ids = (values: string[]) => values.flatMap(id => sectionIds.has(id) ? [sectionIds.get(id)!] : []);
  const sectionLayout = oldLayout ? { version: 1 as const, order: ids(oldLayout.order), hidden: ids(oldLayout.hidden), added: ids(oldLayout.added),
    ...(oldLayout.widths ? { widths: Object.fromEntries(Object.entries(oldLayout.widths).flatMap(([id, width]) => sectionIds.has(id) ? [[sectionIds.get(id)!, width]] : [])) } : {}),
    ...(oldLayout.pairs ? { pairs: oldLayout.pairs.flatMap(pair => { const next = ids(pair); return next.length === 2 ? [next as [string, string]] : []; }) } : {}) } : undefined;
  return { sections, sectionLayout };
}

/** Catalog artwork now opens the current editor; no legacy editor or generation is needed. */
export function generalTemplateEventPage(templateId?: string | null, details?: Partial<CustomEventDetails>, collection?: string | null): CustomEventPage | null {
  const selected = templateId ? resolveGeneralCreationDesign(templateId) : getGeneralCreationDesigns(collection)[0];
  if (!selected) return null;
  const design = selected as typeof selected & { schoolTemplate?: CustomEventDetails["schoolTemplate"]; font?: string; fontFamily?: string; composition?: string; editorLayout?: string };
  const background = getHolidayBackground(selected.id);
  const font = EVENT_DESIGN_FONT_PAIRS.find(pair => pair.heading === (design.font || design.fontFamily))?.id || "editorial";
  const layouts: Record<string, CustomEventPage["design"]["layout"]> = { panorama: "banner", arch: "poster", journal: "editorial", postcard: "cards", oval: "poster", organic: "editorial", framed: "poster" };
  const layout = layouts[design.composition || ""] || "split";
  const initialDetails = { ...emptyCustomEventDetails(), ...(design.schoolTemplate ? { schoolTemplate: design.schoolTemplate, sections: schoolStarterSections(design.schoolTemplate) } : {}), ...details };
  const memo = initialDetails.scanSchedule?.kind === "school-memo" ? currentSections({ version: 1, sections: initialDetails.sections.map((section, index) => ({ ...section, id: `info:import-${index}` })) }) : undefined;
  return {
    version: 1, category: "general", sourceTemplateId: design.id, artwork: design.artwork,
    design: { version: 1, name: design.name.slice(0, 80), description: design.description.slice(0, 800), layout, font, fontFamily: design.font || design.fontFamily,
      colors: { page: background?.page || design.background, surface: background?.surface || design.background, ink: background?.ink || design.ink, accent: design.accent } },
    details: { ...initialDetails, ...memo },
  };
}

/** Read-only conversion. The original record, media and responses change only on explicit save. */
export function legacyGeneralEventPage(value: unknown, title?: string): CustomEventPage | null {
  const saved = record(value), manual = record(saved.manualEditor), snapshot = record(manual.snapshot);
  if (saved.studioCard || saved.signupForm || saved.createdVia === "livecard-builder" || ["live_card", "signup_form"].includes(text(saved.primaryOutput))) return null;
  const data = { ...saved, ...record(snapshot.data) };
  if (!/^(general|general events?|school & classroom)$/i.test(text(saved.category)) && saved.templateId !== "general" && !/^\/event\/general(?:\/customize)?(?:\?|$)/.test(text(manual.path))) return null;
  const templateId = text(data.bodyDesignId) || text(snapshot.themeId) || text(data.themeId);
  const page = generalTemplateEventPage(templateId) || generalTemplateEventPage();
  if (!page) return null;
  const extra = { ...record(saved.customFields), ...record(data.extra) };
  const authoredComposition = normalizeEventPageComposition(snapshot.pageComposition || saved.eventPageComposition);
  const theme = record(snapshot.theme || saved.theme);
  const authoredFont = eventTitleFontFamily(authoredComposition?.titleFont) || text(theme.fontFamily);
  const background = data.pageBackground ? getHolidayBackground(templateId, data.pageBackground) : undefined;
  const color = (value: unknown, fallback: string) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  const pageColor = color(background?.page || theme.backgroundColor || record(theme.bgStyle).backgroundColor, page.design.colors.page);
  const colors = {
    page: pageColor, surface: color(background?.surface, pageColor),
    ink: color(background?.ink || theme.ink || record(theme.bgStyle).color, page.design.colors.ink),
    accent: color(background?.accent || theme.accentColor, page.design.colors.accent),
  };
  const { sections, sectionLayout } = currentSections(snapshot.pageComposition || saved.eventPageComposition || { version: 1,
    sections: (Array.isArray(data.sections) ? data.sections : []).map((section: any, index: number) => ({ ...section, id: `info:import-${index}` })) });
  const used = new Set(sections.map((section: any) => section.title.toLowerCase()));
  for (const [key, body] of Object.entries(extra)) {
    if (["host", "rsvpName", "rsvpEmail", "rsvpPhone", "advancedSections"].includes(key) || typeof body !== "string" || !body.trim() || used.has(key.toLowerCase())) continue;
    sections.push({ title: key, body });
  }
  const rsvp = readEventRsvpSettings(data);
  const timezone = text(data.timezone) || text(data.timeZone) || text(data.tz) || text(data.scanSchedule?.timezone);
  const start = eventDateParts(data.startISO || data.startAt || data.start, timezone);
  const end = eventDateParts(data.endISO || data.endAt || data.end, timezone);
  if (data.date === undefined && (data.startISO || data.startAt || data.start) && !timezone)
    throw new Error("Confirm this saved event’s original time zone before converting its dates.");
  const details = normalizeCustomEventDetails({
    ...emptyCustomEventDetails(), title: data.title ?? title ?? "", description: data.details ?? data.description ?? "",
    date: data.date ?? start.date, time: data.time ?? start.time, endDate: data.endDate ?? end.date, endTime: data.endTime ?? end.time, timezone,
    timezoneSource: data.timezoneSource, timezoneLocation: data.timezoneLocation,
    venue: data.venue ?? "", location: data.location ?? [data.city, data.state].filter(Boolean).join(", "), host: data.host ?? extra.host ?? "",
    ...readEventRsvpContact({ ...data, rsvpName: data.rsvpName ?? extra.rsvpName, rsvpEmail: data.rsvpEmail ?? extra.rsvpEmail, rsvpPhone: data.rsvpPhone ?? extra.rsvpPhone }), rsvpEnabled: rsvp.isEnabled, rsvpDeadline: rsvp.deadline,
    sections, registryLinks: data.registryLinks || [], scanSchedule: data.scanSchedule, schoolTemplate: data.schoolTemplate || page.details.schoolTemplate,
    guestActions: data.guestActions, sectionLayout,
  });
  if (!details) throw new Error("This saved event has details that need review before it can open in the current editor.");
  return { ...page, artwork: text(data.heroImage) || text(data.hero) || page.artwork,
    design: { ...page.design, colors, ...(authoredFont ? { fontFamily: authoredFont } : {}),
      ...(authoredComposition?.hero ? { hero: authoredComposition.hero } : {}),
      ...(authoredComposition?.layout ? { layout: authoredComposition.layout } : {}) }, details };
}

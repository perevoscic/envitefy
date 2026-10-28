import { normalizeEventTitleFont, type EventTitleFont } from "./event-title-font";
import { organizeLegacySchoolMemo } from "./school-memo-content";
import { normalizeEventSectionLayout, type EventSectionLayout } from "./event-section-layout";
import { EVENT_DESIGN_LAYOUTS, type EventCustomDesign } from "./event-custom-design";
import { normalizeArrivalMap, type EventArrivalMap } from "./event-arrival-map";
import { normalizeEventHeroLayout, type EventHeroLayout } from "./event-hero-layout";
import { normalizeEventSectionExtras, type EventSectionExtras } from "./event-section-extras";

export type EventInformationSection = { id: string; title: string; body: string; map?: EventArrivalMap } & EventSectionExtras;
export type EventPageComposition = {
  version: 1;
  layout?: EventCustomDesign["layout"];
  hero?: EventHeroLayout;
  titleFont?: EventTitleFont;
  sections: EventInformationSection[];
  sectionLayout?: EventSectionLayout;
};

/** A hero choice must not opt a guest page into a different body renderer. */
export function hasEventPageBodyComposition(value?: EventPageComposition): boolean {
  return Boolean(value?.layout || value?.sectionLayout || value?.sections.length);
}

/** Composition is optional: older pages retain their template and all specialized data. */
export function normalizeEventPageComposition(value: unknown): EventPageComposition | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1) return undefined;
  const sections: EventInformationSection[] = [];
  if (Array.isArray(raw.sections))
    for (const item of raw.sections.slice(0, 20)) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const section = item as Record<string, unknown>;
      if (
        typeof section.id !== "string" ||
        !/^info:[a-zA-Z0-9_-]{1,100}$/.test(section.id) ||
        sections.some((entry) => entry.id === section.id)
      )
        continue;
      sections.push({
        id: section.id,
        title: typeof section.title === "string" ? section.title.slice(0, 240) : "",
        body: typeof section.body === "string" ? section.body.slice(0, 12000) : "",
        ...(normalizeArrivalMap(section.map) ? { map: normalizeArrivalMap(section.map)! } : {}),
        ...normalizeEventSectionExtras(section),
      });
    }
  const layout = EVENT_DESIGN_LAYOUTS.includes(raw.layout as EventCustomDesign["layout"])
    ? (raw.layout as EventCustomDesign["layout"])
    : undefined;
  const sectionLayout = normalizeEventSectionLayout(raw.sectionLayout);
  const hero = normalizeEventHeroLayout(raw.hero);
  const titleFont = normalizeEventTitleFont(raw.titleFont);
  return layout || hero || titleFont || sections.length || sectionLayout
    ? organizeLegacySchoolMemo({
        version: 1,
        sections,
        ...(layout ? { layout } : {}),
        ...(hero ? { hero } : {}),
        ...(titleFont ? { titleFont } : {}),
        ...(sectionLayout ? { sectionLayout } : {}),
      })
    : undefined;
}

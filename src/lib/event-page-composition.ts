import { normalizeEventSectionLayout, type EventSectionLayout } from "./event-section-layout";
import { EVENT_DESIGN_LAYOUTS, type EventCustomDesign } from "./event-custom-design";

export type EventInformationSection = { id: string; title: string; body: string };
export type EventPageComposition = {
  version: 1;
  layout?: EventCustomDesign["layout"];
  sections: EventInformationSection[];
  sectionLayout?: EventSectionLayout;
};

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
      });
    }
  const layout = EVENT_DESIGN_LAYOUTS.includes(raw.layout as EventCustomDesign["layout"])
    ? (raw.layout as EventCustomDesign["layout"])
    : undefined;
  const sectionLayout = normalizeEventSectionLayout(raw.sectionLayout);
  return layout || sections.length || sectionLayout
    ? {
        version: 1,
        sections,
        ...(layout ? { layout } : {}),
        ...(sectionLayout ? { sectionLayout } : {}),
      }
    : undefined;
}

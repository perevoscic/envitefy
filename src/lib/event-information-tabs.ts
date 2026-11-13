import { groupEventSectionRows, orderEventSections, GYMNASTICS_SECTION_CATALOG, type EventSectionLayout } from "./event-section-layout";

/** Explicitly added sections belong to the saved page even before they have content. */
export function eventInformationSections<T extends { id: string; label?: string }>(
  sections: T[],
  layout?: EventSectionLayout,
) {
  return orderEventSections([
    ...sections,
    ...GYMNASTICS_SECTION_CATALOG.filter((section) => layout?.added.includes(section.id)),
  ], layout);
}

/** The page-section list owns navigation labels, order and visibility. */
export function eventInformationTabs(
  sections: Array<{ id: string; label?: string }>,
  layout?: EventSectionLayout,
) {
  const ordered = eventInformationSections(sections, layout);
  const rows = groupEventSectionRows(ordered, layout);
  return ordered.map((section) => ({
    id: section.id,
    label: section.label || GYMNASTICS_SECTION_CATALOG.find((item) => item.id === section.id)?.label || "Information",
    // Pairing controls the panel layout, never which tabs are available.
    sectionIds: rows.find((row) => row.some((item) => item.id === section.id))!.map((item) => item.id),
  }));
}

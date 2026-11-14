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
  groupRelated = false,
) {
  const ordered = eventInformationSections(sections, layout);
  const rows = groupEventSectionRows(ordered, layout);
  const tabs = ordered.map((section) => ({
    id: section.id,
    label: section.label || GYMNASTICS_SECTION_CATALOG.find((item) => item.id === section.id)?.label || "Information",
    // Pairing controls the panel layout, never which tabs are available.
    sectionIds: rows.find((row) => row.some((item) => item.id === section.id))!.map((item) => item.id),
  }));
  // Generated imports share a panel for closely related information. Every
  // source section remains independently editable, visible and recoverable.
  if (!groupRelated || layout?.pairs?.length) return tabs;
  const groups = [
    { primary: "meet-details", label: "Meet details", ids: ["meet-details", "admission", "results", "documents", "announcements"] },
    { primary: "traffic-parking", label: "Venue & parking", ids: ["traffic-parking", "venue-details"] },
  ];
  return tabs.flatMap(tab => {
    const group = groups.find(group => group.ids.includes(tab.id));
    if (!group) return [tab];
    const members = tabs.filter(item => group.ids.includes(item.id));
    const primary = members.find(item => item.id === group.primary) || members[0];
    if (tab !== primary) return [];
    return [{ ...tab, label: members.length > 1 ? group.label : tab.label, sectionIds: members.flatMap(item => item.sectionIds) }];
  });
}

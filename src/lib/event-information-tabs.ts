import { groupEventSectionRows, type EventSectionLayout } from "./event-section-layout";

export function eventInformationTabs(sections: Array<{ id: string }>, layout?: EventSectionLayout) {
  const tabs = [
    { id: "overview", label: "Overview", sectionIds: [] as string[] },
    { id: "schedule", label: "Schedule", sectionIds: [] as string[] },
    { id: "teams", label: "Teams", sectionIds: [] as string[] },
    { id: "visit", label: "Visit", sectionIds: [] as string[] },
  ];
  for (const row of groupEventSectionRows(sections, layout)) {
    const id = row[0].id;
    const tab = /^schedule(?:-|$)/.test(id)
      ? "schedule"
      : /^(participating-clubs|roster|practice|coaches|support)$/.test(id)
        ? "teams"
        : /^(venue(?:-details)?|traffic-parking|parking|traffic|hotels|travel|attractions)$/.test(
              id,
            )
          ? "visit"
          : "overview";
    // A host-authored pair stays together in the tab of its first section.
    tabs.find((item) => item.id === tab)!.sectionIds.push(...row.map((section) => section.id));
  }
  return tabs.filter((tab) => tab.sectionIds.length);
}

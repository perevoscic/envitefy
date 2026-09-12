/** Page composition only. Removing a section never removes its underlying event data. */
export type EventSectionLayout = {
  version: 1;
  order: string[];
  hidden: string[];
  added: string[];
};

function sectionIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (id): id is string =>
          typeof id === "string" && /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,119}$/.test(id),
      ),
    ),
  ].slice(0, 100);
}

export function normalizeEventSectionLayout(value: unknown): EventSectionLayout | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const layout = value as Record<string, unknown>;
  if (layout.version !== 1) return undefined;
  return {
    version: 1,
    order: sectionIds(layout.order),
    hidden: sectionIds(layout.hidden),
    added: sectionIds(layout.added),
  };
}

export function orderEventSections<T extends { id: string }>(
  sections: readonly T[],
  layout?: EventSectionLayout,
): T[] {
  const unique = sections.filter(
    (section, index) => sections.findIndex((item) => item.id === section.id) === index,
  );
  if (!layout) return unique;
  const rank = new Map(layout.order.map((id, index) => [id, index]));
  return unique
    .filter((section) => !layout.hidden.includes(section.id))
    .sort((left, right) => (rank.get(left.id) ?? rank.size) - (rank.get(right.id) ?? rank.size));
}

export type EventSectionChange =
  | { type: "add"; id: string; index: number }
  | { type: "move"; id: string; index: number }
  | { type: "remove"; id: string };

export function changeEventSectionLayout(
  current: EventSectionLayout | undefined,
  visibleIds: readonly string[],
  change: EventSectionChange,
): EventSectionLayout {
  const base = current ?? { version: 1, order: [...visibleIds], hidden: [], added: [] };
  const ids = [...new Set(visibleIds)].filter((id) => id !== change.id);
  if (change.type !== "remove")
    ids.splice(Math.max(0, Math.min(change.index, ids.length)), 0, change.id);
  return {
    version: 1,
    order: [...ids, ...base.order.filter((id) => !ids.includes(id))],
    hidden:
      change.type === "remove"
        ? [...new Set([...base.hidden, change.id])]
        : base.hidden.filter((id) => id !== change.id),
    added: change.type === "add" ? [...new Set([...base.added, change.id])] : [...base.added],
  };
}

export const GYMNASTICS_SECTION_CATALOG = [
  { id: "meet-details", label: "Meet details", editorId: "meet" },
  { id: "schedule", label: "Schedule", editorId: "schedule" },
  { id: "admission", label: "Admission", editorId: "admission" },
  { id: "venue-details", label: "Venue", editorId: "venue" },
  { id: "traffic-parking", label: "Travel & parking", editorId: "travel" },
  { id: "hotels", label: "Hotels", editorId: "logistics" },
  { id: "coaches", label: "Coaches", editorId: "coaches" },
  { id: "results", label: "Results", editorId: "meet" },
  { id: "documents", label: "Documents & links", editorId: "logistics" },
  { id: "announcements", label: "Updates", editorId: "announcements" },
  { id: "roster", label: "Roster", editorId: "roster" },
  { id: "practice", label: "Practice", editorId: "practice" },
  { id: "support", label: "Gear & volunteers", editorId: "support" },
  { id: "guest-planning", label: "Guest information", editorId: "details" },
  { id: "rsvp", label: "Attendance / RSVP", editorId: "rsvp" },
] as const;

export function gymnasticsSectionEditor(id: string, kind?: string): string {
  const section = GYMNASTICS_SECTION_CATALOG.find((item) => item.id === id);
  if (section) return section.editorId;
  if (/schedule|session/.test(`${id} ${kind}`)) return "schedule";
  if (/hotel|travel|parking|venue/.test(`${id} ${kind}`)) return "logistics";
  return "meet";
}

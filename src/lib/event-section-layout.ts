export type EventSectionWidth = 4 | 6 | 8 | 12;

/** Page composition only. Removing a section never removes its underlying event data. */
export type EventSectionLayout = {
  version: 1;
  order: string[];
  hidden: string[];
  added: string[];
  widths?: Record<string, EventSectionWidth>;
  pairs?: Array<[string, string]>;
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
  const widths: Record<string, EventSectionWidth> = {};
  if (layout.widths && typeof layout.widths === "object" && !Array.isArray(layout.widths)) {
    for (const [id, width] of Object.entries(layout.widths).slice(0, 100)) {
      if (sectionIds([id]).length && (width === 4 || width === 6 || width === 8 || width === 12))
        Object.defineProperty(widths, id, {
          value: width,
          enumerable: true,
          writable: true,
          configurable: true,
        });
    }
  }
  const pairs: Array<[string, string]> = [];
  const paired = new Set<string>();
  if (Array.isArray(layout.pairs)) {
    for (const candidate of layout.pairs.slice(0, 50)) {
      const ids = sectionIds(candidate);
      if (
        !Array.isArray(candidate) ||
        candidate.length !== 2 ||
        ids.length !== 2 ||
        ids.some((id) => paired.has(id))
      )
        continue;
      const [left, right] = ids;
      const width = Object.hasOwn(widths, left) && widths[left] !== 12 ? widths[left] : 6;
      widths[left] = width;
      widths[right] = (12 - width) as EventSectionWidth;
      pairs.push([left, right]);
      paired.add(left);
      paired.add(right);
    }
  }
  return {
    version: 1,
    order: sectionIds(layout.order),
    hidden: sectionIds(layout.hidden),
    added: sectionIds(layout.added),
    ...(Object.keys(widths).length ? { widths } : {}),
    ...(pairs.length ? { pairs } : {}),
  };
}

/** Keep each saved pair together while omitting hidden or unpopulated sections. */
export function groupEventSectionRows<T extends { id: string }>(
  sections: readonly T[],
  layout?: EventSectionLayout,
): T[][] {
  const ordered = orderEventSections(sections, layout);
  const remaining = new Map(ordered.map((section) => [section.id, section]));
  const rows: T[][] = [];
  for (const section of ordered) {
    if (!remaining.has(section.id)) continue;
    const pair = layout?.pairs?.find((ids) => ids.includes(section.id));
    const row = pair
      ? pair.flatMap((id) => (remaining.has(id) ? [remaining.get(id)!] : []))
      : [section];
    rows.push(row);
    for (const item of row) remaining.delete(item.id);
  }
  return rows;
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
  | { type: "remove"; id: string }
  | { type: "resize"; id: string; width: EventSectionWidth }
  | { type: "pair"; id: string; besideId: string }
  | { type: "unpair"; id: string };

export function changeEventSectionLayout(
  current: EventSectionLayout | undefined,
  visibleIds: readonly string[],
  change: EventSectionChange,
): EventSectionLayout {
  const base = current ?? { version: 1, order: [...visibleIds], hidden: [], added: [] };
  if (change.type === "resize" || change.type === "pair" || change.type === "unpair") {
    const widths = { ...base.widths };
    let pairs = [...(base.pairs ?? [])];
    let order = [...new Set([...visibleIds, ...base.order])];
    if (change.type === "pair") {
      if (change.id === change.besideId || !visibleIds.includes(change.besideId)) return base;
      pairs = pairs.filter((pair) => !pair.includes(change.id) && !pair.includes(change.besideId));
      pairs.push([change.besideId, change.id]);
      const width = Object.hasOwn(widths, change.besideId) ? widths[change.besideId] : 12;
      widths[change.besideId] = width && width !== 12 ? width : 6;
      widths[change.id] = (12 - widths[change.besideId]) as EventSectionWidth;
      order = order.filter((id) => id !== change.id);
      order.splice(order.indexOf(change.besideId) + 1, 0, change.id);
    } else if (change.type === "unpair" || change.width === 12) {
      const pair = pairs.find((ids) => ids.includes(change.id));
      for (const id of pair ?? [change.id]) widths[id] = 12;
      pairs = pairs.filter((ids) => !ids.includes(change.id));
    } else {
      widths[change.id] = change.width;
      const partner = pairs.find((ids) => ids.includes(change.id))?.find((id) => id !== change.id);
      if (partner) widths[partner] = (12 - change.width) as EventSectionWidth;
    }
    return {
      ...base,
      order,
      widths,
      pairs,
      hidden:
        change.type === "pair" ? base.hidden.filter((id) => id !== change.id) : [...base.hidden],
      added:
        change.type === "pair" && !visibleIds.includes(change.id)
          ? [...new Set([...base.added, change.id])]
          : [...base.added],
    };
  }
  const ids = [...new Set(visibleIds)].filter((id) => id !== change.id);
  if (change.type !== "remove")
    ids.splice(Math.max(0, Math.min(change.index, ids.length)), 0, change.id);
  return {
    ...base,
    version: 1,
    order: [...ids, ...base.order.filter((id) => !ids.includes(id))],
    hidden:
      change.type === "remove"
        ? [...new Set([...base.hidden, change.id])]
        : base.hidden.filter((id) => id !== change.id),
    added: change.type === "add" ? [...new Set([...base.added, change.id])] : [...base.added],
    // Moving an individual section puts it in its own row. Remove/restore retains its pairing.
    ...(change.type === "move" && base.pairs
      ? { pairs: base.pairs.filter((pair) => !pair.includes(change.id)) }
      : {}),
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

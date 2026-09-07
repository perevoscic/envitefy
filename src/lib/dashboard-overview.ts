import { isArchivedOrCanceled, isDraftStatus, type DashboardEvent } from "./dashboard-data.ts";

export type DashboardAttention = {
  id: string;
  eventId: string;
  eventTitle: string;
  label: string;
  href: string;
  kind: "invitation" | "rsvp" | "venue";
};
export type DashboardConflict = {
  id: string;
  first: { id: string; title: string; startAt: string };
  second: { id: string; title: string; startAt: string };
};
export type DashboardGuestSummary = {
  eventId: string;
  title: string;
  going: number;
  maybe: number;
  declined: number;
  awaitingShared: number | null;
};
export type DashboardSignupSummary = {
  eventId: string;
  title: string;
  filled: number;
  capacity: number;
  remaining: number;
  unlimitedSlots: number;
  sections: Array<{ id: string; title: string; remaining: number; unlimitedSlots: number }>;
};
export type DashboardDraft = {
  id: string;
  title: string;
  updatedAt: string | null;
  startAt: string | null;
  href: string;
};
export type DashboardOverview = {
  attention: DashboardAttention[];
  conflicts: DashboardConflict[];
  guests: DashboardGuestSummary[];
  signups: DashboardSignupSummary[];
  drafts: { count: number; items: DashboardDraft[] };
  editLinks: Record<string, string>;
  unavailable: string[];
};

export function buildDashboardAttention(
  events: DashboardEvent[],
  editLinks: Record<string, string>,
): DashboardAttention[] {
  return events.flatMap((event): DashboardAttention[] => {
    if (
      isDraftStatus(event.status) ||
      isArchivedOrCanceled(event.status) ||
      event.userRsvpResponse === "no"
    )
      return [];
    const base = { eventId: event.id, eventTitle: event.title };
    if (event.ownership === "invited") {
      if (event.shareStatus === "pending")
        return [
          {
            ...base,
            id: `${event.id}-invitation`,
            kind: "invitation",
            label: "Review invitation",
            href: `/event/${encodeURIComponent(event.id)}`,
          },
        ];
      if (event.hasRsvp && !event.userRsvpResponse)
        return [
          {
            ...base,
            id: `${event.id}-rsvp`,
            kind: "rsvp",
            label: "Review RSVP details",
            href: `/event/${encodeURIComponent(event.id)}`,
          },
        ];
      return [];
    }
    return !event.locationText && editLinks[event.id]
      ? [
          {
            ...base,
            id: `${event.id}-venue`,
            kind: "venue",
            label: "Add event location",
            href: editLinks[event.id],
          },
        ]
      : [];
  });
}

export function findDashboardConflicts(
  events: DashboardEvent[],
  now = Date.now(),
): DashboardConflict[] {
  const active = events
    .filter((event) => {
      if (
        isDraftStatus(event.status) ||
        isArchivedOrCanceled(event.status) ||
        event.userRsvpResponse === "no"
      )
        return false;
      const end = Date.parse(event.endAt || event.startAt);
      return Number.isFinite(end) && end > now;
    })
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  const conflicts: DashboardConflict[] = [];
  for (let i = 0; i < active.length; i += 1) {
    const first = active[i];
    const start = Date.parse(first.startAt);
    const end = Date.parse(first.endAt || first.startAt);
    for (const second of active.slice(i + 1)) {
      const secondStart = Date.parse(second.startAt);
      if (secondStart > Math.max(start, end)) break;
      // A missing duration is not an invented one-hour appointment. Identical
      // starts still conflict; touching interval boundaries do not.
      if (first.id !== second.id && (secondStart === start || secondStart < end)) {
        conflicts.push({
          id: `${first.id}-${second.id}`,
          first: { id: first.id, title: first.title, startAt: first.startAt },
          second: { id: second.id, title: second.title, startAt: second.startAt },
        });
      }
    }
  }
  return conflicts;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function count(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

/** Aggregate quantities without sending participant names or contact details to Home. */
export function summarizeDashboardSignup(
  eventId: string,
  title: string,
  input: unknown,
): DashboardSignupSummary | null {
  const form = asRecord(input);
  if (!form || form.enabled === false || !Array.isArray(form.sections)) return null;
  const quantities = new Map<string, number>();
  for (const responseValue of Array.isArray(form.responses) ? form.responses : []) {
    const response = asRecord(responseValue);
    if (response?.status !== "confirmed" || !Array.isArray(response.slots)) continue;
    for (const value of response.slots) {
      const slot = asRecord(value);
      if (!slot || typeof slot.sectionId !== "string" || typeof slot.slotId !== "string") continue;
      const key = JSON.stringify([slot.sectionId, slot.slotId]);
      quantities.set(key, (quantities.get(key) || 0) + count(slot.quantity));
    }
  }
  let capacity = 0;
  let filled = 0;
  let unlimitedSlots = 0;
  const sections: DashboardSignupSummary["sections"] = [];
  for (const sectionValue of form.sections) {
    const section = asRecord(sectionValue);
    if (!section || typeof section.id !== "string" || !Array.isArray(section.slots)) continue;
    let remaining = 0;
    let unlimited = 0;
    for (const slotValue of section.slots) {
      const slot = asRecord(slotValue);
      if (!slot || typeof slot.id !== "string") continue;
      if (slot.capacity == null) {
        unlimited += 1;
        continue;
      }
      const total = count(slot.capacity);
      const claimed = Math.min(total, quantities.get(JSON.stringify([section.id, slot.id])) || 0);
      capacity += total;
      filled += claimed;
      remaining += total - claimed;
    }
    unlimitedSlots += unlimited;
    sections.push({
      id: section.id,
      title: typeof section.title === "string" ? section.title : "Sign-ups",
      remaining,
      unlimitedSlots: unlimited,
    });
  }
  if (!sections.length) return null;
  return {
    eventId,
    title,
    capacity,
    filled,
    remaining: capacity - filled,
    unlimitedSlots,
    sections,
  };
}

export type EventWebsiteScheduleItem = {
  group?: string | null;
  day?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  opponent?: string | null;
  homeAway?: "home" | "away" | null;
  id: string;
  title: string;
  type: string | null;
  startAt: string | null;
  endAt: string | null;
  timezone: string | null;
  locationText: string | null;
  status: string;
  notes: string | null;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, limit: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, limit) : "";
}

function date(value: unknown): string | null {
  const raw = text(value, 120);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

// Public event schedules are shared event data, independent of the creator.
export function extractEventWebsiteSchedule(data: unknown): EventWebsiteScheduleItem[] {
  const event = record(data);
  const publicEvent = record(event.publicEvent);
  const scheduleHub = record(event.scheduleHub);
  const scanSchedule = record(event.scanSchedule);
  // The first stored array is authoritative, including an empty public schedule.
  // Falling through on [] would bring back items the host deliberately removed.
  const items = [publicEvent.scheduleItems, scheduleHub.items, scheduleHub.occurrences, event.scheduleItems, scanSchedule.items]
    .find(Array.isArray) ?? [];

  return items.flatMap((value: unknown, index: number): EventWebsiteScheduleItem[] => {
    const item = record(value);
    const title = text(item.title || item.name || item.label, 180);
    if (!title) return [];
    return [{
      id: text(item.id, 120) || `schedule-${index}`,
      title,
      type: text(item.type || item.occurrenceType, 80) || null,
      startAt: date(item.startAt || item.start || item.startISO),
      endAt: date(item.endAt || item.end || item.endISO),
      timezone: text(item.timezone || item.tz, 80) || null,
      locationText: text(item.locationText || item.location || item.venue, 180) || null,
      status: text(item.status, 60) || "scheduled",
      notes: text(item.notes || item.description, 280) || null,
      group: text(item.group, 180) || null,
      day: text(item.day, 20) || null,
      date: text(item.date, 30) || null,
      startTime: text(item.startTime, 40) || null,
      endTime: text(item.endTime, 40) || null,
      opponent: text(item.opponent, 180) || null,
      homeAway: item.homeAway === "home" || item.homeAway === "away" ? item.homeAway : null,
    }];
  });
}

import ical, { ICalAlarmType } from "ical-generator";
import { buildAutoCalendarEvent } from "./calendar-auto-sync";
import { isEventDraft } from "./event-draft-access";

export type AppleCalendarEvent = {
  id: string;
  title: string;
  data: Record<string, unknown>;
};

export function buildAppleCalendarFeed(rows: AppleCalendarEvent[], origin: string): string {
  const calendar = ical({ name: "Envitefy", prodId: "//Envitefy//Calendar subscription//EN", ttl: 3600 });
  for (const row of rows) {
    if (isEventDraft(row.data)) continue;
    const status = String(row.data.status || "").toLowerCase();
    if (["cancelled", "canceled", "archived", "deleted"].includes(status)) continue;
    const url = `${origin}/event/${encodeURIComponent(row.id)}`;
    const built = buildAutoCalendarEvent({ title: row.title, data: row.data, envitefyUrl: url });
    if (!built.ok) continue;
    const event = built.value.event;
    const entry = calendar.createEvent({
      id: `${row.id}@envitefy.com`,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: Boolean(event.allDay),
      summary: event.title,
      description: event.description || "",
      location: [event.venue, event.location].filter(Boolean).join(", "),
      url,
    });
    if (event.recurrence) entry.repeating(event.recurrence);
    for (const reminder of event.reminders || []) {
      entry.createAlarm({ type: ICalAlarmType.display, trigger: reminder.minutes * 60 });
    }
  }
  return calendar.toString();
}

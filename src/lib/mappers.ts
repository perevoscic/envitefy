export type NormalizedEvent = {
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  allDay?: boolean;
  timezone: string; // IANA
  location?: string;
  description?: string;
  recurrence?: string | null; // RRULE:...
  reminders?: { minutes: number }[] | null;
};

export function toGoogleEvent(event: NormalizedEvent) {
  const isAllDay = Boolean(event.allDay);
  const start = isAllDay
    ? { date: event.start.slice(0, 10) }
    : { dateTime: event.start, timeZone: event.timezone };
  const end = isAllDay
    ? { date: event.end.slice(0, 10) }
    : { dateTime: event.end, timeZone: event.timezone };

  const overrides = (event.reminders || [])
    .filter((r) => typeof r.minutes === "number")
    .map((r) => ({ method: "popup" as const, minutes: r.minutes }));

  const requestBody: any = {
    summary: event.title,
    description: event.description || "",
    location: event.location || "",
    start,
    end,
  };
  if (overrides.length) requestBody.reminders = { useDefault: false, overrides };
  if (event.recurrence) requestBody.recurrence = [event.recurrence];
  return requestBody;
}

export function toMicrosoftEvent(event: NormalizedEvent) {
  const toGraphDateTime = (iso: string) => {
    try {
      // Graph expects dateTime without timezone designator when timeZone is provided
      return new Date(iso).toISOString().slice(0, 19);
    } catch {
      return iso;
    }
  };
  const bodyContent = event.description || "";
  const graphEvent: any = {
    subject: event.title || "Event",
    body: { contentType: "HTML", content: bodyContent },
    location: { displayName: event.location || "" },
    // Send UTC with dateTime formatted without timezone suffix per Graph spec
    start: { dateTime: toGraphDateTime(event.start), timeZone: "UTC" },
    end: { dateTime: toGraphDateTime(event.end), timeZone: "UTC" },
  };
  if (event.allDay) graphEvent.isAllDay = true;
  // Microsoft supports a single reminder via reminderMinutesBeforeStart
  if (event.reminders && event.reminders.length > 0) {
    const minutes = Math.min(
      ...event.reminders
        .map((r) => (typeof r.minutes === "number" ? r.minutes : Infinity))
        .filter((v) => isFinite(v))
    );
    if (isFinite(minutes)) {
      graphEvent.reminderMinutesBeforeStart = minutes;
      graphEvent.isReminderOn = true;
    }
  }
  // Recurrence mapping would require splitting RRULE to pattern/range; skip for MVP
  return graphEvent;
}

export function toIcsFields(event: NormalizedEvent) {
  return {
    title: event.title,
    start: event.start,
    end: event.end,
    location: event.location || "",
    description: event.description || "",
    timezone: event.timezone,
    allDay: Boolean(event.allDay),
    recurrence: event.recurrence || null,
    reminders: event.reminders || null,
  };
}



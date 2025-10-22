import type { SignupForm } from "@/types/signup";

export type NormalizedEvent = {
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  allDay?: boolean;
  timezone: string; // IANA
  venue?: string;
  location?: string;
  description?: string;
  recurrence?: string | null; // RRULE:...
  reminders?: { minutes: number }[] | null;
  registries?: { label: string; url: string }[] | null;
  attachment?: { name: string; type: string; dataUrl: string } | null;
  signupForm?: SignupForm | null;
};

const splitParts = (value?: string | null): string[] =>
  (value || "")
    .split(/[,，\n]/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);

export function combineVenueAndLocation(
  venue?: string | null,
  location?: string | null
): string {
  const venueParts = splitParts(venue);
  let locationParts = splitParts(location);
  if (venueParts.length) {
    const venueSet = new Set(venueParts.map((part) => part.toLowerCase()));
    locationParts = locationParts.filter((part) => {
      const lower = part.toLowerCase();
      return !venueSet.has(lower);
    });
  }
  const allParts = [...venueParts, ...locationParts];
  if (!allParts.length) return "";
  const deduped: string[] = [];
  for (const part of allParts) {
    const lower = part.toLowerCase();
    if (deduped.some((existing) => existing.toLowerCase() === lower)) continue;
    deduped.push(part);
  }
  return deduped.join(", ");
}

export function toGoogleEvent(event: NormalizedEvent) {
  const isAllDay = Boolean(event.allDay);
  const start = isAllDay
    ? { date: event.start.slice(0, 10) }
    : // Keep local clock time exactly as typed; include the user's timezone
      (event.timezone && event.timezone.trim()
        ? { dateTime: event.start, timeZone: event.timezone }
        : { dateTime: event.start });
  const end = isAllDay
    ? { date: event.end.slice(0, 10) }
    : (event.timezone && event.timezone.trim()
        ? { dateTime: event.end, timeZone: event.timezone }
        : { dateTime: event.end });

  const overrides = (event.reminders || [])
    .filter((r) => typeof r.minutes === "number")
    .map((r) => ({ method: "popup" as const, minutes: r.minutes }));

  const requestBody: any = {
    summary: event.title,
    description: event.description || "",
    location: combineVenueAndLocation(event.venue, event.location),
    start,
    end,
  };
  if (overrides.length) requestBody.reminders = { useDefault: false, overrides };
  if (event.recurrence) requestBody.recurrence = [event.recurrence];
  return requestBody;
}

export function toMicrosoftEvent(event: NormalizedEvent) {
  const toGraphLocal = (s: string) => (s || "").slice(0, 19); // expect local 'YYYY-MM-DDTHH:mm:ss'
  const bodyContent = event.description || "";
  const graphEvent: any = {
    subject: event.title || "Event",
    body: { contentType: "HTML", content: bodyContent },
    location: {
      displayName: combineVenueAndLocation(event.venue, event.location),
    },
    // Preserve local clock time exactly as typed using the user's timezone
    start: { dateTime: toGraphLocal(event.start), timeZone: event.timezone || "UTC" },
    end: { dateTime: toGraphLocal(event.end), timeZone: event.timezone || "UTC" },
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
    location: combineVenueAndLocation(event.venue, event.location),
    description: event.description || "",
    timezone: event.timezone,
    allDay: Boolean(event.allDay),
    recurrence: event.recurrence || null,
    reminders: event.reminders || null,
  };
}

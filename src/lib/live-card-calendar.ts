import { buildCalendarLinks } from "../utils/calendar-links.ts";
import { addCalendarDays, parseCalendarDateTimeToIso } from "./calendar-date-time.ts";

type LiveCardCalendarData = {
  description?: string;
  eventDetails?: {
    eventDate?: string;
    startTime?: string;
    endTime?: string;
    calendarStartISO?: string;
    calendarEndISO?: string;
    location?: string;
    venueName?: string;
    detailsDescription?: string;
  } | null;
};

function clockTime(value: string): string | null {
  const input = value.trim().replace(/^at\s+/i, "");
  if (/^noon$/i.test(input)) return "12:00:00";
  if (/^midnight$/i.test(input)) return "00:00:00";
  const match =
    input.match(/^(\d{1,2})(?::(\d{2})(?::(\d{2}))?)?\s*([ap])\.?m\.?$/i) ||
    input.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const second = Number(match[3] || 0);
  const meridiem = match[4]?.toLowerCase();
  if (minute > 59 || second > 59 || hour > (meridiem ? 12 : 23) || (meridiem && hour < 1)) {
    return null;
  }
  if (meridiem) hour = (hour % 12) + (meridiem === "p" ? 12 : 0);
  return [hour, minute, second].map((part) => String(part).padStart(2, "0")).join(":");
}

function clockRange(value: string): { start: string | null; end: string | null } {
  const parts = value.split(/\s*(?:[-–—]|\bto\b)\s*/i);
  if (parts.length === 1) return { start: clockTime(value), end: null };
  if (parts.length !== 2) return { start: null, end: null };
  const trailingMeridiem = parts[1].match(/[ap]\.?m\.?$/i)?.[0];
  const start =
    clockTime(parts[0]) || (trailingMeridiem ? clockTime(`${parts[0]} ${trailingMeridiem}`) : null);
  return { start, end: clockTime(parts[1]) };
}

function explicitInstant(value?: string): string | null {
  const input = value?.trim() || "";
  if (!/T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(input)) return null;
  return parseCalendarDateTimeToIso(input, "UTC");
}

/** Resolve unzoned card times in the viewer's browser zone, never the server's zone. */
export function buildLiveCardCalendarLinks(
  title: string,
  invitationData: LiveCardCalendarData | null | undefined,
  viewerTimeZone: string | null,
) {
  if (!viewerTimeZone) return null;
  const details = invitationData?.eventDetails;
  if (!details) return null;
  const range = clockRange(details.startTime?.trim() || "");
  const eventDate = details.eventDate?.trim() || "";
  const savedStart = explicitInstant(details.calendarStartISO);
  const startIso =
    savedStart ||
    (/^\d{4}-\d{2}-\d{2}$/.test(eventDate) && range.start
      ? parseCalendarDateTimeToIso(`${eventDate}T${range.start}`, viewerTimeZone)
      : null);
  // An absent or unparseable time must not silently become midnight (or an invented 2 PM).
  if (!startIso) return null;

  let endIso = savedStart ? explicitInstant(details.calendarEndISO) : null;
  if (!savedStart) {
    const endClock = clockTime(details.endTime?.trim() || "") || range.end;
    if (endClock) {
      endIso = parseCalendarDateTimeToIso(`${eventDate}T${endClock}`, viewerTimeZone);
      if (endIso && endIso < startIso) {
        const nextDay = addCalendarDays(eventDate, 1);
        endIso = nextDay
          ? parseCalendarDateTimeToIso(`${nextDay}T${endClock}`, viewerTimeZone)
          : null;
      }
    }
  }
  if (!endIso || endIso <= startIso) {
    endIso = new Date(Date.parse(startIso) + 2 * 60 * 60 * 1000).toISOString();
  }
  return buildCalendarLinks({
    title: title || "Event",
    description: invitationData?.description?.trim() || details.detailsDescription?.trim() || "",
    location: details.location?.trim() || details.venueName?.trim() || "",
    startIso,
    endIso,
    timezone: viewerTimeZone,
    allDay: false,
    reminders: null,
    recurrence: null,
  });
}

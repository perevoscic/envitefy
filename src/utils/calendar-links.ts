import { buildCalendarDescription } from "../lib/calendar-description.ts";
import { normalizeCalendarTimeZone, parseCalendarDateTimeToIso } from "../lib/calendar-date-time.ts";

export type CalendarLinkArgs = {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string | null;
  timezone?: string;
  allDay: boolean;
  reminders: number[] | null;
  recurrence: string | null;
  details?: Record<string, unknown>;
  eventUrl?: string;
};

export type CalendarLinkSet = {
  appleInline: string;
  appleDownload: string;
  google: string;
  outlook: string;
};

export function buildCalendarLinks(args: CalendarLinkArgs): CalendarLinkSet {
  const { title, location, startIso, endIso, timezone, allDay } = args;
  const description = buildCalendarDescription(
    { ...args.details, title, description: args.description, location, start: startIso, end: endIso, timezone, allDay },
    { envitefyUrl: args.eventUrl },
  );
  const google = buildGoogleCalendarUrl({
    title,
    description,
    location,
    startIso,
    endIso,
    allDay,
    timezone: timezone || "",
  });
  const outlook = buildOutlookComposeUrl({
    title,
    description,
    location,
    startIso,
    endIso,
    allDay,
  });
  const ics = buildIcsLinks({
    title,
    description,
    location,
    startIso,
    endIso,
    allDay,
    reminders: args.reminders,
    recurrence: args.recurrence,
  });
  return {
    appleInline: ics.inlineUrl,
    appleDownload: ics.downloadUrl,
    google,
    outlook,
  };
}

function buildGoogleCalendarUrl({
  title,
  description,
  location,
  startIso,
  endIso,
  allDay,
  timezone,
}: {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string | null;
  allDay: boolean;
  timezone: string;
}): string {
  const encode = encodeURIComponent;
  const startOnly = !allDay && !endIso ? googleStartOnlyDate(startIso, timezone) : null;
  const dateParts = [allDay ? toGoogleDateOnly(startIso) : startOnly?.date || toGoogleTimestamp(startIso)];
  if (endIso) dateParts.push(allDay ? toGoogleDateOnly(endIso) : toGoogleTimestamp(endIso));
  const dates = dateParts.join("/");
  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encode(
    title || "Event"
  )}&details=${encode(description || "")}&location=${encode(
    location || ""
  )}&dates=${dates}`;
  const calendarZone = startOnly?.timezone || timezone;
  if (calendarZone) {
    url += `&ctz=${encode(calendarZone)}`;
  }
  return url;
}

/** Google parses a single dates value as a local clock, even with a Z suffix.
 * Pair it with ctz rather than duplicating the start as a fabricated end.
 * Google's editor may still supply its own default duration. */
function googleStartOnlyDate(iso: string, timezone: string): { date: string; timezone: string } {
  const zone = normalizeCalendarTimeZone(timezone);
  const utc = { date: toGoogleTimestamp(iso).replace(/Z$/, ""), timezone: "UTC" };
  try {
    const instant = new Date(iso);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(instant);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "00";
    const local = `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}:${value("second")}`;
    const roundTrip = parseCalendarDateTimeToIso(local, zone);
    // A repeated daylight-saving clock can name two instants. Use UTC if the
    // local clock would select a different occurrence from the supplied start.
    if (!roundTrip || Math.floor(Date.parse(roundTrip) / 1000) !== Math.floor(instant.getTime() / 1000)) return utc;
    return { date: local.replace(/[-:]/g, ""), timezone: zone };
  } catch {
    return utc;
  }
}

function buildOutlookComposeUrl({
  title,
  description,
  location,
  startIso,
  endIso,
  allDay,
}: {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string | null;
  allDay: boolean;
}): string {
  const params = new URLSearchParams({
    rru: "addevent",
    allday: String(Boolean(allDay)),
    subject: title || "Event",
    startdt: allDay ? startIso.slice(0, 10) : toOutlookParam(startIso),
    ...(endIso ? { enddt: allDay ? endIso.slice(0, 10) : toOutlookParam(endIso) } : {}),
    location: location || "",
    body: description || "",
    path: "/calendar/view/Month",
  }).toString();
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

function buildIcsLinks({
  title,
  description,
  location,
  startIso,
  endIso,
  allDay,
  reminders,
  recurrence,
}: {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string | null;
  allDay: boolean;
  reminders: number[] | null;
  recurrence: string | null;
}): { downloadUrl: string; inlineUrl: string } {
  const params = new URLSearchParams({
    title: title || "Event",
    start: startIso,
    ...(endIso ? { end: endIso } : {}),
    location: location || "",
    description: description || "",
    timezone: "",
    // Keep the instant's offset so calendar apps can display it in their local zone.
    floating: "0",
    allDay: String(allDay),
  });
  if (reminders?.length) {
    params.set("reminders", reminders.join(","));
  }
  if (recurrence) {
    params.set("recurrence", recurrence);
  }
  const base = `/api/ics?${params.toString()}`;
  return {
    downloadUrl: base,
    inlineUrl: `${base}${base.includes("?") ? "&" : "?"}disposition=inline`,
  };
}

function toGoogleTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getUTCFullYear()}` +
      `${pad(d.getUTCMonth() + 1)}` +
      `${pad(d.getUTCDate())}` +
      "T" +
      `${pad(d.getUTCHours())}` +
      `${pad(d.getUTCMinutes())}` +
      `${pad(d.getUTCSeconds())}` +
      "Z"
    );
  } catch {
    return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }
}

function toGoogleDateOnly(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getUTCFullYear()}` +
      `${pad(d.getUTCMonth() + 1)}` +
      `${pad(d.getUTCDate())}`
    );
  } catch {
    return iso.slice(0, 10).replace(/-/g, "");
  }
}

function toOutlookParam(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
    return d.toISOString();
  } catch {
    return iso;
  }
}

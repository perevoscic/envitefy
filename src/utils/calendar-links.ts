export type CalendarLinkArgs = {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string;
  timezone?: string;
  allDay: boolean;
  reminders: number[] | null;
  recurrence: string | null;
};

export type CalendarLinkSet = {
  appleInline: string;
  appleDownload: string;
  google: string;
  outlook: string;
};

export function ensureEndIso(
  startIso: string,
  endIso: string | null,
  allDay: boolean
): string {
  if (endIso) return endIso;
  try {
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return startIso;
    if (allDay) {
      start.setUTCDate(start.getUTCDate() + 1);
    } else {
      start.setUTCMinutes(start.getUTCMinutes() + 90);
    }
    return start.toISOString();
  } catch {
    return endIso || startIso;
  }
}

export function buildCalendarLinks(args: CalendarLinkArgs): CalendarLinkSet {
  const { title, description, location, startIso, endIso, timezone, allDay } =
    args;
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
  endIso: string;
  allDay: boolean;
  timezone: string;
}): string {
  const encode = encodeURIComponent;
  const dates = allDay
    ? `${toGoogleDateOnly(startIso)}/${toGoogleDateOnly(endIso)}`
    : `${toGoogleTimestamp(startIso)}/${toGoogleTimestamp(endIso)}`;
  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encode(
    title || "Event"
  )}&details=${encode(description || "")}&location=${encode(
    location || ""
  )}&dates=${dates}`;
  if (timezone) {
    url += `&ctz=${encode(timezone)}`;
  }
  return url;
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
  endIso: string;
  allDay: boolean;
}): string {
  const params = new URLSearchParams({
    rru: "addevent",
    allday: String(Boolean(allDay)),
    subject: title || "Event",
    startdt: toOutlookParam(startIso),
    enddt: toOutlookParam(endIso),
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
  reminders,
  recurrence,
}: {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string;
  reminders: number[] | null;
  recurrence: string | null;
}): { downloadUrl: string; inlineUrl: string } {
  const params = new URLSearchParams({
    title: title || "Event",
    start: startIso,
    end: endIso,
    location: location || "",
    description: description || "",
    timezone: "",
    floating: "1",
  });
  if (reminders && reminders.length) {
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
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-` +
      `${pad(d.getMonth() + 1)}-` +
      `${pad(d.getDate())}T` +
      `${pad(d.getHours())}:` +
      `${pad(d.getMinutes())}:` +
      `${pad(d.getSeconds())}`
    );
  } catch {
    return iso.replace(/\.\d{3}Z$/, "");
  }
}

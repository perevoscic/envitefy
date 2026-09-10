type CalendarDescriptionEvent = {
  title: string;
  start: string;
  end?: string;
  timezone?: string;
  allDay?: boolean;
  venue?: string;
  location?: string;
  description?: string;
};

function comparisonKey(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function dateTimeValues(value: string | undefined, timezone?: string, allDay?: boolean) {
  const dates = new Set<string>();
  const times = new Set<string>();
  if (!value) return { dates, times };
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return { dates, times };

  try {
    const timeZone = dateOnly ? "UTC" : timezone || "UTC";
    for (const dateStyle of ["full", "long", "medium", "short"] as const) {
      dates.add(
        comparisonKey(new Intl.DateTimeFormat("en-US", { timeZone, dateStyle }).format(date)),
      );
    }
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value;
    dates.add(comparisonKey(`${part("year")}-${part("month")}-${part("day")}`));
    dates.add(
      comparisonKey(
        new Intl.DateTimeFormat("en-US", {
          timeZone,
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }).format(date),
      ),
    );

    if (!allDay && !dateOnly) {
      for (const hour12 of [true, false]) {
        for (const timeZoneName of [undefined, "short", "long"] as const) {
          times.add(
            comparisonKey(
              new Intl.DateTimeFormat("en-US", {
                timeZone,
                hour: "numeric",
                minute: "2-digit",
                hour12,
                timeZoneName,
              }).format(date),
            ),
          );
        }
      }
    }
  } catch {
    // Invalid time zones must not make an export fail or remove unverified details.
  }
  return { dates, times };
}

/** Remove standalone copies of calendar fields; keep prose and secondary itinerary details. */
export function compactCalendarDescription(event: CalendarDescriptionEvent): string {
  const description = event.description?.trim() || "";
  if (!description) return "";
  const title = comparisonKey(event.title);
  const locations = new Set(
    [event.venue, event.location, [event.venue, event.location].filter(Boolean).join(", ")]
      .filter((value): value is string => Boolean(value))
      .map(comparisonKey),
  );
  const start = dateTimeValues(event.start, event.timezone, event.allDay);
  const end = dateTimeValues(event.end, event.timezone, event.allDay);
  const lines = description.split(/\r?\n/).filter((line) => {
    const plain = line
      .trim()
      .replace(/^(?:[-*•]\s+|#{1,6}\s+)/, "")
      .replace(/\*\*/g, "");
    if (/^event details\s*:?$/i.test(plain)) return false;
    const field = plain.match(/^([^:]+):\s*(.+)$/);
    if (!field) return !title || comparisonKey(plain) !== title;
    const label = comparisonKey(field[1]);
    const value = comparisonKey(field[2]);
    switch (label) {
      case "category":
      case "eventcategory":
        return false;
      case "event":
      case "title":
      case "eventtitle":
      case "eventname":
        return !title || value !== title;
      case "location":
      case "venue":
      case "address":
        return !locations.has(value);
      case "date":
      case "eventdate":
      case "startdate":
        return !start.dates.has(value);
      case "enddate":
        return !end.dates.has(value);
      case "time":
      case "start":
      case "starts":
      case "starttime":
        return !start.times.has(value);
      case "end":
      case "ends":
      case "endtime":
        return !end.times.has(value);
      default:
        return true;
    }
  });
  return lines
    .filter((line, index) => {
      if (!/^(?:Contacts|Notes)\s*:?$/i.test(line.trim())) return true;
      const next = lines
        .slice(index + 1)
        .find((item) => item.trim())
        ?.trim();
      return Boolean(next && !/^(?:Contacts|Notes|View on Envitefy)\s*:?$/i.test(next));
    })
    .join("\n")
    .replace(/\n[\t ]*\n(?:[\t ]*\n)+/g, "\n\n")
    .trim();
}

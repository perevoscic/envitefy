/** Month is one-based. An explicit year always wins; the day never changes the year. */
export function inferEventYear(month, anchor = new Date(), explicitYear = null) {
  return explicitYear ?? anchor.getFullYear() + (month < anchor.getMonth() + 1 ? 1 : 0);
}

/** A calendar reference in the event's zone, independent of the server's zone. */
export function eventCalendarReference(now = new Date(), timezone) {
  if (!timezone) return now;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    }).formatToParts(now);
    const number = (key) => Number(parts.find((part) => part.type === key)?.value);
    return new Date(
      number("year"),
      number("month") - 1,
      number("day"),
      number("hour"),
      number("minute"),
      number("second"),
    );
  } catch {
    return now;
  }
}

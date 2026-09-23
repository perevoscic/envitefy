import * as chrono from "chrono-node";
import { eventCalendarReference, inferEventYear } from "./event-date-year.mjs";

export const EVENT_YEAR_INSTRUCTION =
  "For a supplied month and day with no year, use the reference date's year when the month is the current month or later; use the following year only when the month is earlier. An earlier day or time within the current month stays in this year. An explicitly supplied year or relative year (such as next year) takes priority. Never invent a missing month, day or time.";

const eventDateParser = chrono.casual.clone();
eventDateParser.refiners.push({
  refine(context, results) {
    const anchor = context.refDate;
    const text = context.text;
    return results.filter((result) => {
      const start = result.start;
      if (
        !start.isCertain("month") ||
        !start.isCertain("day") ||
        start.isCertain("year") ||
        result.tags().has("result/relativeDate")
      )
        return true;
      const originalYear = start.get("year")!;
      const nearby = text.slice(
        Math.max(0, result.index - 18),
        result.index + result.text.length + 18,
      );
      const relativeYear = nearby.match(/\b(next|last|this)\s+year\b/i)?.[1]?.toLowerCase();
      const year = relativeYear
        ? anchor.getFullYear() + (relativeYear === "next" ? 1 : relativeYear === "last" ? -1 : 0)
        : inferEventYear(start.get("month")!, anchor);
      start.imply("year", year);
      if (result.end && !result.end.isCertain("year")) {
        result.end.imply("year", result.end.get("year")! + year - originalYear);
      }
      // February 29 must not silently become March 1 in a non-leap inferred year.
      return [start, result.end].every((part) => !part || part.isValidDate());
    });
  },
});

/** Central calendar rule for event intake. Explicit years and relative dates retain their meaning. */
export function parseEventDates(text: string, now = new Date(), timezone?: string) {
  return eventDateParser.parse(text, eventCalendarReference(now, timezone), { forwardDate: true });
}

/** Correct an AI-supplied date using its source, without changing unrelated dates or saved facts. */
export function normalizeExtractedEventDate(
  value: string,
  source: string,
  timezone?: string,
  now = new Date(),
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const matches = parseEventDates(source, now, timezone).filter(
    (result) =>
      result.start.isCertain("month") &&
      result.start.isCertain("day") &&
      result.start.get("month") === month &&
      result.start.get("day") === day,
  );
  const match =
    matches.find(
      (result) =>
        result.start.isCertain("year") && result.start.get("year") === Number(value.slice(0, 4)),
    ) ||
    matches.find((result) => result.start.isCertain("year")) ||
    matches[0];
  return match ? `${match.start.get("year")}-${value.slice(5)}` : value;
}

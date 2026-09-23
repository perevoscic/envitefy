import { inferEventYear } from "../event-date-year.mjs";

/**
 * When a printed invite omits the year, compare calendar months only.
 * Current/later month stays this year; an earlier month uses next year.
 * @param {Date} anchor  Typically "now" when the scan runs (server clock).
 * @param {Date} parsed  Candidate datetime (year from model/chrono is ignored except for time-of-day).
 * @returns {Date | null} Null when the inferred year cannot contain this date.
 */
export function resolveInferredInviteDatetime(anchor, parsed) {
  const month = parsed.getMonth();
  const day = parsed.getDate();
  const h = parsed.getHours();
  const min = parsed.getMinutes();
  const sec = parsed.getSeconds();
  const ms = parsed.getMilliseconds();

  const candidate = new Date(inferEventYear(month + 1, anchor), month, day, h, min, sec, ms);
  return candidate.getMonth() === month && candidate.getDate() === day ? candidate : null;
}

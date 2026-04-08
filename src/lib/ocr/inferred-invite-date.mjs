/**
 * When a printed invite omits the year, normalize the parsed Date to the next
 * upcoming occurrence of that month/day in the anchor calendar (local fields).
 * - If month/day is before "today" in the annual cycle, use anchor year + 1
 *   (covers December viewer + January event without special-casing).
 * - If it is the same calendar day as the anchor but the clock time is already
 *   past, roll to next year.
 * @param {Date} anchor  Typically "now" when the scan runs (server clock).
 * @param {Date} parsed  Candidate datetime (year from model/chrono is ignored except for time-of-day).
 * @returns {Date}
 */
export function resolveInferredInviteDatetime(anchor, parsed) {
  const month = parsed.getMonth();
  const day = parsed.getDate();
  const h = parsed.getHours();
  const min = parsed.getMinutes();
  const sec = parsed.getSeconds();
  const ms = parsed.getMilliseconds();

  const cy = anchor.getFullYear();
  const cm = anchor.getMonth();
  const cd = anchor.getDate();
  const todayStart = new Date(cy, cm, cd);

  let year = cy;
  let candidate = new Date(year, month, day, h, min, sec, ms);

  if (candidate < todayStart) {
    year += 1;
    candidate = new Date(year, month, day, h, min, sec, ms);
  } else if (
    candidate.getFullYear() === cy &&
    candidate.getMonth() === cm &&
    candidate.getDate() === cd &&
    candidate.getTime() < anchor.getTime()
  ) {
    year += 1;
    candidate = new Date(year, month, day, h, min, sec, ms);
  }

  return candidate;
}

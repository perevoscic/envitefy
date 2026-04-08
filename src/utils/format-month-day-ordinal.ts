const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function dayOrdinalSuffix(day: number): string {
  const j = day % 10;
  const k = day % 100;
  if (k >= 11 && k <= 13) return "th";
  if (j === 1) return "st";
  if (j === 2) return "nd";
  if (j === 3) return "rd";
  return "th";
}

/**
 * e.g. "April 19th". Use `utc: true` for ISO instants where calendar day should follow UTC (legacy birthday paths).
 */
export function formatMonthDayOrdinalEn(
  dateInput: string | Date | undefined | null,
  options?: { includeYearIfNotCurrent?: boolean; utc?: boolean },
): string {
  if (dateInput == null || dateInput === "") return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) {
    return typeof dateInput === "string" ? dateInput : "";
  }
  const utc = options?.utc ?? true;
  const month = utc ? date.getUTCMonth() : date.getMonth();
  const day = utc ? date.getUTCDate() : date.getDate();
  const year = utc ? date.getUTCFullYear() : date.getFullYear();
  const label = `${MONTHS_EN[month]} ${day}${dayOrdinalSuffix(day)}`;
  if (options?.includeYearIfNotCurrent) {
    const now = new Date();
    const cy = utc ? now.getUTCFullYear() : now.getFullYear();
    if (year !== cy) {
      return `${label}, ${year}`;
    }
  }
  return label;
}

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

export function formatWeekdayMonthDayOrdinalEn(
  dateInput: string | Date | undefined | null,
  options?: { includeYear?: boolean; utc?: boolean; includeComma?: boolean },
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
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    ...(utc ? { timeZone: "UTC" } : {}),
  }).format(date);
  const separator = options?.includeComma === false ? " " : ", ";
  const label = `${weekday}${separator}${MONTHS_EN[month]} ${day}${dayOrdinalSuffix(day)}`;
  if (options?.includeYear) {
    return `${label}, ${year}`;
  }
  return label;
}

export function formatTimeLabelEn(timeInput: string | undefined | null): string {
  if (timeInput == null || timeInput === "") return "";
  const raw = timeInput.trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) return raw;

  let hour = Number.parseInt(match[1] || "", 10);
  const minutes = Number.parseInt(match[2] || "", 10);
  const meridiem = (match[3] || "").toUpperCase();

  if (Number.isNaN(hour) || Number.isNaN(minutes)) return raw;

  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  const date = new Date(Date.UTC(2000, 0, 1, hour, minutes));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    ...(minutes !== 0 ? { minute: "2-digit" } : {}),
    hour12: true,
    timeZone: "UTC",
  })
    .format(date)
    .replace(/\s/g, "");
}

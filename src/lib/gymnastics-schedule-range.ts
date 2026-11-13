export type GymnasticsScheduleRange = "day" | "week" | "month";
export type GymnasticsSchedulePeriod = { kind: GymnasticsScheduleRange; startDate: string };

/** Empty imported dates describe supplied information, not promised future sessions. */
export function gymnasticsScheduleEmptyMessage(day: { source?: unknown }) {
  return day.source ? "No event scheduled." : "Sessions to be announced.";
}

const dayMilliseconds = 86_400_000;
function calendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed : null;
}

/** Calendar dates use UTC only for arithmetic; no venue or device clock is involved. */
export function gymnasticsScheduleRangeDates(kind: GymnasticsScheduleRange, value: string): string[] {
  const start = calendarDate(kind === "month" ? `${value}-01` : value);
  if (!start) return [];
  const dates: string[] = [];
  for (let offset = 0; offset < (kind === "day" ? 1 : kind === "week" ? 7 : 31); offset++) {
    const next = new Date(start.getTime() + offset * dayMilliseconds);
    if (kind === "month" && next.getUTCMonth() !== start.getUTCMonth()) break;
    const iso = next.toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return [];
    dates.push(iso);
  }
  return dates;
}

/** Periods are views of the same dated days; overlapping views never copy sessions. */
export function appendGymnasticsSchedulePeriod(existing: readonly GymnasticsSchedulePeriod[] = [], period: GymnasticsSchedulePeriod) {
  return [...existing.filter(item => item.kind !== period.kind || item.startDate !== period.startDate), period];
}

export function gymnasticsSchedulePeriods<T extends { id: string; isoDate?: string; date?: string }>(schedule: {
  days: readonly T[]; periods?: readonly GymnasticsSchedulePeriod[];
}) {
  const daysByDate = new Map(schedule.days.map(day => [gymnasticsScheduleDayDate(day), day]));
  const covered = new Set<string>();
  const periods: Array<{ id: string; kind: GymnasticsScheduleRange; label: string; dates: string[]; days: T[] }> = [];
  const format = (date: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(calendarDate(date)!);
  const add = (kind: GymnasticsScheduleRange, startDate: string, dates: string[]) => {
    const days = dates.map(date => daysByDate.get(date)).filter((day): day is T => Boolean(day));
    if (!days.length) return;
    days.forEach(day => covered.add(day.id));
    const label = kind === "month" ? format(startDate, { month: "long", year: "numeric" })
      : kind === "week" ? `${format(startDate, { month: "short", day: "numeric" })} – ${format(dates.at(-1)!, { month: "short", day: "numeric", year: "numeric" })}`
      : format(startDate, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    periods.push({ id: `${kind}:${startDate}`, kind, label, dates, days });
  };
  for (const period of schedule.periods || []) {
    if (!["day", "week", "month"].includes(period.kind)) continue;
    const dates = gymnasticsScheduleRangeDates(period.kind, period.kind === "month" ? period.startDate.slice(0, 7) : period.startDate);
    if (dates.length && !periods.some(item => item.id === `${period.kind}:${dates[0]}`)) add(period.kind, dates[0], dates);
  }
  // Imported and legacy dates stay individual days. Only an authored period
  // above can request a full week or month; never infer one from nearby dates.
  for (const day of schedule.days) {
    if (covered.has(day.id)) continue;
    const date = gymnasticsScheduleDayDate(day);
    if (!date) {
      periods.push({ id: `day:${day.id}`, kind: "day", label: day.date || "Date to confirm", dates: [], days: [day] });
      continue;
    }
    if (!periods.some(period => period.id === `day:${date}`)) add("day", date, [date]);
  }
  return periods;
}

/** Remove a period's own dates, retaining dates also explicitly added in another period. */
export function removeGymnasticsSchedulePeriod<T extends { id: string; isoDate?: string; date?: string }, S extends {
  days: T[]; periods?: GymnasticsSchedulePeriod[];
}>(schedule: S, periodId: string): S {
  const target = gymnasticsSchedulePeriods(schedule).find(period => period.id === periodId);
  if (!target) return schedule;
  const periods = (schedule.periods || []).filter(period => `${period.kind}:${period.startDate}` !== periodId);
  const retainedDates = new Set(periods.flatMap(period => gymnasticsScheduleRangeDates(period.kind,
    period.kind === "month" ? period.startDate.slice(0, 7) : period.startDate)));
  const removed = new Set(target.days.filter(day => !retainedDates.has(gymnasticsScheduleDayDate(day) || "")).map(day => day.id));
  return { ...schedule, periods, days: schedule.days.filter(day => !removed.has(day.id)) };
}

export function gymnasticsScheduleDayDate(day: { isoDate?: string; date?: string }): string | null {
  if (day.isoDate && calendarDate(day.isoDate)) return day.isoDate;
  if (day.date && calendarDate(day.date)) return day.date;
  // Older schedules may have only an authored English date. Require its year;
  // never deduplicate an ambiguous short label against a guessed calendar date.
  const match = day.date?.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,\s*|\s+)(\d{4})\b/i);
  if (!match) return null;
  const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(match[1].slice(0, 3).toLowerCase()) + 1;
  const candidate = `${match[3]}-${String(month).padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  return calendarDate(candidate) ? candidate : null;
}

export function createGymnasticsScheduleDay(isoDate: string, id: string) {
  const date = calendarDate(isoDate);
  if (!date) throw new Error("Choose a valid schedule date.");
  return {
    id,
    isoDate,
    date: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date),
    shortDate: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric" }).format(date),
    sessions: [],
  };
}

/** Fill dates without replacing a day's identity, sessions, clubs or extra source data. */
export function appendGymnasticsScheduleDays<T extends { id: string; isoDate?: string; date?: string }>(
  existing: readonly T[], dates: readonly string[], createId: () => string,
) {
  const known = new Set(existing.map(gymnasticsScheduleDayDate).filter(Boolean));
  const additions = dates.filter(date => {
    if (!calendarDate(date) || known.has(date)) return false;
    known.add(date);
    return true;
  })
    .map(date => createGymnasticsScheduleDay(date, createId()));
  return [...existing, ...additions].sort((a, b) => {
    const first = gymnasticsScheduleDayDate(a);
    const second = gymnasticsScheduleDayDate(b);
    return first && second ? first.localeCompare(second) : first ? -1 : second ? 1 : 0;
  });
}

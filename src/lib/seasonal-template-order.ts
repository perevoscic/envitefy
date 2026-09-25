import { HOLIDAY_COLLECTIONS, type HolidayCollectionId } from "./holiday-collections";
import type { HolidayDateRule } from "./holiday-collection-types";

export type GalleryOrder = "seasonal" | "original";
export type SeasonalTemplate = { id: string; season?: string; occasion?: string };
export type DateWindow = { start: number; end: number };
const DAY = 86_400_000;
export const SEASONAL_LOOKAHEAD_DAYS = 90;
const dayNumber = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day) / DAY;

/** Capture the visitor's civil day. UTC below is arithmetic only, never their timezone. */
export function localGalleryDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDay(day: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  const value = dayNumber(Number(match[1]), Number(match[2]), Number(match[3]));
  return new Date(value * DAY).toISOString().slice(0, 10) === day ? value : null;
}

// Gregorian Easter, Oudin algorithm published by the U.S. Naval Observatory.
function easter(year: number): number {
  const div = (a: number, b: number) => Math.trunc(a / b);
  const c = div(year, 100), n = year % 19, k = div(c - 17, 25);
  let i = (c - div(c, 4) - div(c - k, 3) + 19 * n + 15) % 30;
  i -= div(i, 28) * (1 - div(i, 28) * div(29, i + 1) * div(21 - n, 11));
  const j = (year + div(year, 4) + i + 2 - c + div(c, 4)) % 7;
  const l = i - j, month = 3 + div(l + 40, 44), day = l + 28 - 31 * div(month, 4);
  return dayNumber(year, month, day);
}

// One scan per calendar/year, shared by every collection and template in a gallery.
const calendarDays = new Map<string, Map<string, number[]>>();
function calendarDates(calendar: string, year: number, month: string, day: number): number[] {
  const key = `${calendar}:${year}`;
  let days = calendarDays.get(key);
  if (!days) {
    days = new Map();
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        calendar, timeZone: "UTC", month: "numeric", day: "numeric",
      });
      // Unsupported calendars must never silently become Gregorian holidays.
      if (formatter.resolvedOptions().calendar !== calendar) return [];
      for (let date = dayNumber(year, 1, 1); date < dayNumber(year + 1, 1, 1); date++) {
        const parts = formatter.formatToParts(new Date(date * DAY));
        const monthValue = parts.find((part) => part.type === "month")?.value;
        const dayValue = parts.find((part) => part.type === "day")?.value;
        const dateKey = `${monthValue}:${dayValue}`;
        const matches = days.get(dateKey) || [];
        matches.push(date);
        days.set(dateKey, matches);
      }
    } catch {
      return [];
    }
    if (calendarDays.size >= 24) calendarDays.clear();
    calendarDays.set(key, days);
  }
  return days.get(`${month}:${day}`) || [];
}

/** Discovery windows only. Never used to fill, change or save an event's dates. */
export function holidayWindows(rule: HolidayDateRule, year: number): DateWindow[] {
  const span = (start: number, duration = 1) => [{ start, end: start + duration - 1 }];
  switch (rule.kind) {
    case "fixed": return span(dayNumber(year, rule.month, rule.day), rule.duration);
    case "weekday": {
      const first = dayNumber(year, rule.month, 1);
      const last = dayNumber(year, rule.month + 1, 0);
      const date = rule.occurrence === -1
        ? last - (new Date(last * DAY).getUTCDay() - rule.weekday + 7) % 7
        : first + (rule.weekday - new Date(first * DAY).getUTCDay() + 7) % 7 + 7 * (rule.occurrence - 1);
      return span(date);
    }
    case "easter": return span(easter(year) + (rule.offset || 0));
    case "calendar": return calendarDates(rule.calendar, year, rule.month, rule.day)
      .flatMap((start) => span(start - Number(Boolean(rule.eve)), (rule.duration || 1) + Number(Boolean(rule.eve))));
    case "window": {
      const start = dayNumber(year, ...rule.start);
      let end = dayNumber(year, ...rule.end);
      if (end < start) end = dayNumber(year + 1, ...rule.end);
      return [{ start, end }];
    }
    case "dates": {
      const date = rule.dates[String(year)];
      if (date) {
        const [month, day] = date.split("-").map(Number);
        // A small planning window accommodates regional/evening observance differences.
        return span(dayNumber(year, month, day) - 1, 3);
      }
      // Outside verified years, use a broad seasonal window, never an invented date.
      return [{ start: dayNumber(year, rule.fallback[0], 1), end: dayNumber(year, rule.fallback[1] + 1, 0) }];
    }
  }
}

const legacyOccasions: Record<string, HolidayCollectionId> = {
  "fall-and-seasonal--corn-maze": "corn-maze",
  "fall-and-seasonal--school-trunk-or-treat": "trunk-or-treat",
  "fall-and-seasonal--thanksgiving-feast": "thanksgiving",
  "fall-and-seasonal--friendsgiving": "friendsgiving",
  "church-and-community--community-egg-hunt": "easter",
  "church-and-community--school-backpack-packing": "back-to-school",
  "school-and-education--school-graduation-reception": "graduation",
  "winter-and-holidays--classroom-christmas-party": "christmas",
  "winter-and-holidays--community-christmas-dinner": "christmas",
  "winter-and-holidays--christmas-toy-drive": "christmas",
  "winter-and-holidays--holiday-gift-wrapping": "christmas",
  "winter-and-holidays--hanukkah-community-potluck": "hanukkah",
  "winter-and-holidays--school-valentine-party": "valentines-day",
};

export function templateOccasion(template: SeasonalTemplate): HolidayCollectionId | undefined {
  if (template.occasion) {
    const collection = HOLIDAY_COLLECTIONS.find(({ id }) => id === template.occasion);
    if (collection) return collection.id;
  }
  const id = template.id;
  const legacy = legacyOccasions[id];
  if (legacy) return legacy;
  if (id.startsWith("fall-and-seasonal--")) return "fall-harvest";
  return undefined;
}

const seasonRules: Record<string, HolidayDateRule> = {
  spring: { kind: "window", start: [3, 1], end: [5, 31] },
  summer: { kind: "window", start: [6, 1], end: [8, 31] },
  fall: { kind: "window", start: [9, 1], end: [11, 30] },
  winter: { kind: "window", start: [12, 1], end: [3, 0] },
};

function scoreWindows(windows: DateWindow[], today: number, seasonal = false): number {
  let best = -1;
  for (const { start, end } of windows) {
    if (today > end || start - today > SEASONAL_LOOKAHEAD_DAYS) continue;
    const distance = Math.max(0, start - today);
    best = Math.max(best, (seasonal ? 80 : 100) - distance / 3);
  }
  return best;
}

export function seasonalCollectionScores(day: string): Map<string, number> {
  const today = parseDay(day);
  if (today === null) return new Map();
  const year = new Date(today * DAY).getUTCFullYear();
  const years = [year - 1, year, year + 1];
  const scores = new Map<string, number>();
  for (const collection of HOLIDAY_COLLECTIONS) {
    scores.set(collection.id, scoreWindows(years.flatMap((y) => holidayWindows(collection.date, y)), today));
  }
  for (const [season, rule] of Object.entries(seasonRules)) {
    scores.set(`season:${season}`, scoreWindows(years.flatMap((y) => holidayWindows(rule, y)), today, true));
  }
  return scores;
}

export function templateSeasonKey(template: SeasonalTemplate): string | undefined {
  const occasion = templateOccasion(template);
  if (occasion) return occasion;
  const season = template.season?.trim().toLowerCase().replace("autumn", "fall");
  if (season && season in seasonRules) return `season:${season}`;
  if (["winter-snow-lodge", "sparkle-splash"].includes(template.id)) return "season:winter";
  if (template.id === "church-and-community--library-summer-reading") return "season:summer";
  if (template.id === "beach-surf-shack") return "season:summer";
  if (template.id.startsWith("winter-and-holidays--") || template.id === "holiday-gathering") return "season:winter";
  return undefined;
}

/** Stable within each collection, immutable, and mixed across timely collections. */
export function orderSeasonalTemplates<T extends SeasonalTemplate>(templates: readonly T[], day: string | null, order: GalleryOrder = "seasonal"): T[] {
  if (order === "original" || !day) return [...templates];
  const scores = seasonalCollectionScores(day);
  if (!scores.size) return [...templates];
  const timely = new Map<string, T[]>(), evergreen: T[] = [], later: T[] = [];
  for (const template of templates) {
    const key = templateSeasonKey(template);
    if (!key) { evergreen.push(template); continue; }
    if ((scores.get(key) ?? -1) <= 0) { later.push(template); continue; }
    const bucket = timely.get(key) || [];
    bucket.push(template);
    timely.set(key, bucket);
  }
  const buckets = [...timely].sort(([a], [b]) => (scores.get(b) || 0) - (scores.get(a) || 0))
    .map(([, values]) => values.sort((a, b) => Number(b.id.startsWith("holidays--")) - Number(a.id.startsWith("holidays--"))));
  const result: T[] = [];
  const maxLength = Math.max(0, ...buckets.map((values) => values.length));
  for (let index = 0; index < maxLength; index++) {
    for (const values of buckets) if (values[index]) result.push(values[index]);
  }
  return [...result, ...evergreen, ...later];
}

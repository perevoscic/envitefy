import type { FootballGame, FootballHome } from "./football-games";
import { parseCalendarDateTimeToIso } from "./calendar-date-time";

function calendarDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1900 &&
    year <= 2200 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    : "";
}

/** Normalize printed US schedule dates without guessing an absent season/year. */
export function normalizeFootballGameDate(value?: string | null, season?: string | null) {
  const text = (value || "").trim();
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T ])/);
  if (iso) return calendarDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const cleaned = text
    .replace(
      /^(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)[,.]?\s+/i,
      "",
    )
    .replace(/(\d)(?:st|nd|rd|th)\b/gi, "$1")
    .replace(/,/g, "")
    .trim();
  const numeric = cleaned.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}|\d{2}))?$/);
  const named = cleaned.match(/^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:\s+(\d{4}))?$/i);
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const month = numeric
    ? Number(numeric[1])
    : named
      ? months.indexOf(named[1].slice(0, 3).toLowerCase()) + 1
      : 0;
  const day = Number(numeric?.[2] || named?.[2] || 0);
  const explicit = numeric?.[3] || named?.[3];
  let year = explicit ? Number(explicit.length === 2 ? `20${explicit}` : explicit) : 0;
  if (!year && season) {
    const years = [...season.matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));
    const range = season.match(/\b(20\d{2})\s*[-/–]\s*(20\d{2}|\d{2})\b/);
    if (range) {
      const first = Number(range[1]);
      const last = Number(range[2].length === 2 ? `20${range[2]}` : range[2]);
      if (last === first + 1) year = month < 7 ? last : first;
    } else if (new Set(years).size === 1) year = years[0];
  }
  return calendarDate(year, month, day);
}

export function footballToday(timezone?: string, now = Date.now()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(now));
    const value = (type: string) => parts.find((part) => part.type === type)?.value;
    return `${value("year")}-${value("month")}-${value("day")}`;
  } catch {
    return new Date(now).toISOString().slice(0, 10);
  }
}

export function groupFootballGames(games: FootballGame[], home: FootballHome, now = Date.now()) {
  const today = footballToday(home.timezone, now);
  const groups: { upcoming: FootballGame[]; past: FootballGame[]; undated: FootballGame[] } = {
    upcoming: [],
    past: [],
    undated: [],
  };
  for (const game of games) {
    const date = normalizeFootballGameDate(game.date, home.season);
    const kickoff = date && home.timezone && /^\d{2}:\d{2}$/.test(game.time || "")
      ? parseCalendarDateTimeToIso(`${date}T${game.time}`, home.timezone) : null;
    // A final result establishes completion, including older records without a date.
    if (game.result || (date && date < today) || (kickoff && Date.parse(kickoff) < now)) groups.past.push(game);
    else if (date) groups.upcoming.push(game);
    else groups.undated.push(game);
  }
  const dateKey = (game: FootballGame) =>
    `${normalizeFootballGameDate(game.date, home.season)} ${game.time || ""}`;
  groups.upcoming.sort((a, b) => dateKey(a).localeCompare(dateKey(b)));
  groups.past.sort((a, b) => dateKey(b).localeCompare(dateKey(a)));
  return groups;
}

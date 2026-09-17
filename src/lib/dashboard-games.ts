import { type FootballGame, type FootballHome, hasFootballGame } from "./football-games.ts";
import { groupFootballGames, normalizeFootballGameDate } from "./football-schedule-dates.ts";
import { formatCalendarDateTimeInTimeZone, parseCalendarDateTimeToIso } from "./calendar-date-time.ts";
import { resolveFootballTeamName } from "./football-team-name.ts";
import { resolveWaltonFootballProgram } from "./football-walton-program.ts";

export type DashboardGame = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventHref: string;
  sport?: string;
  game: FootballGame;
  home: FootballHome;
};

export type DashboardGameSource = {
  id: string;
  title: string;
  public_slug: string | null;
  sport?: string | null;
  games: unknown;
  home: unknown;
};

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

function gameDate(value: unknown) {
  if (typeof value === "string") return value;
  const parts = record(value);
  return [parts.year, parts.month, parts.day].every((part) => typeof part === "number" && Number.isInteger(part))
    ? `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}` : "";
}

function gameTime(value: string) {
  const match = value.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?$/i);
  if (match && Number(match[1]) >= 1 && Number(match[1]) <= 12 && Number(match[2] || 0) < 60) {
    const hour = Number(match[1]) % 12 + (match[3].toLowerCase() === "p" ? 12 : 0);
    return `${String(hour).padStart(2, "0")}:${match[2] || "00"}`;
  }
  const clock = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  return clock && Number(clock[1]) < 24 && Number(clock[2]) < 60
    ? `${clock[1].padStart(2, "0")}:${clock[2]}` : value;
}

/** Project stored fixtures without inventing a kickoff or a missing season/year. */
export function dashboardGamesFromSources(sources: DashboardGameSource[], now = Date.now()): DashboardGame[] {
  const items: DashboardGame[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    const rawHome = record(source.home);
    const home: FootballHome = {
      teamName: text(rawHome.teamName), teamMascot: text(rawHome.teamMascot),
      season: text(rawHome.season), timezone: text(rawHome.timezone),
      homeVenue: text(rawHome.homeVenue), homeAddress: text(rawHome.homeAddress),
    };
    if (!Array.isArray(source.games)) continue;
    source.games.forEach((value: unknown, index) => {
      const raw = record(value);
      if (/^(?:cancelled|canceled|postponed|completed|finished|final|draft)$/i.test(text(raw.status))) return;
      const start = text(raw.startAt) || text(raw.start);
      const localStart = raw.allDay !== true && /T\d{2}:\d{2}/.test(start)
        ? home.timezone ? formatCalendarDateTimeInTimeZone(start, home.timezone) : start : null;
      const lookup = record(raw.venueLookup);
      const game: FootballGame = {
        id: text(raw.id) || `game-${index + 1}`,
        opponent: text(raw.opponent) || text(raw.title),
        opponentMascot: text(raw.opponentMascot),
        date: gameDate(raw.date) || localStart?.slice(0, 10) || start,
        time: gameTime(text(raw.time) || text(raw.startTime) || localStart?.slice(11, 16) || ""),
        homeAway: raw.homeAway === "home" || raw.homeAway === "away" || raw.homeAway === "neutral"
          ? raw.homeAway : typeof raw.home === "boolean" ? raw.home ? "home" : "away" : "",
        venue: text(raw.venue) || text(raw.location), address: text(raw.address),
        result: raw.result === "W" || raw.result === "L" || raw.result === "T" ? raw.result : null,
        score: text(raw.score), notes: text(raw.notes) || text(raw.description),
        ticketsLink: text(raw.ticketsLink), broadcast: text(raw.broadcast), conference: raw.conference === true,
        venueLookup: {
          venueSource: text(lookup.venueSource), ticketsSource: text(lookup.ticketsSource),
          schoolTickets: lookup.schoolTickets === true,
        },
      };
      const date = normalizeFootballGameDate(game.date, home.season);
      if (!date || !hasFootballGame(game)) return;
      game.date = date;
      const id = `${source.id}:${game.id}`;
      if (seen.has(id)) return;
      seen.add(id);
      items.push({
        id, eventId: source.id, eventTitle: source.title,
        sport: text(source.sport).toLowerCase().replace(/[_-]/g, " ").match(/\b(football|soccer|basketball|baseball|softball|volleyball|hockey|tennis|pickleball|gymnastics|cheerleading|lacrosse|rugby|wrestling)\b/)?.[1] || "",
        eventHref: `/event/${encodeURIComponent(source.public_slug || source.id)}?tab=event#games`,
        game, home: !text(raw.opponent) && text(raw.title) ? { ...home, teamName: "" } : home,
      });
    });
  }
  // Keep source identities until the API has applied each event's RSVP state.
  return filterUpcomingGames(items, now);
}

function filterUpcomingGames(items: DashboardGame[], now: number) {
  const start = ({ game, home }: DashboardGame) => {
    const date = normalizeFootballGameDate(game.date, home.season);
    const iso = home.timezone && /^\d{2}:\d{2}$/.test(game.time || "")
      ? parseCalendarDateTimeToIso(`${date}T${game.time}`, home.timezone) : null;
    return iso || `${date}T${/^\d{2}:\d{2}$/.test(game.time || "") ? game.time : "00:00"}:00Z`;
  };
  return items.filter(({ game, home }) => groupFootballGames([game], home, now).upcoming.length > 0)
    .sort((a, b) => start(a).localeCompare(start(b)) || a.id.localeCompare(b.id));
}

const identityText = (value = "") => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function teamIdentity(name = "", mascot = "", context = "") {
  if (resolveWaltonFootballProgram(name, context)) return "walton defuniak springs";
  let school = identityText(name).replace(/\bhigh school\b/g, "").replace(/\s+football$/, "").replace(/\s+/g, " ").trim();
  const suppliedMascot = identityText(mascot);
  if (suppliedMascot && school.endsWith(` ${suppliedMascot}`)) school = school.slice(0, -suppliedMascot.length).trim();
  return identityText(resolveFootballTeamName(school));
}

function fixtureKey({ game, home, eventTitle, id }: DashboardGame) {
  const team = teamIdentity(home.teamName, home.teamMascot, game.opponent);
  const opponent = teamIdentity(game.opponent, game.opponentMascot, home.teamName);
  if (!team || !opponent) return `source:${id}`;
  const level = eventTitle.match(/\b(junior varsity|jv|freshman|varsity)\b/i)?.[1]?.toLowerCase().replace("junior varsity", "jv") || "";
  return JSON.stringify([normalizeFootballGameDate(game.date, home.season), [team, opponent].sort(), level]);
}

function kickoffKey({ game, home }: DashboardGame) {
  if (!/^\d{2}:\d{2}$/.test(game.time || "")) return "";
  const date = normalizeFootballGameDate(game.date, home.season);
  return home.timezone ? parseCalendarDateTimeToIso(`${date}T${game.time}`, home.timezone) || game.time : game.time;
}

function mergeFixtureDetails(first: DashboardGame, second: DashboardGame): DashboardGame {
  const completeness = ({ game }: DashboardGame) =>
    [game.time, game.venue, game.address, game.ticketsLink, game.notes, game.broadcast, game.venueLookup?.venueSource, game.venueLookup?.ticketsSource].filter(Boolean).length;
  const [preferred, other] = completeness(second) > completeness(first) ? [second, first] : [first, second];
  const game = { ...preferred.game };
  for (const field of ["time", "venue", "address", "ticketsLink", "notes", "broadcast"] as const) {
    if (!game[field] && other.game[field]) game[field] = other.game[field];
  }
  game.venueLookup = {
    ...other.game.venueLookup,
    ...preferred.game.venueLookup,
    venueSource: preferred.game.venueLookup?.venueSource || other.game.venueLookup?.venueSource,
    ticketsSource: preferred.game.venueLookup?.ticketsSource || other.game.venueLookup?.ticketsSource,
    schoolTickets: preferred.game.ticketsLink ? preferred.game.venueLookup?.schoolTickets : other.game.venueLookup?.schoolTickets,
  };
  return { ...preferred, sport: preferred.sport || other.sport, game, home: { ...preferred.home, timezone: preferred.home.timezone || other.home.timezone } };
}

/** Count and render each fixture once, including responses cached before deduplication. */
export function upcomingDashboardGames(items: DashboardGame[], now = Date.now()) {
  const groups = new Map<string, DashboardGame[]>();
  for (const item of filterUpcomingGames(items, now)) {
    const key = fixtureKey(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }
  const unique: DashboardGame[] = [];
  for (const group of groups.values()) {
    const sports = new Set(group.map((item) => item.sport).filter(Boolean));
    const sportKey = (item: DashboardGame) => item.sport || (sports.size === 1 ? [...sports][0] : "") || "";
    const matches = new Map<string, DashboardGame>();
    for (const item of group) {
      const sport = sportKey(item);
      const kickoffs = new Set(group.filter((candidate) => sportKey(candidate) === sport).map(kickoffKey).filter(Boolean));
      // A missing time joins a single known kickoff, but never guesses between a doubleheader.
      const time = kickoffKey(item) || (kickoffs.size === 1 ? [...kickoffs][0] : "");
      const key = JSON.stringify([sport, time]);
      const previous = matches.get(key);
      matches.set(key, previous ? mergeFixtureDetails(previous, item) : item);
    }
    unique.push(...matches.values());
  }
  return filterUpcomingGames(unique, now);
}

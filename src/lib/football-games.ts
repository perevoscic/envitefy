import { footballTeamLabel } from "./football-team-name.ts";

export type FootballGame = {
  id: string;
  opponent?: string;
  opponentMascot?: string;
  date?: string;
  time?: string;
  homeAway?: "home" | "away" | "neutral" | "" | null;
  venue?: string;
  address?: string;
  conference?: boolean;
  broadcast?: string;
  ticketsLink?: string;
  result?: "W" | "L" | "T" | null;
  score?: string;
  notes?: string;
  venueLookup?: {
    venueSource?: string;
    ticketsSource?: string;
    schoolTickets?: boolean;
    checkedAt?: string;
  };
  context?: FootballGameContext | null;
};
export type FootballGameContext = {
  key: string;
  miles?: number;
  minutes?: number;
  routeSummary?: string;
  routeVersion?: number;
  routeProvider?: "google" | "mapbox";
  weather?: { summary: string; tempF: number; checkedAt: string };
};
export const FOOTBALL_ROUTE_VERSION = 2;
export type FootballHome = {
  season?: string;
  teamName?: string;
  teamMascot?: string;
  homeVenue?: string;
  homeAddress?: string;
  timezone?: string;
};

export function footballGameLocation(game: FootballGame, home: FootballHome) {
  const same = (a?: string, b?: string) => a?.trim().toLowerCase() === b?.trim().toLowerCase();
  const useHomeVenue = game.homeAway === "home" && (!game.address?.trim() || same(game.address, home.homeAddress));
  const useHomeAddress = game.homeAway === "home" && (!game.venue?.trim() || same(game.venue, home.homeVenue));
  return {
    venue: game.venue?.trim() || (useHomeVenue ? home.homeVenue?.trim() : "") || "",
    address:
      game.address?.trim() || (useHomeAddress ? home.homeAddress?.trim() : "") || "",
  };
}
export function footballGameContextKey(game: FootballGame, home: FootballHome) {
  const location = footballGameLocation(game, home);
  return JSON.stringify([
    home.homeAddress || "",
    location.address,
    location.venue,
    game.date || "",
    game.time || "",
    game.homeAway || "",
    home.timezone || "",
  ]);
}
export function footballSchoolMatchup(game: FootballGame, teamName = "") {
  const opponent = game.opponent?.trim() || "";
  if (!opponent) return teamName || "Game";
  if (!teamName) return opponent;
  return [teamName, game.homeAway === "away" ? "at" : "vs", opponent].filter(Boolean).join(" ");
}
export function footballMatchup(game: FootballGame, teamName = "", teamMascot = "") {
  return footballSchoolMatchup(
    { ...game, opponent: footballTeamLabel(game.opponent, game.opponentMascot) },
    footballTeamLabel(teamName, teamMascot),
  );
}
export function footballDirections(game: FootballGame, home: FootballHome) {
  const { venue, address } = footballGameLocation(game, home);
  if (!address && !venue) return null;
  const params = new URLSearchParams({
    api: "1",
    destination: address || venue,
    travelmode: "driving",
  });
  if (game.homeAway === "away" && home.homeAddress?.trim())
    params.set("origin", home.homeAddress.trim());
  return `https://www.google.com/maps/dir/?${params}`;
}
export function hasFootballGame(game: FootballGame) {
  return Boolean(
    game.opponent?.trim() ||
      game.date?.trim() ||
      game.venue?.trim() ||
      game.address?.trim() ||
      game.notes?.trim(),
  );
}
export function footballLink(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

/** A lookup started before a user edit must not put old details on the new game. */
export function mergeFootballGameDetails(current: FootballGame, original: FootballGame, found: FootballGame) {
  const fields = ["id", "opponent", "date", "time", "homeAway", "venue", "address", "ticketsLink"] as const;
  if (fields.some((field) => (current[field] || "") !== (original[field] || ""))) return current;
  return {
    ...current,
    venue: current.venue || found.venue,
    address: current.address || found.address,
    ticketsLink: current.ticketsLink || found.ticketsLink,
    venueLookup: found.venueLookup || current.venueLookup,
    context: found.context,
  };
}

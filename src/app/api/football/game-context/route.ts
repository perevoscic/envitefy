import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { enrichFootballGames } from "@/lib/football-game-context";
import type { FootballGame, FootballHome } from "@/lib/football-games";
import { lookupFootballVenues } from "@/lib/football-venue-lookup";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedRequestUser(request);
    if (!user.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    const isText = (value: unknown) =>
      value == null || (typeof value === "string" && value.length <= 500);
    if (
      !body ||
      !Array.isArray(body.games) ||
      body.games.length > 40 ||
      !body.home ||
      ![undefined, "venues", "discover", "travel"].includes(body.phase) ||
      ((body.phase === "travel" || body.phase === "discover") && body.games.length > 4) ||
      ![body.home.teamName, body.home.homeVenue, body.home.homeAddress, body.home.timezone].every(
        isText,
      ) ||
      !body.games.every(
        (game: Record<string, unknown>) =>
          game &&
          typeof game === "object" &&
          typeof game.id === "string" &&
          game.id.length > 0 &&
          [
            game.id,
            game.opponent,
            game.date,
            game.time,
            game.venue,
            game.address,
            game.ticketsLink,
          ].every(isText) &&
          [undefined, null, "", "home", "away", "neutral"].includes(
            game.homeAway as string | null | undefined,
          ),
      )
    ) {
      return NextResponse.json(
        { error: "Provide up to 40 games and your team name or home stadium." },
        { status: 400 },
      );
    }
    const home: FootballHome = body.home;
    const games: FootballGame[] = body.games;
    // Publish verified locations/tickets before running slower road or web lookups.
    // Each request stays bounded; a failed batch cannot discard the whole season.
    const resolved =
      body.phase === "travel"
        ? { home, games: await enrichFootballGames(games, home) }
        : await lookupFootballVenues(games, home, { allowSearch: body.phase === "discover" });
    return NextResponse.json(resolved, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(
      "[football-game-context] Request failed",
      error instanceof Error ? error.name : "Error",
    );
    return NextResponse.json(
      {
        error:
          "Game details are temporarily unavailable. Please try again; details already found are kept.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

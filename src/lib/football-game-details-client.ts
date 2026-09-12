import {
  FOOTBALL_ROUTE_VERSION,
  footballGameContextKey,
  footballGameLocation,
  type FootballGame,
  type FootballHome,
} from "./football-games";

type Details = { games: FootballGame[]; home: FootballHome };
type Phase = "venues" | "discover" | "travel";
export type FootballDetailsUpdate = Details & { previous: Details };

class DetailsRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function requestFootballGameDetails(
  details: Details,
  phase: Phase,
  signal: AbortSignal,
): Promise<Details> {
  const response = await fetch("/api/football/game-context", {
    method: "POST",
    credentials: "include",
    signal: AbortSignal.any([signal, AbortSignal.timeout(55_000)]),
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...details, phase }),
  });
  // Proxies, expired sessions and development errors can return HTML. Never
  // expose a JSON parser exception or the server's HTML in the editor.
  const result = response.headers.get("content-type")?.includes("application/json")
    ? await response.json().catch(() => null)
    : null;
  if (!response.ok || !result || !Array.isArray(result.games) || !result.home) {
    const message =
      response.status === 401
        ? "Sign in again to find game details. Keep this editor open to preserve your changes."
        : "The game lookup service did not respond. Details already found are kept; try again for the rest.";
    throw new DetailsRequestError(message, response.status);
  }
  return { games: result.games, home: result.home };
}

/** Resolve public facts first, then routes in small batches, then unknown schools. */
export async function updateFootballGameDetails({
  games: sourceGames,
  home: sourceHome,
  signal,
  onUpdate,
  onProgress,
}: Details & {
  signal: AbortSignal;
  onUpdate: (update: FootballDetailsUpdate) => void;
  onProgress: (message: string) => void;
}) {
  let games = sourceGames;
  let home = sourceHome;
  const errors = new Set<string>();
  const run = async (batch: FootballGame[], phase: Phase) => {
    signal.throwIfAborted();
    const previous = { games: batch, home };
    try {
      const result = await requestFootballGameDetails(previous, phase, signal);
      signal.throwIfAborted();
      onUpdate({ ...result, previous });
      signal.throwIfAborted();
      home = result.home;
      games = games.map((game) => result.games.find((found) => found.id === game.id) || game);
      return result.games;
    } catch (error) {
      signal.throwIfAborted();
      if (error instanceof DetailsRequestError && error.status === 401) throw error;
      errors.add(
        error instanceof DetailsRequestError
          ? error.message
          : "Some game details could not be loaded. Try again for the remaining details.",
      );
      return [];
    }
  };
  const needsDrive = (game: FootballGame) =>
    game.homeAway === "away" &&
    home.homeAddress &&
    footballGameLocation(game, home).address &&
    !(
      game.context?.key === footballGameContextKey(game, home) &&
      game.context.routeVersion === FOOTBALL_ROUTE_VERSION &&
      game.context.miles != null
    );
  const needsForecast = (game: FootballGame) => {
    const days = (Date.parse(`${game.date}T12:00:00`) - Date.now()) / 86_400_000;
    return Boolean(
      game.time && footballGameLocation(game, home).address && days >= -1 && days <= 3,
    );
  };
  const travelAttempted = new Set<string>();
  const travel = async () => {
    const pending = games.filter(
      (game) =>
        !travelAttempted.has(footballGameContextKey(game, home)) &&
        (needsDrive(game) || needsForecast(game)),
    );
    for (let start = 0; start < pending.length; start += 4) {
      onProgress(
        `Calculating stadium-to-stadium drives (${Math.min(start + 4, pending.length)} of ${pending.length})…`,
      );
      for (const game of pending.slice(start, start + 4))
        travelAttempted.add(footballGameContextKey(game, home));
      await run(pending.slice(start, start + 4), "travel");
    }
  };

  onProgress("Finding official ticket links and stadium addresses…");
  await run(games, "venues");
  await travel();

  // Search each hosting school once. Existing directory results remain visible
  // while these less predictable searches run, and each success is applied.
  const hosts = new Set<string>();
  const pending = games.filter((game) => {
    const host =
      game.homeAway === "away" ? game.opponent : game.homeAway === "home" ? home.teamName : "";
    if (!host || /^(tbd|tba|bye)$/i.test(host) || hosts.has(host.toLowerCase())) return false;
    if (game.ticketsLink && footballGameLocation(game, home).address) return false;
    hosts.add(host.toLowerCase());
    return true;
  });
  if (home.teamName && !home.homeAddress && !pending.length) {
    onProgress("Finding your home stadium…");
    await run([], "discover");
  }
  for (let start = 0; start < pending.length; start += 2) {
    onProgress(
      `Checking remaining hosting schools (${Math.min(start + 2, pending.length)} of ${pending.length})…`,
    );
    const found = await run(
      pending
        .slice(start, start + 2)
        .map((game) => games.find((current) => current.id === game.id) || game),
      "discover",
    );
    if (found.length) await run(games, "venues");
    await travel();
  }
  return { games, home, errors: [...errors] };
}

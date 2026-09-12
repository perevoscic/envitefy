import {
  footballGameContextKey,
  footballGameLocation,
  FOOTBALL_ROUTE_VERSION,
  type FootballGame,
  type FootballHome,
} from "./football-games";

type Point = [number, number];
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

async function json(url: URL) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4_500), cache: "no-store" });
    return response.ok ? record(await response.json()) : {};
  } catch {
    return {};
  }
}
async function geocode(address: string, token: string): Promise<Point | null> {
  if (!address.trim() || !token) return null;
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("types", "address,poi");
  const data = await json(url);
  const feature = record(array(data.features)[0]);
  const center = array(feature.center);
  if (
    (number(feature.relevance) ?? 0) < 0.8 ||
    number(center[0]) == null ||
    number(center[1]) == null
  )
    return null;
  return [center[0] as number, center[1] as number];
}
async function drive(origin: Point, destination: Point, token: string) {
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.join(",")};${destination.join(",")}`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("overview", "false");
  url.searchParams.set("alternatives", "true");
  const data = await json(url);
  return selectFootballDrivingRoute(array(data.routes));
}

async function googleDrive(origin: string, destination: string) {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !origin || !destination) return null;
  try {
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(5_000),
      headers: {
        "Content-Type": "application/json", "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.description",
      },
      body: JSON.stringify({
        origin: { address: origin }, destination: { address: destination },
        travelMode: "DRIVE", routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: true, units: "IMPERIAL",
      }),
    });
    if (!response.ok) return null;
    const data = record(await response.json());
    const candidates = array(data.routes).map(record).map((route) => ({
      distance: route.distanceMeters,
      duration: typeof route.duration === "string" && /^\d+(?:\.\d+)?s$/.test(route.duration) ? Number.parseFloat(route.duration) : null,
      legs: [{ summary: route.description }],
    }));
    const route = selectFootballDrivingRoute(candidates);
    return "miles" in route ? { ...route, routeProvider: "google" as const } : null;
  } catch {
    return null;
  }
}

/** Mapbox sorts by routing weight, which can favor a much longer interstate
 * detour. Compare its viable alternatives for a stadium-to-stadium mileage card. */
export function selectFootballDrivingRoute(routes: unknown[]) {
  const candidates = routes.map(record).filter((route) => {
    const distance = number(route.distance);
    const duration = number(route.duration);
    return distance != null && duration != null && distance >= 0 && duration >= 0;
  });
  candidates.sort((a, b) => (number(a.distance) || 0) - (number(b.distance) || 0) || (number(a.duration) || 0) - (number(b.duration) || 0));
  const route = candidates[0] || {};
  const distance = number(route.distance);
  const duration = number(route.duration);
  const summary = array(route.legs).map((leg) => record(leg).summary).filter((value): value is string => typeof value === "string" && !!value.trim()).join(" · ");
  return distance != null && duration != null && distance >= 0 && duration >= 0
    ? { miles: Math.round((distance / 1609.344) * 10) / 10, minutes: Math.round(duration / 60), routeSummary: summary, routeVersion: FOOTBALL_ROUTE_VERSION, routeProvider: "mapbox" as const }
    : {};
}
async function forecast(game: FootballGame, address: string) {
  const key = process.env.WEATHERAPI_KEY || process.env.WEATHERAPI_API_KEY;
  if (!key || !address || !game.date || !game.time || !/^\d{2}:\d{2}$/.test(game.time))
    return undefined;
  const days = (Date.parse(game.date) - Date.now()) / 86_400_000;
  if (!Number.isFinite(days) || days < -1 || days > 3) return undefined;
  const url = new URL("https://api.weatherapi.com/v1/forecast.json");
  url.searchParams.set("key", key);
  url.searchParams.set("q", address);
  url.searchParams.set("days", "3");
  const data = await json(url);
  const hours = array(record(data.forecast).forecastday).flatMap((day) => array(record(day).hour));
  const hour = hours
    .map(record)
    .find((item) => item.time === `${game.date} ${game.time?.slice(0, 2)}:00`);
  const tempF = number(hour?.temp_f);
  const summary = record(hour?.condition).text;
  return tempF != null && typeof summary === "string"
    ? { tempF, summary, checkedAt: new Date().toISOString() }
    : undefined;
}

/** Optional provider results never become fabricated source facts or prevent import. */
export async function enrichFootballGames(
  games: FootballGame[],
  home: FootballHome,
): Promise<FootballGame[]> {
  const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_API_KEY || "";
  const coordinates = new Map<string, Promise<Point | null>>();
  const point = (address: string) => {
    let pending = coordinates.get(address);
    if (!pending) {
      pending = geocode(address, token);
      coordinates.set(address, pending);
    }
    return pending;
  };
  const routeTo = async (address: string) => {
    if (!home.homeAddress || !address) return {};
    const google = await googleDrive(home.homeAddress, address);
    if (google) return google;
    const [origin, destination] = await Promise.all([point(home.homeAddress), point(address)]);
    return origin && destination ? drive(origin, destination, token) : {};
  };
  const result = [...games];
  for (let start = 0; start < Math.min(games.length, 40); start += 4) {
    await Promise.all(
      games.slice(start, start + 4).map(async (game, index) => {
        const { address } = footballGameLocation(game, home);
        const [route, weather] = await Promise.all([
          game.homeAway === "away" && home.homeAddress && address
            ? routeTo(address)
            : Promise.resolve({}),
          forecast(game, address),
        ]);
        result[start + index] = {
          ...game,
          context: {
            key: footballGameContextKey(game, home),
            ...(game.context?.key === footballGameContextKey(game, home) && game.context.routeVersion === FOOTBALL_ROUTE_VERSION ? game.context : {}),
            ...route,
            ...(weather ? { weather } : {}),
          },
        };
      }),
    );
  }
  return result;
}

import type { EventWeatherForecast, EventWeatherResult, EventWeatherTarget } from "./event-weather";

const cache = new Map<string, { expires: number; value: EventWeatherResult }>();
const pending = new Map<string, Promise<EventWeatherResult>>();
const DAY_MS = 86_400_000;
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const text = (value: unknown): string =>
  typeof value === "string" ? value.trim().slice(0, 300) : "";

async function resolveWeatherCoordinates(
  location: string,
): Promise<{ query: string } | Exclude<EventWeatherResult, EventWeatherForecast>> {
  const inline = location.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (inline && Math.abs(Number(inline[1])) <= 90 && Math.abs(Number(inline[2])) <= 180)
    return { query: `${Number(inline[1])},${Number(inline[2])}` };
  const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_API_KEY;
  if (!token) return { status: "unconfigured" };
  if (location.length > 256 || location.includes(";")) return { status: "location_unavailable" };
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("access_token", token);
  url.searchParams.set("q", location);
  url.searchParams.set("autocomplete", "false");
  url.searchParams.set("permanent", "true");
  url.searchParams.set("types", "address,place,locality,postcode,neighborhood");
  url.searchParams.set("limit", "3");
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { status: "unavailable" };
    const data = record(await response.json());
    const candidates = (Array.isArray(data.features) ? data.features : [])
      .map(record)
      .flatMap((feature) => {
        const coordinates = record(feature.geometry).coordinates;
        const properties = record(feature.properties);
        if (
          !Array.isArray(coordinates) ||
          number(coordinates[0]) === null ||
          number(coordinates[1]) === null ||
          Math.abs(coordinates[0]) > 180 ||
          Math.abs(coordinates[1]) > 90
        )
          return [];
        // An address lookup must retain the supplied house number and a strong provider match.
        if (/^\d+[a-z]?\s/i.test(location)) {
          const match = record(properties.match_code);
          if (
            properties.feature_type !== "address" ||
            match.address_number !== "matched" ||
            !["exact", "high"].includes(text(match.confidence))
          )
            return [];
        }
        return [{ lat: coordinates[1] as number, lng: coordinates[0] as number }];
      });
    const point = candidates[0];
    if (!point && /^\d+[a-z]?\s/i.test(location) && location.includes(",")) {
      // Weather can use the explicitly supplied city even when a street number has no match.
      // This never changes the saved address or invents a different city.
      const area = location
        .split(",")
        .slice(1)
        .map((part) => part.trim())
        .filter(Boolean)
        .join(", ");
      if (area) return resolveWeatherCoordinates(area);
    }
    // Nearby neighborhood variants can share a forecast; distant matches remain ambiguous.
    if (
      !point ||
      candidates.some(
        (other) => Math.abs(other.lat - point.lat) > 0.2 || Math.abs(other.lng - point.lng) > 0.2,
      )
    )
      return { status: "location_unavailable" };
    return { query: `${point.lat},${point.lng}` };
  } catch {
    return { status: "unavailable" };
  }
}

async function fetchForecast(target: EventWeatherTarget, key: string): Promise<EventWeatherResult> {
  const resolved = await resolveWeatherCoordinates(target.location);
  if (!("query" in resolved)) return resolved;
  const url = new URL("https://api.weatherapi.com/v1/forecast.json");
  url.searchParams.set("key", key);
  url.searchParams.set("q", resolved.query);
  url.searchParams.set("days", "3");
  url.searchParams.set("aqi", "no");
  url.searchParams.set("alerts", "no");
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { status: "unavailable" };
    const payload = record(await response.json());
    const place = record(payload.location);
    const today = text(place.localtime).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(today) && target.date < today) return { status: "past" };
    const days = record(payload.forecast).forecastday;
    if (!Array.isArray(days)) return { status: "unavailable" };
    // Match the event's local calendar date, never the current weather or a neighboring day.
    const selected = days.map(record).find((day) => day.date === target.date);
    if (!selected) return { status: "outside_window" };
    const day = record(selected.day);
    const hours = Array.isArray(selected.hour) ? selected.hour.map(record) : [];
    const hour = target.time
      ? hours.find((item) => text(item.time) === `${target.date} ${target.time.slice(0, 2)}:00`)
      : null;
    if (target.time && !hour) return { status: "unavailable" };
    const weather = hour || day;
    const summary = text(record(weather.condition).text);
    const tempF = number(hour ? hour.temp_f : day.avgtemp_f);
    const tempC = number(hour ? hour.temp_c : day.avgtemp_c);
    if (!summary && tempF === null && tempC === null) return { status: "unavailable" };
    const rain = number(hour ? hour.chance_of_rain : day.daily_chance_of_rain);
    const result: EventWeatherForecast = {
      status: "available",
      location:
        [text(place.name), text(place.region)].filter(Boolean).join(", ") || target.location,
      date: target.date,
      time: hour ? text(hour.time).slice(11, 16) : null,
      summary,
      tempF,
      tempC,
      highF: number(day.maxtemp_f),
      highC: number(day.maxtemp_c),
      lowF: number(day.mintemp_f),
      lowC: number(day.mintemp_c),
      rainChance: rain !== null && rain >= 0 && rain <= 100 ? rain : null,
      windMph: number(hour ? hour.wind_mph : day.maxwind_mph),
      windKph: number(hour ? hour.wind_kph : day.maxwind_kph),
      checkedAt: new Date().toISOString(),
    };
    return result;
  } catch {
    return { status: "unavailable" };
  }
}

export async function getEventWeather(target: EventWeatherTarget): Promise<EventWeatherResult> {
  if (!target.location || !target.date) return { status: "missing_details" };
  // A one-day margin accounts for the venue's calendar day before its timezone is returned.
  const utcToday = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const delta = (Date.parse(`${target.date}T00:00:00Z`) - utcToday) / DAY_MS;
  if (delta < -1) return { status: "past" };
  if (delta > 3) return { status: "outside_window" };
  const apiKey = process.env.WEATHERAPI_KEY || process.env.WEATHERAPI_API_KEY;
  if (!apiKey) return { status: "unconfigured" };
  const cacheKey = JSON.stringify([target.location.toLowerCase(), target.date, target.time]);
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value;
  const inFlight = pending.get(cacheKey);
  if (inFlight) return inFlight;
  for (const [entryKey, entry] of cache) if (entry.expires <= Date.now()) cache.delete(entryKey);
  if (pending.size >= 100) return { status: "unavailable" };
  const job = fetchForecast(target, apiKey)
    .then((value) => {
      if (cache.size >= 500) cache.delete(cache.keys().next().value!);
      cache.set(cacheKey, {
        value,
        expires: Date.now() + (value.status === "available" ? 15 * 60_000 : 60_000),
      });
      return value;
    })
    .finally(() => pending.delete(cacheKey));
  pending.set(cacheKey, job);
  return job;
}

import type { ConciergeEventDraft, ConciergeWeatherContext } from "./types.ts";

const WEATHER_FORECAST_WINDOW_HOURS = 24 * 3;
const WEATHER_FETCH_TIMEOUT_MS = 2_500;
const GENERIC_WEATHER_HOUR = 12;
const WEATHER_TIME_HINTS = [
  { pattern: /\b(?:this\s+)?morning\b/i, hour: 9 },
  { pattern: /\b(?:this\s+)?afternoon\b/i, hour: 15 },
  { pattern: /\b(?:this\s+)?evening\b/i, hour: 19 },
  { pattern: /\btonight\b/i, hour: 21 },
] as const;

function resolveWeatherApiKey() {
  return process.env.WEATHERAPI_KEY || process.env.WEATHERAPI_API_KEY || null;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function finiteNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function shouldDiscussWeather(message: string) {
  return /\b(weather|forecast|temperature|temp|rain|raining|storm|snow|wind|hot|cold|humid|outdoor|outside)\b/i.test(
    message,
  );
}

function asksAboutEventWeather(message: string) {
  return /\b(that\s+day|during\s+(?:the\s+)?event|at\s+(?:the\s+)?event|for\s+(?:the\s+)?event|event\s+(?:day|time|weather|forecast)|when\s+(?:guests|people|everyone)\s+(?:arrive|arrives|are\s+there|show\s+up))\b/i.test(
    message,
  );
}

function asksAboutRelativeWeather(message: string) {
  return /\b(today|tomorrow|tonight|this\s+morning|this\s+afternoon|this\s+evening|morning|afternoon|evening)\b/i.test(
    message,
  );
}

function weatherContext(
  patch: Partial<ConciergeWeatherContext> & Pick<ConciergeWeatherContext, "status" | "message">,
): ConciergeWeatherContext {
  return {
    location: null,
    eventIso: null,
    summary: null,
    tempF: null,
    checkedAt: null,
    source: null,
    ...patch,
  };
}

function eventIsoFromDraft(draft: ConciergeEventDraft | null) {
  return cleanString(draft?.startISO);
}

function eventLocationFromDraft(draft: ConciergeEventDraft | null) {
  return cleanString(draft?.location) || cleanString(draft?.venue);
}

function eventIsoFromData(data: Record<string, unknown>) {
  return cleanString(data.startAt) || cleanString(data.startISO) || cleanString(data.start);
}

function eventLocationFromData(data: Record<string, unknown>) {
  return (
    cleanString(data.location) ||
    cleanString(data.venue) ||
    cleanString(data.address) ||
    cleanString(data.placeName) ||
    cleanString(data.locationLabel)
  );
}

function targetIsoForRelativeWeather(message: string) {
  const target = new Date();
  if (/\btomorrow\b/i.test(message)) {
    target.setDate(target.getDate() + 1);
  }
  const hint = WEATHER_TIME_HINTS.find(({ pattern }) => pattern.test(message));
  target.setHours(hint?.hour ?? GENERIC_WEATHER_HOUR, 0, 0, 0);
  if (target.getTime() < Date.now()) {
    target.setTime(Date.now() + 60 * 60 * 1000);
  }
  return target.toISOString();
}

function buildMissingLocationContext(eventIso: string | null) {
  return weatherContext({
    status: "missing_location",
    eventIso,
    message: "Sure, what city should I check?",
  });
}

function buildMissingDetailsContext(location: string | null, eventIso: string | null) {
  const missing = [eventIso ? null : "date and time", location ? null : "location"].filter(Boolean);
  return weatherContext({
    status: "missing_event_details",
    location,
    eventIso,
    message: `I can check the forecast once I have the event ${missing.join(" and ")}.`,
  });
}

function buildOutsideWindowContext(location: string, eventIso: string) {
  return weatherContext({
    status: "outside_forecast_window",
    location,
    eventIso,
    message:
      "Reliable event weather is only available close to the date. I can help plan indoor/outdoor backup notes now, then check the forecast within three days of the event.",
  });
}

function buildUnconfiguredContext(location: string, eventIso: string) {
  return weatherContext({
    status: "unconfigured",
    location,
    eventIso,
    message:
      "I have the event date and place, but live weather lookup is not configured for this environment.",
  });
}

function weatherMessage(summary: string | null, tempF: number | null) {
  if (summary && tempF != null) return `${summary}, about ${Math.round(tempF)}°F.`;
  if (summary) return summary;
  if (tempF != null) return `About ${Math.round(tempF)}°F.`;
  return null;
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEATHER_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWeatherAtEvent(params: {
  location: string;
  eventIso: string;
}): Promise<{ summary: string | null; tempF: number | null }> {
  const apiKey = resolveWeatherApiKey();
  if (!apiKey) return { summary: null, tempF: null };
  const url = new URL("https://api.weatherapi.com/v1/forecast.json");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", params.location);
  url.searchParams.set("days", "3");
  url.searchParams.set("aqi", "no");
  url.searchParams.set("alerts", "no");
  const response = await fetchWithTimeout(url.toString()).catch(() => null);
  if (!response?.ok) return { summary: null, tempF: null };
  const payload = await response.json().catch(() => null);
  const forecastDays = asRecord(asRecord(payload).forecast).forecastday;
  const hourly: Record<string, unknown>[] = [];
  for (const day of Array.isArray(forecastDays) ? forecastDays : []) {
    const hours = asRecord(day).hour;
    if (!Array.isArray(hours)) continue;
    for (const hour of hours) hourly.push(asRecord(hour));
  }
  const targetMs = new Date(params.eventIso).getTime();
  let bestHour: Record<string, unknown> | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const hour of hourly) {
    const epoch = finiteNumber(hour.time_epoch);
    const timestamp = epoch != null ? epoch * 1000 : Number.NaN;
    if (!Number.isFinite(timestamp)) continue;
    const delta = Math.abs(timestamp - targetMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestHour = hour;
    }
  }
  if (!bestHour) return { summary: null, tempF: null };
  const summary = cleanString(asRecord(bestHour.condition).text);
  const tempF = finiteNumber(bestHour.temp_f);
  return { summary, tempF };
}

export function shouldResolveConciergeWeatherContext(message: string) {
  return shouldDiscussWeather(cleanString(message) || "");
}

export async function resolveConciergeWeatherContextFromDraft(params: {
  message: string;
  draft: ConciergeEventDraft | null;
}): Promise<ConciergeWeatherContext | null> {
  if (!shouldResolveConciergeWeatherContext(params.message)) return null;
  const location = eventLocationFromDraft(params.draft);
  const draftEventIso = eventIsoFromDraft(params.draft);
  const relative = asksAboutRelativeWeather(params.message);
  const eventSpecific = asksAboutEventWeather(params.message);
  const eventIso = relative
    ? targetIsoForRelativeWeather(params.message)
    : eventSpecific
      ? draftEventIso
      : draftEventIso || targetIsoForRelativeWeather(params.message);
  if (!location) return buildMissingLocationContext(eventIso);
  if (!eventIso) return buildMissingDetailsContext(location, eventIso);

  const hoursToStart = (new Date(eventIso).getTime() - Date.now()) / (1000 * 60 * 60);
  if (
    !Number.isFinite(hoursToStart) ||
    hoursToStart < 0 ||
    hoursToStart > WEATHER_FORECAST_WINDOW_HOURS
  ) {
    return buildOutsideWindowContext(location, eventIso);
  }
  if (!resolveWeatherApiKey()) return buildUnconfiguredContext(location, eventIso);

  const weather = await fetchWeatherAtEvent({ location, eventIso });
  const message = weatherMessage(weather.summary, weather.tempF);
  if (!message) {
    return weatherContext({
      status: "unavailable",
      location,
      eventIso,
      checkedAt: new Date().toISOString(),
      source: "weatherapi",
      message:
        "I tried to check the forecast for that date and place, but weather details are not available right now.",
    });
  }
  return weatherContext({
    status: "available",
    location,
    eventIso,
    summary: weather.summary,
    tempF: weather.tempF,
    checkedAt: new Date().toISOString(),
    source: "weatherapi",
    message: `The forecast near ${location} is ${message}`,
  });
}

export async function resolveConciergeWeatherContextFromEvent(params: {
  message: string;
  eventData: Record<string, unknown>;
}): Promise<ConciergeWeatherContext | null> {
  if (!shouldResolveConciergeWeatherContext(params.message)) return null;
  const location = eventLocationFromData(params.eventData);
  const dataEventIso = eventIsoFromData(params.eventData);
  const relative = asksAboutRelativeWeather(params.message);
  const eventSpecific = asksAboutEventWeather(params.message);
  const eventIso = relative
    ? targetIsoForRelativeWeather(params.message)
    : eventSpecific
      ? dataEventIso
      : dataEventIso || targetIsoForRelativeWeather(params.message);
  if (!location) return buildMissingLocationContext(eventIso);
  if (!eventIso) return buildMissingDetailsContext(location, eventIso);

  const hoursToStart = (new Date(eventIso).getTime() - Date.now()) / (1000 * 60 * 60);
  if (
    !Number.isFinite(hoursToStart) ||
    hoursToStart < 0 ||
    hoursToStart > WEATHER_FORECAST_WINDOW_HOURS
  ) {
    return buildOutsideWindowContext(location, eventIso);
  }
  if (!resolveWeatherApiKey()) return buildUnconfiguredContext(location, eventIso);

  const weather = await fetchWeatherAtEvent({ location, eventIso });
  const message = weatherMessage(weather.summary, weather.tempF);
  if (!message) {
    return weatherContext({
      status: "unavailable",
      location,
      eventIso,
      checkedAt: new Date().toISOString(),
      source: "weatherapi",
      message:
        "I tried to check the forecast for that event, but weather details are not available right now.",
    });
  }
  return weatherContext({
    status: "available",
    location,
    eventIso,
    summary: weather.summary,
    tempF: weather.tempF,
    checkedAt: new Date().toISOString(),
    source: "weatherapi",
    message: `The forecast near ${location} is ${message}`,
  });
}

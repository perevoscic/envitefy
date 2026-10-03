export type EventWeatherTarget = { location: string; date: string; time: string };
export type EventWeatherForecast = {
  status: "available";
  location: string;
  date: string;
  time: string | null;
  summary: string;
  tempF: number | null;
  tempC: number | null;
  highF: number | null;
  highC: number | null;
  lowF: number | null;
  lowC: number | null;
  rainChance: number | null;
  windMph: number | null;
  windKph: number | null;
  checkedAt: string;
};
export type EventWeatherResult =
  | EventWeatherForecast
  | {
      status:
        | "missing_details"
        | "location_unavailable"
        | "outside_window"
        | "past"
        | "unconfigured"
        | "unavailable";
    };

export function parseEventWeatherTarget(value: unknown): EventWeatherTarget | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.location !== "string" ||
    typeof raw.date !== "string" ||
    typeof raw.time !== "string"
  )
    return null;
  const location = raw.location.trim(),
    date = raw.date,
    time = raw.time;
  if (location.length > 1000 || /[\r\n\x00]/.test(location)) return null;
  if (
    date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)
  )
    return null;
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  return { location, date, time };
}

import { find } from "geo-tz";

/** Use geographic boundaries, never the host's timezone or a state-wide guess. */
export function locationTimezone(latitude: number, longitude: number): string {
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  )
    return "";
  const zones = find(latitude, longitude);
  if (zones.length !== 1 || zones[0].startsWith("Etc/")) return "";
  try {
    new Intl.DateTimeFormat("en", { timeZone: zones[0] }).format();
    return zones[0];
  } catch {
    return "";
  }
}

import { searchBuilderAddress } from "./livecard-address-server";
import { locationTimezone } from "./livecard-location-timezone";

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const record = (value: unknown): Record<string, any> =>
  value && typeof value === "object" ? (value as Record<string, any>) : {};
const words = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/);

export async function resolveEventLocationTimezone(query: string): Promise<string | null> {
  // Written street numbers are equivalent for lookup; the authored address is never rewritten.
  const numbers: Record<string, string> = {
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
  };
  const address = query.replace(
    /^(one|two|three|four|five|six|seven|eight|nine|ten)\b/i,
    (value) => numbers[value.toLowerCase()],
  );
  if (/^\d+\S*\s/.test(address)) {
    const result = await searchBuilderAddress({ query: address });
    return result?.location?.resolution === "verified" ? result.location.timezone || null : null;
  }
  const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_API_KEY;
  if (!token) return null;
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("access_token", token);
  url.searchParams.set("q", query);
  url.searchParams.set("autocomplete", "false");
  url.searchParams.set("types", "place,locality");
  url.searchParams.set("limit", "3");
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const raw = record(await response.json());
  const candidates = (Array.isArray(raw.features) ? raw.features : [])
    .map(record)
    .filter((feature) => {
      const p = record(feature.properties);
      const geography = words(
        [text(p.name), text(p.place_formatted), text(p.context?.region?.region_code)].join(" "),
      );
      return (
        ["place", "locality"].includes(p.feature_type) &&
        words(query).every((word) => geography.includes(word))
      );
    });
  if (candidates.length !== 1) return null;
  const coordinates = record(candidates[0].geometry).coordinates;
  return Array.isArray(coordinates)
    ? locationTimezone(coordinates[1], coordinates[0]) || null
    : null;
}

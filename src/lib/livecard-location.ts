import type { LiveCardForm, LiveCardLocation } from "./livecard-builder.ts";

export type BuilderPlace = {
  placeId: string;
  venue: string;
  address: string;
  city: string;
  region?: string;
  latitude: number;
  longitude: number;
};
export type BuilderLocationResult = {
  candidates: BuilderPlace[];
  location: LiveCardLocation | null;
  message: string;
};

export function isOnlineEventLocation(value: string): boolean {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

export function readBuilderPlace(value: unknown): BuilderPlace | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (!["placeId", "venue", "address", "city"].every((key) => typeof item[key] === "string"))
    return null;
  if (
    typeof item.latitude !== "number" ||
    typeof item.longitude !== "number" ||
    !Number.isFinite(item.latitude) ||
    Math.abs(item.latitude) > 90 ||
    !Number.isFinite(item.longitude) ||
    Math.abs(item.longitude) > 180
  )
    return null;
  return {
    placeId: String(item.placeId),
    venue: String(item.venue),
    address: String(item.address),
    city: String(item.city),
    region: typeof item.region === "string" ? item.region : undefined,
    latitude: item.latitude,
    longitude: item.longitude,
  };
}

/** Match a specific venue name, or use supplied geography to distinguish branches. */
export function chooseBuilderPlace(
  candidates: BuilderPlace[],
  venue: string,
  city: string,
  address = "",
): BuilderPlace | null {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/\bstreet\b/g, "st")
      .replace(/\bboulevard\b/g, "blvd")
      .replace(/\bavenue\b/g, "ave")
      .replace(/\broad\b/g, "rd")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const contains = (haystack: string, needle: string) =>
    normalize(needle)
      .split(" ")
      .filter(Boolean)
      .every((token) => normalize(haystack).split(" ").includes(token));
  const matches = candidates.filter((candidate) => {
    if (address.trim())
      return contains(candidate.address, address) && (!venue || contains(candidate.venue, venue));
    // A host may include the shopping center, street or city in the venue field.
    // Require every token, a specific query and one unique result; never accept a chain name alone.
    const queryTokens = normalize(venue).split(" ").filter(Boolean);
    const contextualMatch =
      !city.trim() &&
      queryTokens.length >= 3 &&
      contains(`${candidate.venue} ${candidate.address}`, venue) &&
      (contains(candidate.address, venue) ||
        (queryTokens.some((token) => normalize(candidate.venue).split(" ").includes(token)) &&
          queryTokens.some((token) => !normalize(candidate.venue).split(" ").includes(token))));
    return (
      contextualMatch ||
      Boolean(
        venue.trim() &&
          contains(candidate.venue, venue) &&
          (city.trim()
            ? contains(`${candidate.city} ${candidate.region || ""} ${candidate.address}`, city)
            : normalize(candidate.venue) === normalize(venue) ||
              (normalize(venue).split(" ").length >= 2 &&
                normalize(candidate.venue).replace(/ \d+$/, "") === normalize(venue))),
      )
    );
  });
  return matches.length === 1 ? matches[0] : null;
}

export type LocationPreparationIssue = {
  query: string;
  message: string;
  candidates: BuilderPlace[];
};
export const locationLookupKey = (location: LiveCardLocation) =>
  JSON.stringify([
    location.query,
    location.venue,
    location.address,
    location.city,
    location.placeId,
    location.timezone,
    location.resolution,
  ]);

/** Results own only the location that was searched. Keep concurrent edits and removed stops. */
export function mergeResolvedLocation(
  current: LiveCardForm,
  before: LiveCardLocation,
  resolved: LiveCardLocation,
): LiveCardForm {
  const active = current.locations.find((location) => location.id === before.id);
  if (!active || locationLookupKey(active) !== locationLookupKey(before)) return current;
  const next = {
    ...active,
    ...resolved,
    id: active.id,
    query: active.query,
    label: active.label,
    time: active.time,
    note: active.note,
  };
  return {
    ...current,
    locations: current.locations.map((location) => (location.id === next.id ? next : location)),
    timezone:
      current.locations[0]?.id === next.id && next.timezone ? next.timezone : current.timezone,
  };
}

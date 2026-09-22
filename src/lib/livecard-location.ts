import type { LiveCardLocation } from "./livecard-builder.ts";

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

/** A unique name AND city match is safe to prefill. Never select the first branch blindly. */
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
    return Boolean(
      venue.trim() &&
        city.trim() &&
        contains(candidate.venue, venue) &&
        contains(`${candidate.city} ${candidate.region || ""} ${candidate.address}`, city),
    );
  });
  return matches.length === 1 ? matches[0] : null;
}

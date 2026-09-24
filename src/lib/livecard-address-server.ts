import { emptyLiveCardLocation } from "./livecard-builder";
import type { BuilderLocationResult, BuilderPlace } from "./livecard-location";
import { locationTimezone } from "./livecard-location-timezone";

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const abbreviations: Record<string, string> = {
  street: "st",
  boulevard: "blvd",
  avenue: "ave",
  road: "rd",
  drive: "dr",
  lane: "ln",
  court: "ct",
  circle: "cir",
  place: "pl",
  parkway: "pkwy",
  highway: "hwy",
  terrace: "ter",
  trail: "trl",
};
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .map((token) => abbreviations[token] || token)
    .join(" ");

export const isStreetAddressQuery = (query: string) =>
  /^\d+[\p{L}]?(?:-\d+)?\s+\S/iu.test(query.trim());

/** At most one character correction in a long street name, supported by the geocoder. */
function sameStreet(input: string, matched: string): boolean {
  if (input === matched) return true;
  if (Math.min(input.length, matched.length) < 8 || Math.abs(input.length - matched.length) > 1)
    return false;
  let a = 0,
    b = 0,
    edits = 0;
  while (a < input.length && b < matched.length) {
    if (input[a] === matched[b]) {
      a++;
      b++;
      continue;
    }
    if (++edits > 1) return false;
    if (input.length >= matched.length) a++;
    if (matched.length >= input.length) b++;
  }
  return edits + (input.length - a) + (matched.length - b) <= 1;
}

type AddressCandidate = { place: BuilderPlace; automatic: boolean };

function addressCandidate(
  value: unknown,
  query: string,
  selectedId: string,
): AddressCandidate | null {
  const properties = record(record(value).properties);
  const coordinates = record(properties.coordinates);
  const context = record(properties.context);
  const match = record(properties.match_code);
  const mapboxId = text(properties.mapbox_id);
  const name = text(properties.name);
  const address =
    text(properties.full_address) ||
    [name, text(properties.place_formatted)].filter(Boolean).join(", ");
  const city = text(record(context.place).name) || text(record(context.locality).name);
  const latitude = coordinates.latitude;
  const longitude = coordinates.longitude;
  if (
    properties.feature_type !== "address" ||
    !mapboxId ||
    !name ||
    !city ||
    !address ||
    typeof latitude !== "number" ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(latitude) ||
    typeof longitude !== "number" ||
    Math.abs(longitude) > 180 ||
    !Number.isFinite(longitude)
  )
    return null;
  if (selectedId && mapboxId !== selectedId) return null;
  const place: BuilderPlace = {
    placeId: `mapbox:${mapboxId}`,
    venue: name,
    address,
    city,
    region: text(record(context.region).name),
    latitude,
    longitude,
  };
  if (selectedId) return { place, automatic: true };

  const number = query.match(/^\s*(\d+[\p{L}]?(?:-\d+)?)\s+/iu)?.[1];
  const returnedNumber =
    text(record(context.address).address_number) || name.match(/^(\d+[\p{L}]?(?:-\d+)?)\s+/iu)?.[1];
  // Never substitute a nearby property, or accept an interpolated street-number guess.
  if (
    !number ||
    normalize(number) !== normalize(returnedNumber || "") ||
    match.address_number !== "matched" ||
    !["rooftop", "parcel", "point"].includes(text(coordinates.accuracy))
  )
    return null;
  const queryWords = normalize(query).split(" ");
  const streetLength = normalize(name).split(" ").length;
  const streetQuery = queryWords.slice(0, streetLength).join(" ");
  const geographicWords = queryWords.slice(streetLength);
  const returnedWords = normalize(
    `${address} ${text(record(context.region).region_code)} ${text(record(context.country).country_code)}`,
  ).split(" ");
  if (!geographicWords.every((word) => returnedWords.includes(word))) return null;
  const exactStreet = normalize(streetQuery) === normalize(name);
  const correctedStreet = sameStreet(normalize(streetQuery), normalize(name));
  if (!correctedStreet) return null;
  return {
    place,
    automatic: exactStreet || ["exact", "high", "medium"].includes(text(match.confidence)),
  };
}

/** Residential addresses go directly to the configured geocoder, without venue web research. */
export async function searchBuilderAddress(input: {
  query: string;
  city?: string;
  placeId?: string;
  id?: string;
}): Promise<BuilderLocationResult | null> {
  const token = (process.env.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_API_KEY || "").trim();
  if (!token) return null;
  const selectedId = input.placeId?.startsWith("mapbox:") ? input.placeId.slice(7) : "";
  const query = [
    input.query,
    input.city && !normalize(input.query).includes(normalize(input.city)) ? input.city : "",
  ]
    .filter(Boolean)
    .join(", ")
    .trim();
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", selectedId || query.slice(0, 256));
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "false");
  url.searchParams.set("permanent", "true");
  url.searchParams.set("types", "address");
  url.searchParams.set("limit", "5");
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok)
    throw new Error("The address lookup is temporarily unavailable. Please try again.");
  const raw = record(await response.json());
  const matches = (Array.isArray(raw.features) ? raw.features : [])
    .map((feature) => addressCandidate(feature, query, selectedId))
    .filter((candidate): candidate is AddressCandidate => Boolean(candidate));
  const unique = [
    ...new Map(matches.map((candidate) => [candidate.place.placeId, candidate])).values(),
  ];
  const candidates = unique.map((candidate) => candidate.place);
  if (unique.length !== 1 || !unique[0].automatic)
    return {
      location: null,
      candidates,
      message: candidates.length
        ? "Choose the matching address below."
        : "We couldn’t match this street address. Add the city or ZIP code to narrow the search.",
    };
  const place = unique[0].place;
  const timezone = locationTimezone(place.latitude, place.longitude);
  return {
    candidates,
    location: timezone
      ? {
          ...emptyLiveCardLocation(input.id),
          ...place,
          timezone,
          timezoneSourceUrl: "https://github.com/evansiroky/timezone-boundary-builder",
          resolution: "verified",
        }
      : null,
    message: timezone
      ? ""
      : "The address was found, but its local time zone couldn’t be confirmed. Please try again.",
  };
}

import { emptyLiveCardLocation, type LiveCardLocation } from "./livecard-builder";
import {
  type BuilderLocationResult,
  type BuilderPlace,
  chooseBuilderPlace,
  isOnlineEventLocation,
} from "./livecard-location";
import { researchBuilderVenue } from "./livecard-venue-research";
import { isStreetAddressQuery, searchBuilderAddress } from "./livecard-address-server";
import { locationTimezone } from "./livecard-location-timezone";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function key() {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ""
  ).trim();
}

async function googleJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Venue preparation unavailable");
  return record(await response.json());
}

export async function resolveBuilderPlace(
  placeId: string,
  date: string,
  id = "primary",
): Promise<LiveCardLocation> {
  if (!key()) throw new Error("Venue preparation unavailable");
  const raw = await googleJson(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": key(),
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
      },
    },
  );
  const place = parsePlace(raw);
  if (!place)
    throw new Error(
      "This venue could not be verified. Try its city or enter the address manually.",
    );
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T12:00:00Z`) : NaN;
  const timestamp = Number.isFinite(parsedDate) ? parsedDate : Date.now();
  const url = new URL("https://maps.googleapis.com/maps/api/timezone/json");
  url.searchParams.set("location", `${place.latitude},${place.longitude}`);
  url.searchParams.set("timestamp", String(Math.floor(timestamp / 1000)));
  url.searchParams.set("key", key());
  const zone = await googleJson(url.href).catch(() => ({}) as Record<string, unknown>);
  const timezone =
    (zone.status === "OK" ? text(zone.timeZoneId) : "") ||
    locationTimezone(place.latitude, place.longitude);
  if (timezone) new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
  return { ...emptyLiveCardLocation(id), ...place, resolution: "verified", timezone };
}

function parsePlace(raw: Record<string, unknown>): BuilderPlace | null {
  const coordinates = record(raw.location);
  if (
    !text(raw.id) ||
    !text(raw.formattedAddress) ||
    typeof coordinates.latitude !== "number" ||
    typeof coordinates.longitude !== "number"
  )
    return null;
  const components = Array.isArray(raw.addressComponents) ? raw.addressComponents.map(record) : [];
  const city =
    components.find(
      (part) =>
        Array.isArray(part.types) &&
        part.types.some((type) => type === "locality" || type === "postal_town"),
    ) ||
    components.find(
      (part) => Array.isArray(part.types) && part.types.includes("administrative_area_level_2"),
    );
  const region = components.find(
    (part) => Array.isArray(part.types) && part.types.includes("administrative_area_level_1"),
  );
  return {
    placeId: text(raw.id),
    venue: text(record(raw.displayName).text),
    address: text(raw.formattedAddress),
    city: text(city?.longText),
    region: text(region?.longText),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

type LocationInput = {
  query: string;
  venue?: string;
  city?: string;
  address?: string;
  date: string;
  id?: string;
  timezone: string;
  placeId?: string;
};

export async function searchBuilderLocation(input: LocationInput): Promise<BuilderLocationResult> {
  if (isOnlineEventLocation(input.query))
    return {
      candidates: [],
      message: "",
      location: {
        ...emptyLiveCardLocation(input.id),
        address: input.query,
        venue: input.venue || "Online event",
        timezone: input.timezone,
        resolution: "online",
      },
    };
  const selectedAddress = Boolean(input.placeId?.startsWith("mapbox:"));
  const streetAddress = selectedAddress || (!input.placeId && isStreetAddressQuery(input.query));
  let addressResult: BuilderLocationResult | null = null;
  let addressUnavailable = false;
  if (streetAddress) {
    try {
      addressResult = await searchBuilderAddress(input);
      if (addressResult?.location || addressResult?.candidates.length) return addressResult;
    } catch {
      addressUnavailable = true;
    }
    // A selected Mapbox identity must never be sent to Google as a Google place ID.
    if (selectedAddress) {
      if (addressResult) return addressResult;
      throw new Error("The address lookup is temporarily unavailable. Please try again.");
    }
  }
  let googleResult: BuilderLocationResult | null = null;
  if (key()) {
    try {
      googleResult = input.placeId
        ? {
            location: await resolveBuilderPlace(input.placeId, input.date, input.id),
            candidates: [],
            message: "",
          }
        : await searchGoogleLocation(input);
      if (
        googleResult.location?.timezone ||
        (!googleResult.location && googleResult.candidates.length)
      )
        return googleResult;
    } catch {
      /* Try source-backed venue research below. */
    }
  }
  if (streetAddress) {
    if (addressResult) return addressResult;
    if (addressUnavailable || !key())
      throw new Error("The address lookup is temporarily unavailable. Please try again.");
    return (
      googleResult || {
        location: null,
        candidates: [],
        message:
          "We couldn’t match this street address. Add the city or ZIP code to narrow the search.",
      }
    );
  }
  // Use the verified/selected branch's full address if only its timezone is missing.
  const context = googleResult?.location || input;
  const query = [context.venue, context.address, context.city, input.query]
    .filter(Boolean)
    .join(", ");
  const location = await researchBuilderVenue(query, input.id);
  return {
    location,
    candidates: googleResult?.candidates || [],
    message: location ? "" : "We couldn’t identify this venue. Add its city or full address.",
  };
}

async function searchGoogleLocation(input: LocationInput): Promise<BuilderLocationResult> {
  const raw = await googleJson("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key(),
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents",
    },
    body: JSON.stringify({ textQuery: input.query.slice(0, 500), pageSize: 5 }),
  });
  const candidates = Array.isArray(raw.places)
    ? raw.places
        .map((place) => parsePlace(record(place)))
        .filter((place): place is BuilderPlace => Boolean(place))
    : [];
  const match = chooseBuilderPlace(
    candidates,
    input.venue || (!input.city && !input.address ? input.query : ""),
    input.city || "",
    input.address || "",
  );
  // Keep candidates available if the details/timezone request fails after a successful search.
  const location = match
    ? await resolveBuilderPlace(match.placeId, input.date, input.id).catch(() => ({
        ...emptyLiveCardLocation(input.id),
        ...match,
        resolution: "verified" as const,
        timezone: "",
      }))
    : null;
  return {
    candidates,
    location,
    message: location
      ? location.timezone
        ? ""
        : "The address is ready. Please confirm its local time zone."
      : candidates.length
        ? "Which venue is yours? Choose below, or add a city to narrow the search."
        : "We couldn’t find that venue. Add its city or address, or enter the address manually.",
  };
}

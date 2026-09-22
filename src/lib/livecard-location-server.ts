import { emptyLiveCardLocation, type LiveCardLocation } from "./livecard-builder";
import {
  chooseBuilderPlace,
  isOnlineEventLocation,
  type BuilderPlace,
  type BuilderLocationResult,
} from "./livecard-location";

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
  if (!response.ok)
    throw new Error("Location lookup is unavailable. You can enter the address manually.");
  return record(await response.json());
}

export async function resolveBuilderPlace(
  placeId: string,
  date: string,
  id = "primary",
): Promise<LiveCardLocation> {
  if (!key())
    throw new Error("Location lookup is unavailable. You can enter the address manually.");
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
  const timezone = zone.status === "OK" ? text(zone.timeZoneId) : "";
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

export async function searchBuilderLocation(input: {
  query: string;
  venue?: string;
  city?: string;
  address?: string;
  date: string;
  id?: string;
  timezone: string;
}): Promise<BuilderLocationResult> {
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
  if (!key())
    return {
      candidates: [],
      location: null,
      message:
        "Location lookup is unavailable. Enter your address and confirm the local time zone.",
    };
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
    input.venue || "",
    input.city || "",
    input.address || "",
  );
  const location = match ? await resolveBuilderPlace(match.placeId, input.date, input.id) : null;
  return {
    candidates,
    location,
    message: location
      ? location.timezone
        ? ""
        : "The address is ready. Please confirm its local time zone."
      : candidates.length
        ? "Choose the matching venue below."
        : "No reliable match yet. Add the city to your search or enter the address manually.",
  };
}

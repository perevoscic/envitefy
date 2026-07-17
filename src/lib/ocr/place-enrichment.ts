import { flyerHasPrintedStreetAddress, normalizeOcrLocationFields } from "./field-normalization.ts";

export type PlaceAddressEnrichment = {
  address: string;
  provider: "google_places" | "mapbox" | "nominatim";
  query: string;
  placeName?: string;
  placeId?: string;
};

type GooglePlacesTextSearchResult = {
  formatted_address?: string;
  name?: string;
  place_id?: string;
};

type GooglePlacesTextSearchResponse = {
  status?: string;
  error_message?: string;
  results?: GooglePlacesTextSearchResult[];
};

type GooglePlacesNewSearchResponse = {
  places?: Array<{
    id?: string;
    name?: string;
    formattedAddress?: string;
    displayName?: { text?: string };
  }>;
  error?: { message?: string; status?: string };
};

type MapboxGeocodingFeature = {
  id?: string;
  text?: string;
  place_name?: string;
  properties?: { address?: string };
};

type MapboxGeocodingResponse = {
  features?: MapboxGeocodingFeature[];
};

type NominatimSearchResult = {
  display_name?: string;
  name?: string;
  place_id?: number | string;
  address?: {
    amenity?: string;
    house_number?: string;
    road?: string;
    town?: string;
    city?: string;
    village?: string;
    hamlet?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

type NominatimSearchResponse = NominatimSearchResult[];

const STREET_ADDRESS_PATTERN =
  /\b\d{1,6}\s+[A-Za-z0-9 .'-]+\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|blvd|boulevard|way|place|pl|pkwy|parkway|hwy|highway)\b/i;
const STATE_LINE_PATTERN = /\b[A-Z][A-Za-z .'-]+,\s*[A-Z]{2}\b/i;
const COUNTY_PATTERN = /\b[A-Z][A-Za-z .'-]+ County\b/i;

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function getGoogleMapsApiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ""
  ).trim();
}

function getMapboxAccessToken(): string {
  return (process.env.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_API_KEY || "").trim();
}

function hasStreetAddress(value: unknown): boolean {
  return STREET_ADDRESS_PATTERN.test(clean(value));
}

function extractPlaceContextHints(context: string): string[] {
  const hints = new Set<string>();
  for (const rawLine of context.split(/\r?\n+/)) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (!line) continue;
    const stateMatch = line.match(STATE_LINE_PATTERN)?.[0];
    if (stateMatch) hints.add(stateMatch);
    const countyMatch = line.match(COUNTY_PATTERN)?.[0];
    if (countyMatch) hints.add(countyMatch);
  }
  return Array.from(hints).slice(0, 2);
}

function venueTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(
      (token) =>
        token.length >= 3 &&
        !["the", "and", "school", "beach", "access", "public", "park"].includes(token),
    );
}

function haystackMatchesVenue(venue: string, haystackRaw: string): boolean {
  const haystack = clean(haystackRaw).toLowerCase();
  const tokens = venueTokens(venue);
  if (!tokens.length || !haystack) return false;
  const matched = tokens.filter((token) => haystack.includes(token));
  if (matched.length === tokens.length) return true;
  if (tokens.length >= 2 && matched.length >= Math.ceil(tokens.length * 0.6)) return true;
  return matched.length >= 2 && tokens.slice(0, 2).every((token) => haystack.includes(token));
}

function resultLooksLikeVenue(venue: string, result: GooglePlacesTextSearchResult): boolean {
  const resultName = clean(result.name);
  if (!resultName) return false;
  return haystackMatchesVenue(venue, `${resultName} ${clean(result.formatted_address)}`);
}

function buildPlaceLookupQueries(params: { venue: string; context: string }): string[] {
  const hints = extractPlaceContextHints(params.context);
  const queries = new Set<string>();
  const venue = clean(params.venue);
  if (!venue) return [];

  if (hints.length) {
    queries.add(`${venue} ${hints.join(" ")}`);
  }
  queries.add(venue);

  // Shorter business-name variants help beach-access / "at Place" flyers match Places.
  const withoutAccessSuffix = venue
    .replace(/\b(?:public\s+)?beach\s+access\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (withoutAccessSuffix && withoutAccessSuffix.toLowerCase() !== venue.toLowerCase()) {
    if (hints.length) queries.add(`${withoutAccessSuffix} ${hints.join(" ")}`);
    queries.add(withoutAccessSuffix);
    queries.add(`${withoutAccessSuffix} beach access`);
  }

  return Array.from(queries);
}

function cleanDisplayAddress(value: string): string {
  return clean(value)
    .replace(/,\s*United States$/i, "")
    .replace(/,\s*USA$/i, "")
    .replace(/\bFlorida\b/gi, "FL")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function preferStreetAddressFromPlaceName(placeName: string, placeLabel: string): string {
  const cleanedPlace = cleanDisplayAddress(placeName);
  const cleanedLabel = clean(placeLabel);
  if (!cleanedPlace) return "";
  if (hasStreetAddress(cleanedPlace)) {
    // "Pompano Joe's, 2375 Highway 98, Miramar Beach, FL 32550" → keep from street number onward when possible
    const streetStart = cleanedPlace.search(/\b\d{1,6}\s+[A-Za-z]/);
    if (streetStart > 0) return cleanedPlace.slice(streetStart).trim();
    return cleanedPlace;
  }
  if (cleanedLabel && cleanedPlace.toLowerCase() !== cleanedLabel.toLowerCase()) {
    return cleanedPlace;
  }
  return cleanedPlace;
}

async function lookupGooglePlaceAddress(
  query: string,
  venue: string,
): Promise<PlaceAddressEnrichment | null> {
  const key = getGoogleMapsApiKey();
  if (!key) return null;

  // Prefer Places API (New); fall back to legacy Text Search if still enabled.
  const modern = await lookupGooglePlaceAddressNew(query, venue, key);
  if (modern) return modern;
  return lookupGooglePlaceAddressLegacy(query, venue, key);
}

async function lookupGooglePlaceAddressNew(
  query: string,
  venue: string,
  key: string,
): Promise<PlaceAddressEnrichment | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 5,
        regionCode: "US",
      }),
    });
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as GooglePlacesNewSearchResponse | null;
    if (!payload || payload.error || !Array.isArray(payload.places) || !payload.places.length) {
      return null;
    }

    const candidates: GooglePlacesTextSearchResult[] = payload.places.map((place) => ({
      name: clean(place.displayName?.text),
      formatted_address: clean(place.formattedAddress),
      place_id: clean(place.id) || clean(place.name),
    }));
    const match = candidates.find(
      (candidate) => clean(candidate.formatted_address) && resultLooksLikeVenue(venue, candidate),
    );
    const address = clean(match?.formatted_address);
    if (!match || !address) return null;
    return {
      address: cleanDisplayAddress(address),
      provider: "google_places",
      query,
      placeName: clean(match.name) || undefined,
      placeId: clean(match.place_id) || undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupGooglePlaceAddressLegacy(
  query: string,
  venue: string,
  key: string,
): Promise<PlaceAddressEnrichment | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", key);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const payload = (await response
      .json()
      .catch(() => null)) as GooglePlacesTextSearchResponse | null;
    if (payload?.status !== "OK" || !Array.isArray(payload.results)) return null;

    const match = payload.results.find(
      (candidate) => clean(candidate.formatted_address) && resultLooksLikeVenue(venue, candidate),
    );
    const address = clean(match?.formatted_address);
    if (!match || !address) return null;
    return {
      address: cleanDisplayAddress(address),
      provider: "google_places",
      query,
      placeName: clean(match.name) || undefined,
      placeId: clean(match.place_id) || undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupMapboxPlaceAddress(
  query: string,
  venue: string,
): Promise<PlaceAddressEnrichment | null> {
  const token = getMapboxAccessToken();
  if (!token) return null;

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "5");
  url.searchParams.set("types", "poi,address,place,locality,neighborhood");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as MapboxGeocodingResponse | null;
    if (!Array.isArray(payload?.features) || !payload.features.length) return null;

    const match = payload.features.find((feature) => {
      const label = clean(feature.text || feature.place_name);
      const placeName = clean(feature.place_name);
      return label && haystackMatchesVenue(venue, `${label} ${placeName}`);
    });
    if (!match) return null;

    const placeLabel = clean(match.text) || clean(match.place_name);
    const placeName = clean(match.place_name);
    const address = preferStreetAddressFromPlaceName(placeName, placeLabel);
    if (!address) return null;

    return {
      address,
      provider: "mapbox",
      query,
      placeName: placeLabel || undefined,
      placeId: clean(match.id) || undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function formatNominatimAddress(result: NominatimSearchResult): string {
  const parts = result.address || {};
  const locality = clean(parts.town || parts.city || parts.village || parts.hamlet);
  const state = clean(parts.state)
    .replace(/^Florida$/i, "FL")
    .replace(/^California$/i, "CA")
    .replace(/^Texas$/i, "TX")
    .replace(/^New York$/i, "NY");
  const street = [clean(parts.house_number), clean(parts.road)].filter(Boolean).join(" ");
  const composed = [street, locality, [state, clean(parts.postcode)].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  if (composed && hasStreetAddress(composed)) return cleanDisplayAddress(composed);
  return cleanDisplayAddress(result.display_name || "");
}

async function lookupNominatimPlaceAddress(
  query: string,
  venue: string,
): Promise<PlaceAddressEnrichment | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("limit", "5");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "EnvitefyVenueEnrichment/1.0 (event location lookup)",
      },
    });
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as NominatimSearchResponse | null;
    if (!Array.isArray(payload) || !payload.length) return null;

    const match = payload.find((candidate) => {
      const label = clean(candidate.address?.amenity || candidate.name || candidate.display_name);
      return label && haystackMatchesVenue(venue, `${label} ${clean(candidate.display_name)}`);
    });
    if (!match) return null;

    const address = formatNominatimAddress(match);
    if (!address) return null;
    return {
      address,
      provider: "nominatim",
      query,
      placeName: clean(match.address?.amenity || match.name) || undefined,
      placeId: match.place_id != null ? String(match.place_id) : undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupPlaceAddress(
  query: string,
  venue: string,
): Promise<PlaceAddressEnrichment | null> {
  return (
    (await lookupGooglePlaceAddress(query, venue)) || (await lookupMapboxPlaceAddress(query, venue))
  );
}

export async function enrichOcrVenueAddress(params: {
  venue?: unknown;
  venueName?: unknown;
  location?: unknown;
  address?: unknown;
  fallbackLocation?: unknown;
  hostName?: unknown;
  context?: unknown;
  lookupPlaceAddress?: (query: string) => Promise<PlaceAddressEnrichment | null>;
}): Promise<PlaceAddressEnrichment | null> {
  const context = String(params.context || "");
  const normalized = normalizeOcrLocationFields({
    venue: params.venue,
    venueName: params.venueName,
    location: params.location,
    address: params.address,
    fallbackLocation: params.fallbackLocation,
    hostName: params.hostName,
    context,
  });
  const venue = clean(normalized.venue);
  if (!venue || hasStreetAddress(normalized.location)) return null;
  // Never invent/replace a street address that is already printed on the flyer.
  if (
    flyerHasPrintedStreetAddress({
      location: params.location,
      address: params.address,
      ocrText: params.context,
    })
  ) {
    return null;
  }

  const queries = buildPlaceLookupQueries({ venue, context });
  if (params.lookupPlaceAddress) {
    for (const query of queries) {
      const enrichment = await params.lookupPlaceAddress(query);
      if (
        enrichment &&
        haystackMatchesVenue(venue, `${clean(enrichment.placeName)} ${clean(enrichment.address)}`)
      ) {
        return enrichment;
      }
    }
    return null;
  }

  for (const query of queries) {
    const enrichment = await lookupPlaceAddress(query, venue);
    if (enrichment) return enrichment;
  }

  // Nominatim is rate-limited; try one short place-name query after Google/Mapbox miss.
  const shortVenue = venue
    .replace(/\b(?:public\s+)?beach\s+access\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const nominatimQueries = Array.from(new Set([shortVenue, venue].map(clean).filter(Boolean)));
  for (const query of nominatimQueries) {
    const enrichment = await lookupNominatimPlaceAddress(query, venue);
    if (enrichment) return enrichment;
  }
  return null;
}

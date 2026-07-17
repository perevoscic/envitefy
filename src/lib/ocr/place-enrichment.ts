import { normalizeOcrLocationFields } from "./field-normalization.ts";

export type PlaceAddressEnrichment = {
  address: string;
  provider: "google_places";
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
  results?: GooglePlacesTextSearchResult[];
};

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
    .filter((token) => token.length >= 3 && !["the", "and", "school"].includes(token));
}

function resultLooksLikeVenue(venue: string, result: GooglePlacesTextSearchResult): boolean {
  const resultName = clean(result.name).toLowerCase();
  const tokens = venueTokens(venue);
  if (!tokens.length || !resultName) return false;
  return tokens.every((token) => resultName.includes(token));
}

function buildPlaceLookupQueries(params: { venue: string; context: string }): string[] {
  const hints = extractPlaceContextHints(params.context);
  const queries = new Set<string>();
  if (hints.length) {
    queries.add(`${params.venue} ${hints.join(" ")}`);
  }
  queries.add(params.venue);
  return Array.from(queries);
}

async function lookupGooglePlaceAddress(query: string): Promise<PlaceAddressEnrichment | null> {
  const key = getGoogleMapsApiKey();
  if (!key) return null;

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

    const result = payload.results.find((candidate) => clean(candidate.formatted_address));
    const address = clean(result?.formatted_address);
    if (!result || !address) return null;
    return {
      address,
      provider: "google_places",
      query,
      placeName: clean(result.name) || undefined,
      placeId: clean(result.place_id) || undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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

  const lookup = params.lookupPlaceAddress || lookupGooglePlaceAddress;
  for (const query of buildPlaceLookupQueries({ venue, context })) {
    const enrichment = await lookup(query);
    if (
      enrichment &&
      resultLooksLikeVenue(venue, { name: enrichment.placeName, place_id: enrichment.placeId })
    ) {
      return enrichment;
    }
  }
  return null;
}

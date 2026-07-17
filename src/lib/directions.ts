export function isApplePlatformUserAgent(userAgent: string): boolean {
  return /iP(hone|ad|od)|Macintosh/i.test(userAgent) && !/Android/i.test(userAgent);
}

export function buildGoogleMapsSearchHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildAppleMapsHref(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

export function buildPreferredDirectionsHref(query: string, userAgent?: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "";
  if (userAgent && isApplePlatformUserAgent(userAgent)) {
    return buildAppleMapsHref(trimmed);
  }
  return buildGoogleMapsSearchHref(trimmed);
}

export function buildGoogleMapsDirectionsHref(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

const STREET_ADDRESS_PATTERN =
  /\b\d{1,6}\s+[A-Za-z0-9 .'-]+\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|blvd|boulevard|way|place|pl|pkwy|parkway|hwy|highway)\b/i;
/** e.g. "2375 Hwy 2378" — road number after the highway label */
const HIGHWAY_ADDRESS_PATTERN = /\b\d{1,6}\s+(?:hwy|highway|us|route|rt|sr)\s*\.?\s*\d{1,5}\b/i;

function cleanDirectionsText(value: string | null | undefined): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasStreetAddress(value: string): boolean {
  return STREET_ADDRESS_PATTERN.test(value) || HIGHWAY_ADDRESS_PATTERN.test(value);
}

/** Phrase that describes where parking sits relative to the venue. */
function parkingRelativePhrase(parking: string, road: string): string {
  if (/\bacross(?:\s+the\s+street)?\b/i.test(parking) || /\bopposite\b/i.test(parking)) {
    return `parking across the street on ${road}`;
  }
  if (/\bbehind\b/i.test(parking)) {
    return `parking behind venue on ${road}`;
  }
  if (/\bnext\s+to\b|\badjacent\b/i.test(parking)) {
    return `parking next to venue on ${road}`;
  }
  if (/\baround\s+the\s+corner\b/i.test(parking)) {
    return `parking around the corner on ${road}`;
  }
  return `parking on ${road}`;
}

function venueAnchor(params: { location: string; venue: string }): string {
  const { location, venue } = params;
  if (location && hasStreetAddress(location)) return location;

  const cityHint =
    location.match(/\b([^,]+,\s*[A-Z]{2}(?:\s+\d{5}(?:-\d{4})?)?)\s*$/i)?.[1]?.trim() ||
    location.match(/\b([A-Z][A-Za-z .'-]+,\s*[A-Z]{2})\b/)?.[1]?.trim() ||
    "";

  if (venue && cityHint) return `${venue}, ${cityHint}`;
  if (venue) return venue;
  if (cityHint) return cityHint;
  return "";
}

/**
 * Build a maps query for overflow/parking notes when a road/place is mentioned.
 * Relative notes ("across the street on Driftwood Road") become a search like
 * "parking across the street on Driftwood Road near {venue address}".
 */
export function buildParkingDirectionsQuery(params: {
  parkingText?: string | null;
  venueName?: string | null;
  location?: string | null;
}): string {
  const parking = cleanDirectionsText(params.parkingText);
  if (!parking) return "";

  const roadMatch = parking.match(
    /\b(?:on|at|near|behind|across(?:\s+the\s+street\s+on)?)\s+([A-Z0-9][A-Za-z0-9 .'/-]{2,60}?\b(?:Road|Rd|Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Highway|Hwy|Parkway|Pkwy)\b)/i,
  );
  const road = cleanDirectionsText(roadMatch?.[1] || "");
  if (!road) return "";

  const location = cleanDirectionsText(params.location);
  const venue = cleanDirectionsText(params.venueName);
  const relative = parkingRelativePhrase(parking, road);
  const anchor = venueAnchor({ location, venue });

  if (anchor) {
    return `${relative} near ${anchor}`;
  }
  return relative;
}

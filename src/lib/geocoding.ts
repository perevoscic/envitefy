/**
 * Google Maps URL helpers (embed and search)
 */

export type GeocodeResult = never; // Geocoding via third parties removed

/**
 * Build a Google Maps embed URL for a location using an address string
 * Google Maps will automatically geocode the address
 * @param query - Address or location query string
 * @param apiKey - Google Maps API key (optional, falls back to environment variable)
 * @returns Google Maps embed URL
 */
export function buildGoogleMapsEmbedUrlFromAddress(
  query: string,
  apiKey?: string
): string {
  const key = apiKey || (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) || "";
  const q = encodeURIComponent(query.trim());
  if (!key) {
    // Return search URL format if no API key available
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&zoom=15`;
}

/**
 * Build a Google Maps embed URL for a location
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param query - Optional address/query string for display
 * @param apiKey - Google Maps API key (optional, falls back to environment variable)
 * @returns Google Maps embed URL
 */
export function buildGoogleMapsEmbedUrl(
  latitude: number,
  longitude: number,
  query?: string,
  apiKey?: string
): string {
  const key = apiKey || (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) || "";
  const q = query ? encodeURIComponent(query) : `${latitude},${longitude}`;
  if (!key) {
    // Return search URL format if no API key available
    return buildGoogleMapsSearchUrl(latitude, longitude, query);
  }
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&center=${latitude},${longitude}&zoom=15`;
}

/**
 * Build a Google Maps search URL for a location (fallback when embed key not available)
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param query - Optional address/query string
 * @returns Google Maps search URL
 */
export function buildGoogleMapsSearchUrl(
  latitude: number,
  longitude: number,
  query?: string
): string {
  const q = query ? encodeURIComponent(query) : `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/**
 * Build a Google Maps search URL from an address string
 * @param query - Address or location query string
 * @returns Google Maps search URL
 */
export function buildGoogleMapsSearchUrlFromAddress(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}


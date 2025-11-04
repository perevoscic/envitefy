/**
 * Geocoding utilities using OpenStreetMap Nominatim API
 */

export type GeocodeResult = {
  displayName: string;
  latitude: number;
  longitude: number;
  confidence?: number;
};

/**
 * Geocode an address or location query using OpenStreetMap Nominatim
 * @param query - Address or location name to geocode
 * @param timeoutMs - Request timeout in milliseconds (default: 2500)
 * @returns GeocodeResult with coordinates, or null if not found
 */
export async function geocodeAddress(
  query: string,
  timeoutMs: number = 2500
): Promise<GeocodeResult | null> {
  if (!query || !query.trim()) {
    return null;
  }

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query.trim())}`;
    
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "snapmydate/1.0 (+https://snapmydate.app)",
      },
      signal: ac.signal,
    });
    
    clearTimeout(timer);
    
    if (!response.ok) {
      return null;
    }
    
    const results: any[] = await response.json().catch(() => []);
    const top = Array.isArray(results) && results.length > 0 ? results[0] : null;
    
    if (!top || typeof top.lat !== "string" || typeof top.lon !== "string") {
      return null;
    }
    
    const latitude = parseFloat(top.lat);
    const longitude = parseFloat(top.lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return null;
    }
    
    return {
      displayName: (top.display_name as string) || query.trim(),
      latitude,
      longitude,
      confidence: typeof top.importance === "number" ? top.importance : undefined,
    };
  } catch (error) {
    // Silently fail on timeout or network errors
    return null;
  }
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


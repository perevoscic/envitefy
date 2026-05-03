export function isApplePlatformUserAgent(userAgent: string): boolean {
  return /iP(hone|ad|od)|Macintosh/i.test(userAgent) && !/Android/i.test(userAgent);
}

export function buildGoogleMapsSearchHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildAppleMapsHref(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

export function buildPreferredDirectionsHref(
  query: string,
  userAgent?: string,
): string {
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

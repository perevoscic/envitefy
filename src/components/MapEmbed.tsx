"use client";

import {
  buildGoogleMapsSearchUrl,
  buildGoogleMapsEmbedUrl,
} from "@/lib/geocoding";

type MapEmbedProps = {
  latitude: number;
  longitude: number;
  query?: string | null;
  className?: string;
};

/**
 * MapEmbed component that displays an embedded Google Maps view
 * Falls back to a link if embed fails or API key is not available
 */
export default function MapEmbed({
  latitude,
  longitude,
  query,
  className = "",
}: MapEmbedProps) {
  // Access NEXT_PUBLIC env var directly (available at build time in client components)
  // In Next.js, NEXT_PUBLIC_* vars are embedded at build time
  const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;

  const searchUrl = buildGoogleMapsSearchUrl(
    latitude,
    longitude,
    query || undefined
  );
  const embedUrl = mapKey
    ? buildGoogleMapsEmbedUrl(latitude, longitude, query || undefined, mapKey)
    : null;

  if (!embedUrl || embedUrl.startsWith("https://www.google.com/maps/search")) {
    // Fallback: show a clickable preview that opens Google Maps
    return (
      <div
        className={`rounded-lg overflow-hidden border border-border ${className}`}
      >
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full h-64 bg-muted hover:bg-muted/80 transition-colors"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-sm text-muted-foreground">
                Click to view on Google Maps
              </p>
            </div>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg overflow-hidden border border-border ${className}`}
    >
      <iframe
        src={embedUrl}
        width="100%"
        height="400"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-64"
      />
      <div className="p-2 bg-muted/50 text-xs text-center">
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground underline"
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}

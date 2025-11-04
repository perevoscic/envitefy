"use client";

import { useEffect, useState } from "react";
import MapEmbed from "@/components/MapEmbed";

type EventMapProps = {
  coordinates?: { latitude: number; longitude: number } | null;
  venue?: string | null;
  location?: string | null;
  className?: string;
};

/**
 * EventMap component that automatically geocodes addresses if coordinates aren't available
 */
export default function EventMap({
  coordinates,
  venue,
  location,
  className = "",
}: EventMapProps) {
  const [geocodedCoords, setGeocodedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Build location query string
  const locationQuery = (() => {
    const parts: string[] = [];
    if (venue) parts.push(venue);
    if (location) parts.push(location);
    return parts.join(", ").trim() || null;
  })();

  // Check if we have existing coordinates
  const hasExistingCoords =
    coordinates &&
    typeof coordinates === "object" &&
    typeof coordinates.latitude === "number" &&
    typeof coordinates.longitude === "number" &&
    !isNaN(coordinates.latitude) &&
    !isNaN(coordinates.longitude);

  // Geocode address if no coordinates but address exists
  useEffect(() => {
    if (hasExistingCoords || !locationQuery || isGeocoding) return;

    setIsGeocoding(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    fetch(`/api/geocode?q=${encodeURIComponent(locationQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          console.warn(
            "[EventMap] Geocoding failed:",
            res.status,
            res.statusText
          );
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (
          data?.ok &&
          typeof data.latitude === "number" &&
          typeof data.longitude === "number"
        ) {
          setGeocodedCoords({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        } else {
          console.warn("[EventMap] Invalid geocoding response:", data);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err.name !== "AbortError") {
          console.warn("[EventMap] Geocoding error:", err);
        }
        // Silently fail - map just won't show
      })
      .finally(() => {
        setIsGeocoding(false);
      });

    // Cleanup function to cancel request if component unmounts or dependencies change
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [hasExistingCoords, locationQuery]);

  // Use existing coordinates or geocoded coordinates
  const finalCoords = hasExistingCoords ? coordinates : geocodedCoords;

  // Show loading state or map if we have coordinates or location to geocode
  if (!finalCoords && !locationQuery) {
    return null;
  }

  // Show loading placeholder while geocoding
  if (!finalCoords && locationQuery && isGeocoding) {
    return (
      <div className={className}>
        <div className="rounded-lg overflow-hidden border border-border bg-muted/50 h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!finalCoords) {
    return null;
  }

  return (
    <div className={className}>
      <MapEmbed
        latitude={finalCoords.latitude}
        longitude={finalCoords.longitude}
        query={locationQuery || undefined}
        className="w-full"
      />
    </div>
  );
}

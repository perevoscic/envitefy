import StaticMap from "@/components/StaticMap";

type EventMapProps = {
  coordinates?: { latitude: number; longitude: number } | null;
  venue?: string | null;
  location?: string | null;
  className?: string;
  mapWidth?: number;
  mapHeight?: number;
  zoom?: number;
};

/**
 * EventMap component that displays a Google Maps view using the address
 * Google Maps handles geocoding automatically - no need for server-side geocoding!
 */
export default function EventMap({
  coordinates,
  venue,
  location,
  className = "",
  mapWidth = 640,
  mapHeight = 420,
  zoom = 17,
}: EventMapProps) {
  // Build location query string
  const locationQuery = (() => {
    const parts: string[] = [];
    if (venue) parts.push(venue);
    if (location) parts.push(location);
    return parts.join(", ").trim() || null;
  })();

  // If we have coordinates, we could use them, but Google Maps works great with just addresses
  // So we'll always use the address string and let Google handle it
  if (!locationQuery) {
    return null;
  }

  return (
    <div className={className}>
      <StaticMap
        address={locationQuery}
        zoom={zoom}
        width={mapWidth}
        height={mapHeight}
      />
    </div>
  );
}

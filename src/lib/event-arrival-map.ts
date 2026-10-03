export type ArrivalMapView = {
  longitude: number;
  latitude: number;
  zoom: number;
  width: number;
  height: number;
};
export type ArrivalMapMarker = {
  label: string;
  kind: "parking" | "dropoff" | "entrance" | "other";
  note: string;
  point: { x: number; y: number } | null;
  confirmed: boolean;
};
export type EventArrivalMap = {
  version: 1;
  sourceImage: string;
  mapImage?: string;
  view?: ArrivalMapView;
  status: "ready" | "location_unavailable" | "provider_unavailable" | "unconfigured";
  markers: ArrivalMapMarker[];
};
const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const finite = (n: unknown, min: number, max: number): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
function image(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_800_000) return false;
  if (/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true;
  // Arrival maps are source evidence: accept only app-managed media, never remote fetch URLs.
  return /^\/api\/blob\/[A-Za-z0-9%_./?=&-]+$/.test(value) && !value.includes("..");
}
export function normalizeArrivalMap(value: unknown): EventArrivalMap | null {
  const raw = record(value);
  if (
    raw?.version !== 1 ||
    !image(raw.sourceImage) ||
    !["ready", "location_unavailable", "provider_unavailable", "unconfigured"].includes(
      String(raw.status),
    ) ||
    !Array.isArray(raw.markers) ||
    raw.markers.length > 6
  )
    return null;
  const markers: ArrivalMapMarker[] = [];
  for (const item of raw.markers) {
    const marker = record(item),
      point = record(marker?.point);
    if (
      !marker ||
      typeof marker.label !== "string" ||
      !marker.label.trim() ||
      marker.label.length > 180 ||
      typeof marker.note !== "string" ||
      marker.note.length > 1000 ||
      !["parking", "dropoff", "entrance", "other"].includes(String(marker.kind)) ||
      typeof marker.confirmed !== "boolean" ||
      (marker.point != null && (!point || !finite(point.x, 0, 1) || !finite(point.y, 0, 1))) ||
      (marker.confirmed && !point)
    )
      return null;
    markers.push({
      label: marker.label.trim(),
      note: marker.note,
      kind: marker.kind as ArrivalMapMarker["kind"],
      point: point ? { x: point.x as number, y: point.y as number } : null,
      confirmed: marker.confirmed,
    });
  }
  let view: ArrivalMapView | undefined;
  if (raw.view != null) {
    const v = record(raw.view);
    if (
      !v ||
      !finite(v.longitude, -180, 180) ||
      !finite(v.latitude, -85, 85) ||
      !finite(v.zoom, 0, 20) ||
      !finite(v.width, 64, 1280) ||
      !finite(v.height, 64, 1280)
    )
      return null;
    view = v as ArrivalMapView;
  }
  if (raw.mapImage != null && !image(raw.mapImage)) return null;
  if (
    Boolean(raw.mapImage) !== Boolean(view) ||
    (raw.status === "ready" && !view) ||
    (!view && markers.some((m) => m.point))
  )
    return null;
  return {
    version: 1,
    sourceImage: raw.sourceImage,
    status: raw.status as EventArrivalMap["status"],
    markers,
    ...(view ? { view, mapImage: raw.mapImage as string } : {}),
  };
}
// Mapbox's north-up static view uses a 512px world at zoom zero. Points are normalized
// against the *whole* provider image, including the retained attribution area.
export function arrivalMarkerCoordinates(view: ArrivalMapView, point: { x: number; y: number }) {
  const world = 512 * 2 ** view.zoom;
  const centerX = ((view.longitude + 180) / 360) * world;
  const sin = Math.sin((view.latitude * Math.PI) / 180);
  const centerY = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world;
  const x = centerX + (point.x - 0.5) * view.width;
  const y = centerY + (point.y - 0.5) * view.height;
  return {
    longitude: (((((x / world) * 360) % 360) + 360) % 360) - 180,
    latitude: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / world))) * 180) / Math.PI,
  };
}
export function arrivalMarkerDirections(
  map: EventArrivalMap,
  marker: ArrivalMapMarker,
): string | null {
  if (!map.view || !marker.confirmed || !marker.point) return null;
  const p = arrivalMarkerCoordinates(map.view, marker.point);
  return `https://www.google.com/maps/dir/?api=1&destination=${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`;
}

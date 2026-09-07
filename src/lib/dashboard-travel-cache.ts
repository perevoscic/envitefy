import { createHash } from "node:crypto";

export type DashboardDriveEstimate = {
  minutes: number;
  distanceKm: number | null;
  updatedAt: string;
};
const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 500;
const estimates = new Map<string, DashboardDriveEstimate>();

/** Travel varies by viewer and origin. Event-only caches are suitable for weather. */
export function dashboardTravelCacheKey(
  userId: string,
  eventId: string,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        userId,
        eventId,
        origin.lat.toFixed(4),
        origin.lng.toFixed(4),
        destination.lat.toFixed(4),
        destination.lng.toFixed(4),
      ]),
    )
    .digest("hex");
}

export function getDashboardDriveEstimate(
  key: string,
  now = Date.now(),
): DashboardDriveEstimate | null {
  const estimate = estimates.get(key);
  if (!estimate) return null;
  const age = now - Date.parse(estimate.updatedAt);
  if (!Number.isFinite(age) || age < 0 || age >= TTL_MS) {
    estimates.delete(key);
    return null;
  }
  return estimate;
}

export function cacheDashboardDriveEstimate(key: string, estimate: DashboardDriveEstimate): void {
  if (!Number.isFinite(estimate.minutes) || estimate.minutes < 0) return;
  if (estimates.size >= MAX_ENTRIES) {
    const oldest = estimates.keys().next().value;
    if (oldest) estimates.delete(oldest);
  }
  estimates.set(key, estimate);
}

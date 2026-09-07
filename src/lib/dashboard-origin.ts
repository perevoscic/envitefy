export type DashboardBrowserOrigin = { lat: number; lng: number; label: string };
const SAVED_ORIGIN_MAX_AGE_MS = 60 * 60 * 1000;

type OriginBrowser = {
  storage?: Pick<Storage, "getItem" | "setItem">;
  geolocation?: Pick<Geolocation, "getCurrentPosition">;
  permissions?: Pick<Permissions, "query">;
};

function coordinate(value: unknown, limit: number): number | null {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  )
    return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

/** Reuse this account's recent location; automatic loads never open a permission prompt. */
export async function resolveDashboardBrowserOrigin(
  identity: string,
  browser: OriginBrowser,
  requestPermission = false,
): Promise<DashboardBrowserOrigin | null> {
  if (!identity.trim()) return null;
  const key = `envitefy:dashboard:origin:${encodeURIComponent(identity.trim().toLowerCase())}`;
  let saved: DashboardBrowserOrigin | null = null;
  try {
    const raw = browser.storage?.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const value = parsed as Record<string, unknown>;
      const lat = coordinate(value.lat, 90);
      const lng = coordinate(value.lng, 180);
      const age =
        typeof value.savedAt === "string" ? Date.now() - Date.parse(value.savedAt) : Number.NaN;
      if (lat != null && lng != null && age >= 0 && age < SAVED_ORIGIN_MAX_AGE_MS)
        saved = { lat, lng, label: "saved location" };
    }
  } catch {
    /* Restricted storage does not prevent a live location lookup. */
  }

  let allowed = requestPermission;
  if (!allowed) {
    try {
      allowed = (await browser.permissions?.query({ name: "geolocation" }))?.state === "granted";
    } catch {
      /* Some browsers do not support querying geolocation permission. */
    }
  }
  if (!allowed || !browser.geolocation) return saved;

  const current = await new Promise<DashboardBrowserOrigin | null>((resolve) => {
    // Let the user decide in the permission prompt. The browser's acquisition
    // timeout starts after that decision; only automatic lookups need a wall-clock limit.
    const timeout = requestPermission ? undefined : setTimeout(() => resolve(null), 5500);
    try {
      browser.geolocation?.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          const lat = coordinate(position.coords.latitude, 90);
          const lng = coordinate(position.coords.longitude, 180);
          resolve(lat != null && lng != null ? { lat, lng, label: "current location" } : null);
        },
        () => {
          clearTimeout(timeout);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: requestPermission ? 10000 : 5000,
          maximumAge: 5 * 60 * 1000,
        },
      );
    } catch {
      clearTimeout(timeout);
      resolve(null);
    }
  });
  if (current) {
    try {
      browser.storage?.setItem(
        key,
        JSON.stringify({ lat: current.lat, lng: current.lng, savedAt: new Date().toISOString() }),
      );
    } catch {
      /* The estimate can still use this location without persistence. */
    }
  }
  return current || saved;
}

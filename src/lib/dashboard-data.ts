export type DashboardEventOwnership = "owned" | "invited";
export type DashboardEventShareStatus = "accepted" | "pending" | null;

export type DashboardEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  tz: string | null;
  locationText: string | null;
  locationLat: number | null;
  locationLng: number | null;
  coverImageUrl: string | null;
  status: string | null;
  category: string | null;
  updatedAt: string | null;
  numberOfGuests: number;
  reminderCount: number;
  mapsUrl: string | null;
  createdVia: string | null;
  ownership: DashboardEventOwnership;
  shareStatus: DashboardEventShareStatus;
};

type HistoryRow = {
  id: string;
  title: string;
  data: any;
  created_at?: string | null;
};

function parseFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseIso(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function buildMapsUrl(locationText: string | null): string | null {
  if (!locationText) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    locationText
  )}`;
}

function normalizeStatus(statusRaw: unknown): string | null {
  const normalized = String(statusRaw || "")
    .trim()
    .toLowerCase();
  return normalized || null;
}

function normalizeCreatedVia(createdViaRaw: unknown): string | null {
  const normalized = String(createdViaRaw || "")
    .trim()
    .toLowerCase();
  return normalized || null;
}

export function isScannedInviteCreatedVia(createdViaRaw: unknown): boolean {
  const normalized = normalizeCreatedVia(createdViaRaw);
  return normalized === "ocr" || Boolean(normalized?.startsWith("ocr-"));
}

export function normalizeDashboardEventOwnership(
  ownershipRaw: unknown,
  createdViaRaw?: unknown
): DashboardEventOwnership {
  return String(ownershipRaw || "").trim().toLowerCase() === "invited" ||
    isScannedInviteCreatedVia(createdViaRaw)
    ? "invited"
    : "owned";
}

export function normalizeDashboardEventShareStatus(
  shareStatusRaw: unknown
): DashboardEventShareStatus {
  const normalized = String(shareStatusRaw || "").trim().toLowerCase();
  if (normalized === "accepted" || normalized === "pending") {
    return normalized;
  }
  return null;
}

export function isArchivedOrCanceled(statusRaw: unknown): boolean {
  const status = normalizeStatus(statusRaw);
  return status === "archived" || status === "canceled" || status === "cancelled";
}

export function isDraftStatus(statusRaw: unknown): boolean {
  const status = normalizeStatus(statusRaw);
  return status === "draft";
}

export function getEventStartIso(data: any): string | null {
  return parseIso(
    data?.startAt ?? data?.startISO ?? data?.start ?? data?.fieldsGuess?.start ?? data?.event?.start
  );
}

export function getEventEndIso(data: any): string | null {
  return parseIso(
    data?.endAt ?? data?.endISO ?? data?.end ?? data?.fieldsGuess?.end ?? data?.event?.end
  );
}

export function toDashboardEvent(row: HistoryRow): DashboardEvent | null {
  const data = row?.data || {};
  const startAt = getEventStartIso(data);
  if (!startAt) return null;

  const locationText = firstString(
    data?.locationText,
    data?.location,
    data?.fieldsGuess?.location,
    data?.event?.location
  );
  const locationLat = parseFiniteNumber(data?.locationLat ?? data?.lat ?? data?.event?.locationLat);
  const locationLng = parseFiniteNumber(data?.locationLng ?? data?.lng ?? data?.event?.locationLng);
  const reminderCount = Array.isArray(data?.reminders) ? data.reminders.length : 0;
  const numberOfGuests = Math.max(0, Number(data?.numberOfGuests || 0));

  return {
    id: row.id,
    title: firstString(row.title, data?.title, data?.fieldsGuess?.title, data?.event?.title) || "Event",
    startAt,
    endAt: getEventEndIso(data),
    tz: firstString(data?.tz, data?.timezone, data?.fieldsGuess?.timezone, data?.event?.timezone),
    locationText,
    locationLat,
    locationLng,
    coverImageUrl: firstString(
      data?.coverImageUrl,
      data?.thumbnail,
      data?.heroImage,
      data?.attachment?.type?.startsWith?.("image/") ? data?.attachment?.dataUrl : null
    ),
    status: normalizeStatus(data?.status),
    category: firstString(data?.category, row?.data?.category),
    updatedAt: parseIso(data?.updatedAt) ?? parseIso(row?.created_at) ?? null,
    numberOfGuests,
    reminderCount,
    mapsUrl: buildMapsUrl(locationText),
    createdVia: normalizeCreatedVia(data?.createdVia),
    ownership: normalizeDashboardEventOwnership(
      data?.ownership,
      data?.createdVia
    ),
    shareStatus: normalizeDashboardEventShareStatus(data?.shareStatus),
  };
}

export function extractHomeOrigin(featureVisibility: unknown): {
  lat: number;
  lng: number;
  label: string | null;
} | null {
  if (!featureVisibility || typeof featureVisibility !== "object") return null;
  const source = featureVisibility as Record<string, any>;
  const candidates = [
    source?.home,
    source?.homeLocation,
    source?.origin,
    source?.settings?.homeLocation,
    source?.settings?.origin,
    source?.profile?.homeLocation,
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const lat = parseFiniteNumber(candidate.lat ?? candidate.latitude);
    const lng = parseFiniteNumber(candidate.lng ?? candidate.longitude ?? candidate.lon);
    if (lat == null || lng == null) continue;
    return {
      lat,
      lng,
      label: firstString(candidate.label, candidate.name, candidate.address),
    };
  }
  return null;
}

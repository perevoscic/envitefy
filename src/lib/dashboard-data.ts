import { normalizeThumbnailFocus, type ThumbnailFocus } from "./thumbnail-focus.ts";
import { resolveCoverImageUrlFromEventData } from "./upload-config.ts";

export type DashboardEventOwnership = "owned" | "invited";
export type DashboardEventShareStatus = "accepted" | "pending" | null;

type InvitedEventLikeRecord =
  | {
      ownership?: unknown;
      invitedFromScan?: unknown;
    }
  | null
  | undefined;

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
  thumbnailFocus: ThumbnailFocus | null;
  status: string | null;
  category: string | null;
  updatedAt: string | null;
  numberOfGuests: number;
  hasRsvp: boolean;
  reminderCount: number;
  mapsUrl: string | null;
  createdVia: string | null;
  ownership: DashboardEventOwnership;
  shareStatus: DashboardEventShareStatus;
  userRsvpResponse: "yes" | "no" | "maybe" | null;
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

function isTruthyBooleanLike(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function hasNonEmptyString(...values: unknown[]): boolean {
  return values.some((value) => typeof value === "string" && value.trim().length > 0);
}

export function hasActionableRsvp(data: any, numberOfGuestsRaw?: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const numberOfGuests = Math.max(0, Number(numberOfGuestsRaw ?? data?.numberOfGuests ?? 0));
  if (numberOfGuests > 0) return true;
  if (isTruthyBooleanLike(data?.rsvpEnabled)) return true;

  const rsvpRecord =
    data?.rsvp && typeof data.rsvp === "object" && !Array.isArray(data.rsvp) ? data.rsvp : null;
  if (isTruthyBooleanLike(rsvpRecord?.isEnabled)) return true;
  if (
    hasNonEmptyString(
      typeof data?.rsvp === "string" ? data.rsvp : null,
      data?.rsvpUrl,
      data?.rsvpDeadline,
      rsvpRecord?.contact,
      rsvpRecord?.url,
      rsvpRecord?.link,
      rsvpRecord?.deadline,
      data?.fieldsGuess?.rsvp,
      data?.fieldsGuess?.rsvpUrl,
      data?.fieldsGuess?.rsvpDeadline,
    )
  ) {
    return true;
  }

  return false;
}

function buildMapsUrl(locationText: string | null): string | null {
  if (!locationText) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`;
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

function normalizeDashboardEventCategory(data: any, row: HistoryRow): string | null {
  const category = firstString(data?.category, row?.data?.category);
  const normalizedCategory = String(category || "")
    .trim()
    .toLowerCase();
  const createdVia = normalizeCreatedVia(data?.createdVia);
  const ocrSkinCategory = String(data?.ocrSkin?.category || "")
    .trim()
    .toLowerCase();
  const ocrSportKind = String(data?.ocrSkin?.sportKind || "")
    .trim()
    .toLowerCase();
  const isSportScan =
    createdVia === "ocr-basketball-skin" ||
    createdVia === "ocr-football-skin" ||
    createdVia === "ocr-pickleball-skin" ||
    ocrSkinCategory === "basketball" ||
    ocrSkinCategory === "football" ||
    ocrSportKind === "pickleball";

  if (
    isSportScan &&
    (!normalizedCategory ||
      normalizedCategory === "general events" ||
      normalizedCategory === "general event" ||
      normalizedCategory === "general" ||
      normalizedCategory === "basketball" ||
      normalizedCategory === "football" ||
      normalizedCategory === "pickleball")
  ) {
    return "Sport Events";
  }

  return category;
}

export function isStudioCreatedVia(createdViaRaw: unknown): boolean {
  return normalizeCreatedVia(createdViaRaw) === "studio";
}

export function isScannedInviteCreatedVia(createdViaRaw: unknown): boolean {
  const normalized = normalizeCreatedVia(createdViaRaw);
  return normalized === "ocr" || Boolean(normalized?.startsWith("ocr-"));
}

export function isInvitedEventLikeRecord(record: InvitedEventLikeRecord): boolean {
  if (!record || typeof record !== "object") return false;
  return (
    normalizeDashboardEventOwnership(
      (record as Record<string, unknown>).ownership,
      undefined,
      (record as Record<string, unknown>).invitedFromScan,
    ) === "invited"
  );
}

export function normalizeDashboardEventOwnership(
  ownershipRaw: unknown,
  _createdViaRaw?: unknown,
  invitedFromScanRaw?: unknown,
): DashboardEventOwnership {
  if (
    String(ownershipRaw || "")
      .trim()
      .toLowerCase() === "invited"
  ) {
    return "invited";
  }
  if (invitedFromScanRaw === true) {
    return "invited";
  }
  if (
    typeof invitedFromScanRaw === "string" &&
    invitedFromScanRaw.trim().toLowerCase() === "true"
  ) {
    return "invited";
  }
  return "owned";
}

export function normalizeDashboardEventShareStatus(
  shareStatusRaw: unknown,
): DashboardEventShareStatus {
  const normalized = String(shareStatusRaw || "")
    .trim()
    .toLowerCase();
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
    data?.startAt ??
      data?.startISO ??
      data?.start ??
      data?.fieldsGuess?.start ??
      data?.event?.start,
  );
}

/**
 * Copy nested OCR/event start into canonical `startAt` when top-level fields are
 * missing so dashboard/history projections and indexes stay consistent.
 */
export function normalizeCanonicalStartFields(data: any): void {
  if (!data || typeof data !== "object") return;
  const hasTop =
    (typeof data.startAt === "string" && data.startAt.trim()) ||
    (typeof data.startISO === "string" && data.startISO.trim()) ||
    (typeof data.start === "string" && data.start.trim());
  if (hasTop) return;
  const fg = data.fieldsGuess;
  if (fg && typeof fg === "object" && fg.start != null) {
    const s = String(fg.start).trim();
    if (s) {
      data.startAt = s;
      return;
    }
  }
  const ev = data.event;
  if (ev && typeof ev === "object" && ev.start != null) {
    const s = String(ev.start).trim();
    if (s) {
      data.startAt = s;
    }
  }
}

export function getEventEndIso(data: any): string | null {
  return parseIso(
    data?.endAt ?? data?.endISO ?? data?.end ?? data?.fieldsGuess?.end ?? data?.event?.end,
  );
}

export function toDashboardEvent(row: HistoryRow): DashboardEvent | null {
  const data = row?.data || {};
  const createdVia = normalizeCreatedVia(data?.createdVia);
  if (createdVia === "studio") return null;
  const startAt = getEventStartIso(data);
  if (!startAt) return null;

  const locationText = firstString(
    data?.locationText,
    data?.location,
    data?.fieldsGuess?.location,
    data?.event?.location,
  );
  const locationLat = parseFiniteNumber(data?.locationLat ?? data?.lat ?? data?.event?.locationLat);
  const locationLng = parseFiniteNumber(data?.locationLng ?? data?.lng ?? data?.event?.locationLng);
  const reminderCount = Array.isArray(data?.reminders) ? data.reminders.length : 0;
  const numberOfGuests = Math.max(0, Number(data?.numberOfGuests || 0));
  const hasRsvp = hasActionableRsvp(data, numberOfGuests);

  return {
    id: row.id,
    title:
      firstString(row.title, data?.title, data?.fieldsGuess?.title, data?.event?.title) || "Event",
    startAt,
    endAt: getEventEndIso(data),
    tz: firstString(data?.tz, data?.timezone, data?.fieldsGuess?.timezone, data?.event?.timezone),
    locationText,
    locationLat,
    locationLng,
    coverImageUrl: resolveCoverImageUrlFromEventData(data),
    thumbnailFocus: normalizeThumbnailFocus(data?.thumbnailFocus),
    status: normalizeStatus(data?.status),
    category: normalizeDashboardEventCategory(data, row),
    updatedAt: parseIso(data?.updatedAt) ?? parseIso(row?.created_at) ?? null,
    numberOfGuests,
    hasRsvp,
    reminderCount,
    mapsUrl: buildMapsUrl(locationText),
    createdVia,
    ownership: normalizeDashboardEventOwnership(
      data?.ownership,
      data?.createdVia,
      data?.invitedFromScan,
    ),
    shareStatus: normalizeDashboardEventShareStatus(data?.shareStatus),
    userRsvpResponse: null,
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

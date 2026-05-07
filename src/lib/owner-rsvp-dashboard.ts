type EventDataRecord = Record<string, unknown> | null | undefined;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizedString(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isTrueLike(value: unknown): boolean {
  if (value === true) return true;
  const normalized = normalizedString(value);
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function getRsvpDashboardGuestCount(data: EventDataRecord): number {
  const record = asRecord(data);
  if (!record) return 0;
  const count = Number(record.numberOfGuests ?? 0);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

export function isScannedOrUploadedEventData(data: EventDataRecord): boolean {
  const record = asRecord(data);
  if (!record) return false;

  const sourceContext = asRecord(record.sourceContext);
  const sourceContextType = normalizedString(sourceContext?.type);
  if (sourceContextType === "upload" || sourceContextType === "snap") return true;

  const sourceMarkers = [
    record.createdVia,
    record.source,
    record.ingestMethod,
    record.origin,
    sourceContext?.source,
    sourceContext?.method,
  ]
    .map(normalizedString)
    .filter(Boolean)
    .join(" ");

  return /\b(?:ocr|scan|scanned|snap|upload|uploaded)\b/.test(sourceMarkers);
}

export function canShowOwnerRsvpDashboard(data: EventDataRecord): boolean {
  const record = asRecord(data);
  if (!record) return false;

  const sourceContext = asRecord(record.sourceContext);
  const sourceIntent = normalizedString(sourceContext?.detectedSourceIntent);
  if (sourceIntent === "received_invite") return false;
  if (normalizedString(record.ownership) === "invited") return false;
  if (isTrueLike(record.invitedFromScan)) return false;
  if (isScannedOrUploadedEventData(record)) return false;

  return getRsvpDashboardGuestCount(record) > 0;
}

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

function isFalseLike(value: unknown): boolean {
  if (value === false) return true;
  const normalized = normalizedString(value);
  return normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off";
}

function hasNonEmptyString(...values: unknown[]): boolean {
  return values.some((value) => typeof value === "string" && value.trim().length > 0);
}

function hasUploadedEventMediaPath(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.replace(/\\/g, "/").toLowerCase();
  return normalized.includes("images/events/");
}

function normalizeRsvpOutputValue(value: unknown): string {
  return typeof value === "string"
    ? value
        .trim()
        .toLowerCase()
        .replace(/[/-]+/g, "_")
        .replace(/\s+/g, "_")
    : "";
}

function readRsvpOutputValues(record: Record<string, unknown>): string[] {
  const publicEvent = asRecord(record.publicEvent);
  return [
    record.primaryOutput,
    record.productType,
    record.publicRenderer,
    publicEvent?.primaryOutput,
    publicEvent?.renderer,
    ...(Array.isArray(record.requestedOutputs) ? record.requestedOutputs : []),
    ...(Array.isArray(record.outputs) ? record.outputs : []),
  ]
    .map(normalizeRsvpOutputValue)
    .filter(Boolean);
}

function hasCardOnlyProductEvidence(record: Record<string, unknown>): boolean {
  const outputs = readRsvpOutputValues(record);
  if (outputs.length > 0) return !outputs.includes("rsvp_page");
  return Boolean(asRecord(record.studioCard) || asRecord(record.liveCard));
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
  if (record.attachment || record.ocrSkin) return true;

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

  if (/\b(?:ocr|scan|scanned|snap|upload|uploaded)\b/.test(sourceMarkers)) return true;

  return [
    record.thumbnail,
    record.coverImageUrl,
    record.heroImage,
    record.customHeroImage,
    sourceContext?.url,
    sourceContext?.imageUrl,
    sourceContext?.sourceUrl,
  ].some(hasUploadedEventMediaPath);
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

  const rsvpRecord = asRecord(record.rsvp);
  if (
    isFalseLike(record.rsvpEnabled) ||
    isFalseLike(rsvpRecord?.isEnabled) ||
    isFalseLike(rsvpRecord?.enabled)
  ) {
    return false;
  }
  if (isTrueLike(record.rsvpEnabled)) return true;

  if (
    isTrueLike(rsvpRecord?.isEnabled) ||
    isTrueLike(rsvpRecord?.enabled) ||
    isTrueLike(rsvpRecord?.direct)
  ) {
    return true;
  }

  const fieldsGuess = asRecord(record.fieldsGuess);
  if (
    hasNonEmptyString(
      typeof record.rsvp === "string" ? record.rsvp : null,
      record.rsvpUrl,
      record.rsvpDeadline,
      rsvpRecord?.contact,
      rsvpRecord?.url,
      rsvpRecord?.link,
      rsvpRecord?.deadline,
      fieldsGuess?.rsvp,
      fieldsGuess?.rsvpUrl,
      fieldsGuess?.rsvpDeadline,
    )
  ) {
    return true;
  }

  if (hasCardOnlyProductEvidence(record)) return false;

  return getRsvpDashboardGuestCount(record) > 0;
}

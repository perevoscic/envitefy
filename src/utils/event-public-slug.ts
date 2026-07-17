const DEFAULT_PUBLIC_SLUG = "event";
export const MAX_PUBLIC_SLUG_LENGTH = 96;

const RESERVED_EVENT_PUBLIC_SLUGS = new Set([
  "appointments",
  "baby-showers",
  "birthdays",
  "cheerleading",
  "dance-ballet",
  "football",
  "football-season",
  "gender-reveal",
  "general",
  "gymnastics",
  "new",
  "soccer",
  "special-events",
  "sport-events",
  "weddings",
  "workshops",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return "";
}

function trimSlugLength(slug: string): string {
  if (slug.length <= MAX_PUBLIC_SLUG_LENGTH) return slug;
  const trimmed = slug.slice(0, MAX_PUBLIC_SLUG_LENGTH).replace(/-+$/g, "");
  const lastDash = trimmed.lastIndexOf("-");
  if (lastDash >= 48) return trimmed.slice(0, lastDash).replace(/-+$/g, "");
  return trimmed || DEFAULT_PUBLIC_SLUG;
}

export function normalizePublicSlug(value: string | null | undefined): string {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return trimSlugLength(slug) || DEFAULT_PUBLIC_SLUG;
}

export function isReservedEventPublicSlug(slug: string): boolean {
  return RESERVED_EVENT_PUBLIC_SLUGS.has(normalizePublicSlug(slug));
}

export function makeEventPublicSlugRoutable(slug: string): string {
  const normalized = normalizePublicSlug(slug);
  return isReservedEventPublicSlug(normalized)
    ? `${normalized}-${DEFAULT_PUBLIC_SLUG}`
    : normalized;
}

function looksLikeStreetAddress(value: string): boolean {
  return (
    /\b\d{1,6}\s+\w+/.test(value) &&
    /\b(st|street|rd|road|ave|avenue|blvd|drive|dr|lane|ln|way)\b/i.test(value)
  );
}

function looksLikeHostOrganizerSlugText(value: string): boolean {
  return /\b(?:hosted|sponsored|presented)\s+by\b/i.test(value);
}

function normalizeLocationCompareKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/^\s*(?:hosted|sponsored|presented)\s+by\s+(?:the\s+)?/i, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesText(haystack: string, needle: string): boolean {
  const normalizedHaystack = normalizePublicSlug(haystack);
  const normalizedNeedle = normalizePublicSlug(needle);
  return Boolean(normalizedNeedle && normalizedHaystack.includes(normalizedNeedle));
}

export function readEventPublicSlug(data: unknown): string {
  const record = asRecord(data);
  const value = firstString(record?.publicSlug, record?.public_slug);
  return value ? makeEventPublicSlugRoutable(value) : "";
}

export function buildEventPublicSlugCandidate(params: {
  title?: string | null;
  data?: unknown;
}): string {
  const data = asRecord(params.data);
  const event = asRecord(data?.event);
  const fieldsGuess = asRecord(data?.fieldsGuess);
  const studioCard = asRecord(data?.studioCard);
  const studioDetails = asRecord(studioCard?.eventDetails);
  const invitationData = asRecord(studioCard?.invitationData);
  const invitationDetails = asRecord(invitationData?.eventDetails);
  const publicEvent = asRecord(data?.publicEvent);

  const title = firstString(
    params.title,
    data?.title,
    data?.eventTitle,
    data?.name,
    event?.title,
    fieldsGuess?.title,
    studioDetails?.eventTitle,
    invitationDetails?.eventTitle,
    publicEvent?.title,
  );
  const venue = firstString(
    data?.venueName,
    data?.venue,
    data?.locationName,
    event?.venueName,
    event?.venue,
    fieldsGuess?.venueName,
    fieldsGuess?.venue,
    studioDetails?.venueName,
    invitationDetails?.venueName,
    publicEvent?.venueName,
    publicEvent?.venue,
  );
  const location = firstString(
    data?.location,
    event?.location,
    fieldsGuess?.location,
    studioDetails?.location,
    invitationDetails?.location,
    publicEvent?.locationLine,
  );
  const hostName = firstString(
    data?.hostName,
    event?.hostName,
    fieldsGuess?.hostName,
    studioDetails?.hostName,
    invitationDetails?.hostName,
    publicEvent?.hostName,
  );
  let venueText = venue || (location && !looksLikeStreetAddress(location) ? location : "");
  if (
    venueText &&
    (looksLikeHostOrganizerSlugText(venueText) ||
      (hostName &&
        normalizeLocationCompareKey(venueText) === normalizeLocationCompareKey(hostName)))
  ) {
    venueText = "";
  }

  if (title && venueText && !includesText(title, venueText)) {
    return makeEventPublicSlugRoutable(`${title} at ${venueText}`);
  }

  return makeEventPublicSlugRoutable(title || venueText || DEFAULT_PUBLIC_SLUG);
}

export function buildLegacyEventSlugSegment(id: string, title?: string | null): string {
  const safeId = String(id || "").trim();
  const slug = normalizePublicSlug(title);
  return safeId ? `${slug}-${safeId}` : slug;
}

export function buildPublicEventSlugSegment(
  id: string,
  title?: string | null,
  publicSlug?: string | null,
): string {
  const normalizedPublicSlug = publicSlug ? makeEventPublicSlugRoutable(publicSlug) : "";
  return normalizedPublicSlug || buildLegacyEventSlugSegment(id, title);
}

export type NormalizedOcrLocationFields = {
  venue: string | null;
  location: string | null;
  locationLine: string | null;
};

export type NormalizedOcrRsvpFields = {
  rsvp: string | null;
  rsvpUrl: string | null;
  rsvpDeadline: string | null;
};

export function cleanOcrFieldValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
}

function firstCleanString(...values: unknown[]): string | null {
  for (const value of values) {
    const text = cleanOcrFieldValue(value);
    if (text) return text;
  }
  return null;
}

function uniqueDisplayLine(...values: unknown[]): string | null {
  const parts = values.map(cleanOcrFieldValue).filter((value): value is string => Boolean(value));
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(part);
  }
  return unique.join(", ") || null;
}

export function looksLikeMenuOrFlavorDetails(value: unknown): boolean {
  const text = cleanOcrFieldValue(value);
  if (!text) return false;
  const dollarCount = (text.match(/\$\s*\d/g) || []).length;
  if (dollarCount >= 2) return true;
  const flavorMatches = text.match(
    /\b(?:blue\s+raspberry|tiger'?s\s+blood|groovy\s+grape|island\s+rush|lucky\s+lime|monster\s+mango|ninja\s+cherry|pina\s+colada|strawberry\s+treasure|watermelon\s+wave|flavorwave|flavo[u]?rs?)\b/gi,
  );
  return Boolean(flavorMatches && flavorMatches.length >= 2);
}

export function normalizeOcrLocationFields(args: {
  venue?: unknown;
  venueName?: unknown;
  location?: unknown;
  address?: unknown;
  fallbackLocation?: unknown;
}): NormalizedOcrLocationFields {
  const venueCandidate = firstCleanString(args.venue, args.venueName);
  const venue = venueCandidate && !looksLikeMenuOrFlavorDetails(venueCandidate) ? venueCandidate : null;
  const locationCandidate = firstCleanString(args.location, args.address, args.fallbackLocation);
  const location =
    locationCandidate &&
    !looksLikeMenuOrFlavorDetails(locationCandidate) &&
    (!venue || locationCandidate.toLowerCase() !== venue.toLowerCase())
      ? locationCandidate
      : null;

  return {
    venue,
    location,
    locationLine: uniqueDisplayLine(venue, location),
  };
}

function hasContactMethod(value: string): boolean {
  return (
    /\b(?:\+?1[-.\s]?)?(?:\(\s*\d{3}\s*\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(value) ||
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value) ||
    /\b(?:https?:\/\/|www\.)\S+\b/i.test(value)
  );
}

function isGenericRsvpLabel(value: string): boolean {
  return /^(?:host|hosted\s+by|rsvp|contact|questions?|text|call|message|email|none|n\/a|na)$/i.test(
    value.trim(),
  );
}

export function normalizeOcrRsvpFields(args: {
  rsvp?: unknown;
  rsvpText?: unknown;
  rsvpUrl?: unknown;
  rsvpLink?: unknown;
  rsvpDeadline?: unknown;
  extractedContact?: unknown;
  extractedUrl?: unknown;
  extractedDeadline?: unknown;
}): NormalizedOcrRsvpFields {
  const rawRsvp = firstCleanString(args.rsvp, args.rsvpText, args.extractedContact);
  const rsvp =
    rawRsvp &&
    !isGenericRsvpLabel(rawRsvp) &&
    (hasContactMethod(rawRsvp) || /\b(?:rsvp|respond|reply)\b/i.test(rawRsvp))
      ? rawRsvp
      : null;
  const rsvpUrl = firstCleanString(args.rsvpUrl, args.rsvpLink, args.extractedUrl);
  const rsvpDeadline = firstCleanString(args.rsvpDeadline, args.extractedDeadline);

  return {
    rsvp,
    rsvpUrl,
    rsvpDeadline,
  };
}

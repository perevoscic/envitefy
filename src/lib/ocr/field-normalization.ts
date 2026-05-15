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

function looksLikeDateOrTimeFragment(value: unknown): boolean {
  const text = cleanOcrFieldValue(value);
  if (!text) return false;
  return (
    /^(?:on\s+)?(?:mon|tue|tues|wed|thu|thur|fri|sat|sun)(?:day)?(?:,?\s+[a-z]+\s+\d{1,2})?$/i.test(
      text,
    ) ||
    /^(?:on\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?$/i.test(
      text,
    ) ||
    /^\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?(?:\s*[-–—]\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)?$/i.test(
      text,
    ) ||
    /^(?:on\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?\s+from\s+\d{1,2}(?::\d{2})?/i.test(
      text,
    )
  );
}

function looksLikeVenueNarrative(value: unknown): boolean {
  const text = cleanOcrFieldValue(value);
  if (!text) return false;
  return (
    /\b(?:will|is|are|be|visit|visits|coming|come)\b.+\b(?:at|to)\b/i.test(text) ||
    /\b(?:on|from)\s+(?:mon|tue|tues|wed|thu|thur|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(
      text,
    )
  );
}

function inferVenueFromContext(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  const dashVenue = text.match(/[—–-]\s*([A-Z][A-Za-z0-9'&. -]{2,80}\b(?:Academy|School|Center|Centre|Church|Gym|Hall|Park|Cafe|Café|Restaurant|Stadium|Arena|Auditorium))\b/i)?.[1];
  if (dashVenue) return dashVenue.trim();
  const phraseVenue = text.match(/\b(?:to|at)\s+([A-Z][A-Za-z0-9'&. -]{2,80}\b(?:Academy|School|Center|Centre|Church|Gym|Hall|Park|Cafe|Café|Restaurant|Stadium|Arena|Auditorium))\b/i)?.[1];
  if (phraseVenue) return phraseVenue.trim();
  const lineVenue = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .find((line) =>
      /^[A-Z][A-Za-z0-9'&. -]{2,80}\b(?:Academy|School|Center|Centre|Church|Gym|Hall|Park|Cafe|Café|Restaurant|Stadium|Arena|Auditorium)\b/i.test(
        line,
      ),
    );
  return lineVenue || null;
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
  enrichedLocation?: unknown;
  context?: unknown;
}): NormalizedOcrLocationFields {
  const venueCandidate = firstCleanString(args.venue, args.venueName);
  const venue =
    venueCandidate &&
    !looksLikeMenuOrFlavorDetails(venueCandidate) &&
    !looksLikeDateOrTimeFragment(venueCandidate) &&
    !looksLikeVenueNarrative(venueCandidate)
      ? venueCandidate
      : inferVenueFromContext(args.context);
  const locationCandidate = firstCleanString(args.location, args.address, args.fallbackLocation);
  const normalizedLocation =
    locationCandidate &&
    !looksLikeMenuOrFlavorDetails(locationCandidate) &&
    !looksLikeDateOrTimeFragment(locationCandidate) &&
    (!venue || locationCandidate.toLowerCase() !== venue.toLowerCase())
      ? locationCandidate
      : null;
  const enrichedLocation = firstCleanString(args.enrichedLocation);
  const location = normalizedLocation || enrichedLocation;

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

function isRsvpUrl(value: string | null): boolean {
  if (!value) return false;
  return /\b(?:rsvp|respond|reply|theknot|zola)\b/i.test(value);
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
  sourceText?: unknown;
}): NormalizedOcrRsvpFields {
  const rawRsvp = firstCleanString(args.rsvp, args.rsvpText, args.extractedContact);
  const sourceText = cleanOcrFieldValue(args.sourceText);
  const sourceHasExplicitRsvp = sourceText ? /\b(?:rsvp|respond|reply)\b/i.test(sourceText) : true;
  const rsvp =
    rawRsvp &&
    sourceHasExplicitRsvp &&
    !isGenericRsvpLabel(rawRsvp) &&
    /\b(?:rsvp|respond|reply)\b/i.test(rawRsvp) &&
    hasContactMethod(rawRsvp)
      ? rawRsvp
      : null;
  const rawRsvpUrl = firstCleanString(args.rsvpUrl, args.rsvpLink, args.extractedUrl);
  const rsvpUrl = isRsvpUrl(rawRsvpUrl) ? rawRsvpUrl : null;
  const rsvpDeadline = firstCleanString(args.rsvpDeadline, args.extractedDeadline);

  return {
    rsvp,
    rsvpUrl,
    rsvpDeadline,
  };
}

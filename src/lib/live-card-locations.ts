import { buildPreferredDirectionsHref } from "./directions.ts";
import { composeGuestLocation, isPhysicalGuestLocation } from "./guest-event-details.ts";

export type LiveCardLocationSource = "primary" | "details";

export type LiveCardLocationInput = {
  venueName?: unknown;
  locationLine?: unknown;
  location?: unknown;
  detailsDescription?: unknown;
  additionalLocations?: unknown;
};

export type LiveCardLocationAction = {
  id: string;
  label: string;
  mapQuery: string;
  source: LiveCardLocationSource;
  shortName: string;
};

const INLINE_STREET_ADDRESS_PATTERN =
  /\b\d{1,6}(?:-\d{1,6})?\s+(?=[A-Za-z][A-Za-z.'-]*\s)(?:[A-Za-z0-9.'-]+\s+){0,8}(?:Street|St\.?|Road|Rd\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?|Circle|Cir\.?|Highway|Hwy\.?|Parkway|Pkwy\.?|Place|Pl\.?|Terrace|Ter\.?|Trail|Trl\.?|Way)\b(?:[^\n]*)?/i;

const SECONDARY_DESTINATION_PATTERN =
  /\b(?:(?:then|next|later|after(?:ward|wards)?|after that)\s+)?(?:we(?:'re| are)?\s+)?(?:(?:go(?:ing)?|head(?:ing)?)\s+to\s+)?(?:have\s+)?(lunch|dinner|brunch|breakfast|dessert|cake|pizza|drinks?|snacks?|meal|reception|after[- ]?party)\s+(?:is\s+)?(?:at|@)\s+([^.!?\n;]+)/gi;

const ACTIVITY_LABEL_PATTERN =
  /^(movie|film|dinner|lunch|brunch|breakfast|dessert|cake|pizza|drinks?|snacks?|meal|reception|after[- ]?party|ceremony|party)$/i;

const ACTIVITY_PREFIX_PATTERN =
  /^(movie|film|dinner|lunch|brunch|breakfast|dessert|cake|pizza|drinks?|snacks?|meal|reception|after[- ]?party|ceremony|party)\s+at\s+/i;

const GENERIC_LOCATION_LABELS = new Set([
  "a restaurant",
  "home",
  "movie theater",
  "our house",
  "restaurant",
  "the movie theater",
  "the restaurant",
  "the theater",
  "the theatre",
  "the venue",
  "theatre",
  "venue",
]);

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeComparableText(value: string) {
  return value
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function makeLocationId(source: LiveCardLocationSource, label: string, fallbackIndex: number) {
  const slug = normalizeComparableText(label).replace(/\s+/g, "-");
  return `${source}-${slug || fallbackIndex}`;
}

function titleCasePhrase(value: string) {
  return value
    .split(/([\s-]+)/)
    .map((part) => (/^[a-z]/.test(part) ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join("");
}

function isActivityLabel(value: string) {
  return ACTIVITY_LABEL_PATTERN.test(value.trim());
}

function withLocalityShortForm(place: string, location: string) {
  if (!place) return place;
  if (/\bsrb\b/i.test(place) || /santa rosa beach/i.test(place)) return place;
  if (/santa rosa beach/i.test(location) && place.split(/\s+/).length <= 2) {
    return `${place} SRB`;
  }
  return place;
}

function composeActivityVenueTitle(activity: string, venue: string) {
  const cleanedActivity = titleCasePhrase(activity.trim());
  const cleanedVenue = venue.trim();
  if (!cleanedVenue) return cleanedActivity;
  if (!cleanedActivity) return cleanedVenue;
  if (ACTIVITY_PREFIX_PATTERN.test(cleanedVenue) || ACTIVITY_PREFIX_PATTERN.test(cleanedActivity)) {
    return ACTIVITY_PREFIX_PATTERN.test(cleanedActivity) ? cleanedActivity : cleanedVenue;
  }
  const venueKey = normalizeComparableText(cleanedVenue);
  const activityKey = normalizeComparableText(cleanedActivity);
  if (venueKey.includes(activityKey)) return cleanedVenue;
  return `${cleanedActivity} at ${cleanedVenue}`;
}

export function getLiveCardLocationShortName(label: string): string {
  const place = label.replace(ACTIVITY_PREFIX_PATTERN, "").trim();
  const first = place.split(/\s+/).find((word) => !/^(the|a|an|at|in|on)$/i.test(word));
  return first || place || label;
}

function finalizeLocationAction(
  action: Omit<LiveCardLocationAction, "shortName">,
): LiveCardLocationAction {
  return {
    ...action,
    shortName: getLiveCardLocationShortName(action.label),
  };
}

function inferMovieActivity(details: LiveCardLocationInput, venue: string) {
  const blob = [
    readString(details.detailsDescription),
    readString(details.locationLine),
    readString(details.venueName),
    readString(details.location),
    venue,
  ].join(" ");
  return /\b(movie|film|cinema|theater|theatre|\bamc\b|cinemark|regal)\b/i.test(blob);
}

function combineVenueAndLocation(venue: string, location: string) {
  return composeGuestLocation(venue, location);
}

function findInlineStreetAddress(value: string): { venue: string; address: string } | null {
  const match = value.match(INLINE_STREET_ADDRESS_PATTERN);
  if (!match || match.index === undefined) return null;
  const venue = value
    .slice(0, match.index)
    .replace(/[\s,;:-]+$/g, "")
    .trim();
  const address = match[0].trim();
  if (!venue || !address) return null;
  if (normalizeComparableText(venue) === normalizeComparableText(address)) return null;
  return { venue, address };
}

function buildPrimaryLocationAction(details: LiveCardLocationInput): LiveCardLocationAction | null {
  const venueName = readString(details.venueName);
  const locationLine = readString(details.locationLine);
  const rawLocation = readString(details.location);
  if (!venueName && !locationLine && !rawLocation) return null;
  const rawLocationKey = normalizeComparableText(rawLocation);
  const locationLineKey = normalizeComparableText(locationLine);
  const displayVenue =
    venueName || (locationLine && locationLineKey !== rawLocationKey ? locationLine : "");

  const complete = (action: Omit<LiveCardLocationAction, "shortName">) => {
    const label =
      inferMovieActivity(details, action.label) && !ACTIVITY_PREFIX_PATTERN.test(action.label)
        ? composeActivityVenueTitle("Movie", action.label)
        : action.label;
    return finalizeLocationAction({
      ...action,
      id: makeLocationId(action.source, label, 0),
      label,
    });
  };

  if (displayVenue) {
    return complete({
      id: makeLocationId("primary", displayVenue, 0),
      label: displayVenue,
      mapQuery: combineVenueAndLocation(displayVenue, rawLocation),
      source: "primary",
    });
  }

  const locationLines = rawLocation
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLocationLine = locationLines[0] || rawLocation;
  const firstLocationLineKey = normalizeComparableText(firstLocationLine);
  if (locationLines.length > 1) {
    const addressLines = locationLines.filter(
      (line, index) => index > 0 || normalizeComparableText(line) !== firstLocationLineKey,
    );
    return complete({
      id: makeLocationId("primary", firstLocationLine, 0),
      label: firstLocationLine,
      mapQuery: combineVenueAndLocation(firstLocationLine, addressLines.join(", ")),
      source: "primary",
    });
  }

  const inlineAddress = findInlineStreetAddress(rawLocation);
  if (inlineAddress) {
    return complete({
      id: makeLocationId("primary", inlineAddress.venue, 0),
      label: inlineAddress.venue,
      mapQuery: combineVenueAndLocation(inlineAddress.venue, inlineAddress.address),
      source: "primary",
    });
  }

  return complete({
    id: makeLocationId("primary", rawLocation, 0),
    label: rawLocation,
    mapQuery: rawLocation,
    source: "primary",
  });
}

export function getLiveCardPrimaryLocationLabel(
  details: LiveCardLocationInput | null | undefined,
): string {
  if (!details) return "";
  return buildPrimaryLocationAction(details)?.label || "";
}

function cleanSecondaryDestination(value: string): string {
  return value
    .replace(
      /\s+(?:then|and then|before|after|afterwards?|where|with|starting|starts?|begins?)\b.*$/i,
      "",
    )
    .replace(
      /\s+for\s+(?:lunch|dinner|brunch|breakfast|dessert|cake|pizza|drinks?|food|meal)\b.*$/i,
      "",
    )
    .replace(/\s+(?:at|by|around)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\b.*$/i, "")
    .replace(/^[\s"'([]+|[\s"').,\]]+$/g, "")
    .trim();
}

function isUsableSecondaryDestination(value: string): boolean {
  const normalized = normalizeComparableText(value);
  if (!normalized || GENERIC_LOCATION_LABELS.has(normalized)) return false;
  const words = normalized.split(" ").filter(Boolean);
  if (words.length > 12) return false;
  if (words.length === 1 && !/^[A-Z0-9]/.test(value)) return false;
  return /[a-z0-9]/i.test(value);
}

function extractSecondaryLocationActions(detailsDescription: string): LiveCardLocationAction[] {
  if (!detailsDescription) return [];
  const actions: LiveCardLocationAction[] = [];
  const seen = new Set<string>();

  for (const match of detailsDescription.matchAll(SECONDARY_DESTINATION_PATTERN)) {
    const activity = readString(match[1]);
    const destination = cleanSecondaryDestination(match[2] || "");
    const key = normalizeComparableText(destination);
    if (!isUsableSecondaryDestination(destination) || seen.has(key)) continue;
    seen.add(key);
    const label = composeActivityVenueTitle(activity, destination);
    actions.push(
      finalizeLocationAction({
        id: makeLocationId("details", label, actions.length),
        label,
        mapQuery: destination,
        source: "details",
      }),
    );
  }

  return actions;
}

function extractStructuredLocationActions(value: unknown): LiveCardLocationAction[] {
  if (!Array.isArray(value)) return [];
  const actions: LiveCardLocationAction[] = [];
  for (const item of value) {
    const record =
      item && typeof item === "object" && !Array.isArray(item)
        ? (item as Record<string, unknown>)
        : {};
    const raw = readString(item);
    const label = readString(record.label) || readString(record.title) || readString(record.name);
    const venue =
      readString(record.venue) || readString(record.venueName) || readString(record.placeName);
    const location = readString(record.location) || readString(record.address) || raw;
    const place = withLocalityShortForm(venue || location, `${venue} ${location}`);
    const display =
      label && place && isActivityLabel(label)
        ? composeActivityVenueTitle(label, place)
        : label || place || location;
    const mapQuery = readString(record.mapQuery) || combineVenueAndLocation(venue, location);
    if (!display || !mapQuery) continue;
    actions.push(
      finalizeLocationAction({
        id: makeLocationId("details", display, actions.length),
        label: display,
        mapQuery,
        source: "details",
      }),
    );
  }
  return actions.filter((action) => isPhysicalGuestLocation(action.mapQuery));
}

function isDuplicateLocationAction(
  action: LiveCardLocationAction,
  existingActions: LiveCardLocationAction[],
) {
  const actionKeys = [action.label, action.mapQuery].map(normalizeComparableText).filter(Boolean);
  return existingActions.some((existing) => {
    const existingKeys = [existing.label, existing.mapQuery]
      .map(normalizeComparableText)
      .filter(Boolean);
    return actionKeys.some((actionKey) =>
      existingKeys.some((existingKey) => {
        if (actionKey === existingKey) return true;
        const shorter = actionKey.length < existingKey.length ? actionKey : existingKey;
        const longer = actionKey.length < existingKey.length ? existingKey : actionKey;
        return shorter.length >= 8 && longer.includes(shorter);
      }),
    );
  });
}

export function buildLiveCardLocationActions(
  details: LiveCardLocationInput | null | undefined,
): LiveCardLocationAction[] {
  if (!details) return [];
  const actions: LiveCardLocationAction[] = [];
  const primary = buildPrimaryLocationAction(details);
  if (primary) actions.push(primary);

  for (const structured of extractStructuredLocationActions(details.additionalLocations)) {
    if (!isDuplicateLocationAction(structured, actions)) {
      actions.push(structured);
    }
  }

  for (const secondary of extractSecondaryLocationActions(readString(details.detailsDescription))) {
    if (!isDuplicateLocationAction(secondary, actions)) {
      actions.push(secondary);
    }
  }

  return actions.filter((action) => isPhysicalGuestLocation(action.mapQuery));
}

export function buildLiveCardDirectionsHref(mapQuery: string) {
  return buildPreferredDirectionsHref(mapQuery);
}

/** The place name is already the heading; expose the remaining saved address. */
export function getLiveCardLocationAddress(action: LiveCardLocationAction): string {
  const venue = action.label.replace(ACTIVITY_PREFIX_PATTERN, "").trim();
  const query = action.mapQuery.trim();
  if (normalizeComparableText(venue) === normalizeComparableText(query)) return "";
  if (query.toLowerCase().startsWith(venue.toLowerCase())) {
    return query.slice(venue.length).replace(/^[\s,;]+/, "");
  }
  // A different venue spelling is not an address. Keep it in the directions link.
  return findInlineStreetAddress(query)?.address || (INLINE_STREET_ADDRESS_PATTERN.test(query) ? query : "");
}

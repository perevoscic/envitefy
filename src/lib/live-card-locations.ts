export type LiveCardLocationSource = "primary" | "details";

export type LiveCardLocationInput = {
  venueName?: unknown;
  location?: unknown;
  detailsDescription?: unknown;
};

export type LiveCardLocationAction = {
  id: string;
  label: string;
  mapQuery: string;
  source: LiveCardLocationSource;
};

const INLINE_STREET_ADDRESS_PATTERN =
  /\b\d{1,6}(?:-\d{1,6})?\s+(?=[A-Za-z][A-Za-z.'-]*\s)(?:[A-Za-z0-9.'-]+\s+){0,8}(?:Street|St\.?|Road|Rd\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?|Circle|Cir\.?|Highway|Hwy\.?|Parkway|Pkwy\.?|Place|Pl\.?|Terrace|Ter\.?|Trail|Trl\.?|Way)\b(?:[^\n]*)?/i;

const SECONDARY_DESTINATION_PATTERN =
  /\b(?:(?:then|next|later|after(?:ward|wards)?|after that)\s+)?(?:we(?:'re| are)?\s+)?(?:(?:go(?:ing)?|head(?:ing)?)\s+to\s+)?(?:have\s+)?(?:lunch|dinner|brunch|breakfast|dessert|cake|pizza|drinks?|snacks?|meal|reception|after[- ]?party)\s+(?:is\s+)?(?:at|@)\s+([^.!?\n;]+)/gi;

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

function combineVenueAndLocation(venue: string, location: string) {
  if (!venue) return location;
  if (!location) return venue;
  const venueKey = normalizeComparableText(venue);
  const locationKey = normalizeComparableText(location);
  if (!venueKey || !locationKey || locationKey.includes(venueKey)) return location;
  return `${venue} ${location}`;
}

function findInlineStreetAddress(value: string): { venue: string; address: string } | null {
  const match = value.match(INLINE_STREET_ADDRESS_PATTERN);
  if (!match || match.index === undefined) return null;
  const venue = value.slice(0, match.index).replace(/[\s,;:-]+$/g, "").trim();
  const address = match[0].trim();
  if (!venue || !address) return null;
  if (normalizeComparableText(venue) === normalizeComparableText(address)) return null;
  return { venue, address };
}

function buildPrimaryLocationAction(details: LiveCardLocationInput): LiveCardLocationAction | null {
  const venueName = readString(details.venueName);
  const rawLocation = readString(details.location);
  if (!venueName && !rawLocation) return null;

  if (venueName) {
    return {
      id: makeLocationId("primary", venueName, 0),
      label: venueName,
      mapQuery: combineVenueAndLocation(venueName, rawLocation),
      source: "primary",
    };
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
    return {
      id: makeLocationId("primary", firstLocationLine, 0),
      label: firstLocationLine,
      mapQuery: combineVenueAndLocation(firstLocationLine, addressLines.join(", ")),
      source: "primary",
    };
  }

  const inlineAddress = findInlineStreetAddress(rawLocation);
  if (inlineAddress) {
    return {
      id: makeLocationId("primary", inlineAddress.venue, 0),
      label: inlineAddress.venue,
      mapQuery: combineVenueAndLocation(inlineAddress.venue, inlineAddress.address),
      source: "primary",
    };
  }

  return {
    id: makeLocationId("primary", rawLocation, 0),
    label: rawLocation,
    mapQuery: rawLocation,
    source: "primary",
  };
}

export function getLiveCardPrimaryLocationLabel(
  details: LiveCardLocationInput | null | undefined,
): string {
  if (!details) return "";
  return buildPrimaryLocationAction(details)?.label || "";
}

function cleanSecondaryDestination(value: string): string {
  return value
    .replace(/\s+(?:then|and then|before|after|afterwards?|where|with|starting|starts?|begins?)\b.*$/i, "")
    .replace(/\s+for\s+(?:lunch|dinner|brunch|breakfast|dessert|cake|pizza|drinks?|food|meal)\b.*$/i, "")
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
    const destination = cleanSecondaryDestination(match[1] || "");
    const key = normalizeComparableText(destination);
    if (!isUsableSecondaryDestination(destination) || seen.has(key)) continue;
    seen.add(key);
    actions.push({
      id: makeLocationId("details", destination, actions.length),
      label: destination,
      mapQuery: destination,
      source: "details",
    });
  }

  return actions;
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

  for (const secondary of extractSecondaryLocationActions(readString(details.detailsDescription))) {
    if (!isDuplicateLocationAction(secondary, actions)) {
      actions.push(secondary);
    }
  }

  return actions;
}

export function buildLiveCardDirectionsHref(mapQuery: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;
}

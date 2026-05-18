export type OcrSecondaryLocation = {
  label: string | null;
  venue?: string | null;
  location: string;
  address?: string | null;
  timeText?: string | null;
  description?: string | null;
};

const SECONDARY_DESTINATION_PATTERN =
  /\b(?:(then|next|later|after(?:ward|wards)?|after that|after the movie)\s+)?(?:we(?:'re| are)?\s+)?(?:(?:go(?:ing)?|head(?:ing)?)\s+to\s+)?(?:have\s+)?(lunch|dinner|brunch|breakfast|dessert|cake|pizza|drinks?|snacks?|meal|reception|after[- ]?party)\s+(?:is\s+)?(?:at|@)\s+([^.!?\n;]+)/gi;

const GENERIC_DESTINATIONS = new Set([
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

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function comparable(value: string): string {
  return value
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sentenceCase(value: string): string {
  const text = cleanString(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function cleanDestination(value: string): string {
  return cleanString(value)
    .replace(/\s+(?:then|and then|before|after|afterwards?|where|with|starting|starts?|begins?)\b.*$/i, "")
    .replace(/\s+for\s+(?:lunch|dinner|brunch|breakfast|dessert|cake|pizza|drinks?|food|meal)\b.*$/i, "")
    .replace(/\s+(?:at|by|around)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\b.*$/i, "")
    .replace(/^[\s"'([]+|[\s"').,\]]+$/g, "")
    .trim();
}

function usableDestination(value: string): boolean {
  const normalized = comparable(value);
  if (!normalized || GENERIC_DESTINATIONS.has(normalized)) return false;
  const words = normalized.split(" ").filter(Boolean);
  if (words.length > 12) return false;
  if (words.length === 1 && !/^[A-Z0-9]/.test(value)) return false;
  return /[a-z0-9]/i.test(value);
}

function normalizeLabel(value: string | null): string | null {
  const text = cleanString(value);
  if (!text) return null;
  if (/^after\s+the\s+movie$/i.test(text)) return "After the Movie";
  if (/^after[-\s]?party$/i.test(text)) return "After-party";
  return text.replace(/\b\w/g, (match) => match.toUpperCase());
}

function activityLabel(activity: string): string {
  const text = cleanString(activity).replace(/s$/i, "");
  if (/after[- ]?party/i.test(text)) return "After-party";
  return sentenceCase(text);
}

function makeSecondaryLocation(params: {
  label: string | null;
  activity: string;
  destination: string;
}): OcrSecondaryLocation | null {
  const destination = cleanDestination(params.destination);
  if (!usableDestination(destination)) return null;
  const activity = activityLabel(params.activity);
  const label = normalizeLabel(params.label);
  return {
    label,
    location: destination,
    description: [activity, destination].filter(Boolean).join(" at "),
  };
}

function parseLabeledSecondaryLine(line: string): OcrSecondaryLocation | null {
  const match = line.match(
    /^(after\s+(?:the\s+)?(?:movie|show|ceremony|game|meet|event|party)|reception|after[-\s]?party|dinner|lunch|brunch|breakfast|dessert|cake|pizza|drinks?|snacks?)\s*:\s*(.+)$/i,
  );
  if (!match) return null;
  const label = match[1] || null;
  const value = cleanString(match[2]);
  const activityAtPlace = value.match(
    /^(lunch|dinner|brunch|breakfast|dessert|cake|pizza|drinks?|snacks?|meal|reception|after[- ]?party)\s+(?:is\s+)?(?:at|@)\s+(.+)$/i,
  );
  if (activityAtPlace) {
    return makeSecondaryLocation({
      label,
      activity: activityAtPlace[1] || label || "Details",
      destination: activityAtPlace[2] || "",
    });
  }
  return makeSecondaryLocation({
    label,
    activity: label || "Details",
    destination: value,
  });
}

export function extractOcrSecondaryLocations(...values: unknown[]): OcrSecondaryLocation[] {
  const locations: OcrSecondaryLocation[] = [];
  const seen = new Set<string>();
  const add = (location: OcrSecondaryLocation | null) => {
    if (!location) return;
    const key = comparable(location.location);
    if (!key || seen.has(key)) return;
    seen.add(key);
    locations.push(location);
  };

  const text = values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .join("\n");
  for (const line of text.split(/\r?\n+/).map(cleanString).filter(Boolean)) {
    add(parseLabeledSecondaryLine(line));
  }

  for (const match of text.matchAll(SECONDARY_DESTINATION_PATTERN)) {
    const label = match[1] && /^after\s+the\s+movie$/i.test(match[1]) ? "After the Movie" : null;
    add(
      makeSecondaryLocation({
        label,
        activity: match[2] || "Details",
        destination: match[3] || "",
      }),
    );
  }

  return locations.slice(0, 4);
}

export function appendSecondaryLocationsToDescription(
  description: string | null | undefined,
  locations: OcrSecondaryLocation[],
): string {
  const base = cleanString(description);
  const additions = locations
    .map((location) => {
      const destination = cleanString(location.location);
      if (!destination || comparable(base).includes(comparable(destination))) return "";
      const label = cleanString(location.label);
      const detail = cleanString(location.description) || destination;
      return label ? `${label}: ${detail}.` : `${detail}.`;
    })
    .filter(Boolean);

  return [base, ...additions].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function extractOcrMovieTitle(...values: unknown[]): string | null {
  const text = values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .join("\n");
  for (const line of text.split(/\r?\n+/).map(cleanString).filter(Boolean)) {
    const match = line.match(/^movie\s*:\s*(.{2,80})$/i);
    const title = cleanString(match?.[1])
      .replace(/\s+\b(?:when|where|after\s+the\s+movie)\b.*$/i, "")
      .replace(/[.!?;:,]+$/g, "")
      .trim();
    if (title && /[A-Za-z]/.test(title)) return title;
  }
  return null;
}

export function appendMovieTitleToDescription(
  description: string | null | undefined,
  movieTitle: string | null | undefined,
): string {
  const base = cleanString(description);
  const title = cleanString(movieTitle);
  if (!title || comparable(base).includes(comparable(title))) return base;
  return [base, `Movie: ${title}.`].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export const GYMNASTICS_PAGE_TEXT_LABELS = {
  mastheadLeft: "Top-left label",
  mastheadRight: "Top-right label",
  invitation: "Welcome message",
  tagline: "Encouragement",
  signoffLeft: "Bottom-left label",
  signoffRight: "Bottom-right label",
  eventTitle: "Event title",
  eventDetails: "Event description",
  eventDisplayDate: "Display date",
  eventVenue: "Venue",
  eventAddress: "Address",
  hostByline: "Host introduction",
  meetDay: "Meet day label",
  startingAt: "Start time label",
  venueLabel: "Venue label",
  programIndex: "Meet contents heading",
  rosterTitle: "Roster heading",
  rosterEyebrow: "Roster caption",
  practiceTitle: "Practice heading",
  practiceEyebrow: "Practice caption",
  practiceFocus: "Practice focus label",
  supportTitle: "Support heading",
  supportEyebrow: "Support caption",
  uniformLabel: "Uniform label",
  openSlot: "Open volunteer slot text",
  tripDetails: "Trip details placeholder",
  rsvpTitle: "RSVP heading",
  rsvpEyebrow: "RSVP caption",
  hostHotel: "Host hotel label",
  rsvpName: "RSVP name label",
  rsvpNameHint: "RSVP name placeholder",
  rsvpEmailHint: "RSVP email placeholder",
  rsvpPhoneHint: "RSVP phone placeholder",
  rsvpAthleteHint: "Athlete selection prompt",
  rsvpGoing: "Going option",
  rsvpGoingHelp: "Going explanation",
  rsvpNotGoing: "Not going option",
  rsvpNotGoingHelp: "Not going explanation",
  rsvpSubmit: "RSVP button caption",
  rsvpSubmitting: "RSVP sending message",
  rsvpConfirmation: "RSVP confirmation message",
  rsvpAgain: "Another response button caption",
  gearFallback: "Gear item label",
  volunteerFallback: "Volunteer label",
  driverFallback: "Driver label",
} as const;

export const GYMNASTICS_STANDALONE_TEXT_KEYS = [
  "mastheadLeft", "mastheadRight", "invitation", "tagline", "signoffLeft",
  "signoffRight", "hostByline", "meetDay", "startingAt", "venueLabel",
] as const;
export type GymnasticsStandaloneTextKey = typeof GYMNASTICS_STANDALONE_TEXT_KEYS[number];

export function isGymnasticsStandaloneTextKey(key: string): key is GymnasticsStandaloneTextKey {
  return GYMNASTICS_STANDALONE_TEXT_KEYS.some(candidate => candidate === key);
}

export type GymnasticsTextCopyKey = `copy:${GymnasticsStandaloneTextKey}:${string}:text`;
export type GymnasticsTextPlacement = Partial<Record<"desktop" | "mobile", { x: number; y: number }>>;
export type GymnasticsTextPlacementKey = `placement:${GymnasticsStandaloneTextKey | GymnasticsTextCopyKey}`;

export function isGymnasticsTextPlacementKey(key: string): key is GymnasticsTextPlacementKey {
  return key.startsWith("placement:") && (
    isGymnasticsStandaloneTextKey(key.slice(10)) || isGymnasticsTextCopyKey(key.slice(10))
  );
}

/** Positions are fractions of the available canvas, with separate phone and desktop placements. */
export function parseGymnasticsTextPlacement(value: string | undefined): GymnasticsTextPlacement | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const result: GymnasticsTextPlacement = {};
    for (const device of ["desktop", "mobile"] as const) {
      const point = parsed[device];
      if (point && typeof point.x === "number" && Number.isFinite(point.x) &&
          typeof point.y === "number" && Number.isFinite(point.y)) {
        const coordinate = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 100000) / 100000;
        result[device] = { x: coordinate(point.x), y: coordinate(point.y) };
      }
    }
    return Object.keys(result).length ? result : undefined;
  } catch {
    return undefined;
  }
}

export function isGymnasticsTextCopyKey(key: string): key is GymnasticsTextCopyKey {
  const match = /^copy:([^:]+):[a-zA-Z0-9-]{1,80}:text$/.exec(key);
  return Boolean(match && isGymnasticsStandaloneTextKey(match[1]));
}

export type GymnasticsPageTextKey =
  | keyof typeof GYMNASTICS_PAGE_TEXT_LABELS
  | GymnasticsTextCopyKey
  | GymnasticsTextPlacementKey
  | `section:${string}:label`
  | `block:${string}:title`
  | `block:${string}:text`
  | `card:${string}:label`
  | `card:${string}:body`
  | `card:${string}:meta`
  | `action:${string}:label`
  | `line:${string}:text`;
export type GymnasticsPageText = Partial<Record<GymnasticsPageTextKey, string>>;
export type GymnasticsPageTextChange = (
  key: GymnasticsPageTextKey,
  value: string | undefined,
) => void;
export const GYMNASTICS_PAGE_TEXT_LIMIT = 240;

export function isGymnasticsPageTextKey(key: string): key is GymnasticsPageTextKey {
  return (
    Object.hasOwn(GYMNASTICS_PAGE_TEXT_LABELS, key) ||
    isGymnasticsTextCopyKey(key) ||
    isGymnasticsTextPlacementKey(key) ||
    /^(?:section:[^:]{1,200}:label|block:[^:]{1,200}:(?:title|text)|card:[^:]{1,400}:(?:label|body|meta)|action:[^:]{1,400}:label|line:[^:]{1,400}:text)$/.test(
      key,
    )
  );
}

export function gymnasticsPageTextLimit(key: GymnasticsPageTextKey): number {
  if (isGymnasticsTextCopyKey(key)) {
    return gymnasticsPageTextLimit(key.split(":")[1] as GymnasticsStandaloneTextKey);
  }
  return key === "eventDetails" || /:(?:text|body)$/.test(key) ? 4000 : GYMNASTICS_PAGE_TEXT_LIMIT;
}

/** Missing keys use the design's wording; an explicitly empty string hides the line. */
export function normalizeGymnasticsPageText(value: unknown): GymnasticsPageText {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: GymnasticsPageText = {};
  for (const [key, text] of Object.entries(value)) {
    if (isGymnasticsTextPlacementKey(key)) {
      const source = key.slice(10);
      if (isGymnasticsTextCopyKey(source) && typeof (value as Record<string, unknown>)[source] !== "string") continue;
      const placement = typeof text === "string" ? parseGymnasticsTextPlacement(text) : undefined;
      if (placement) result[key] = JSON.stringify(placement);
      continue;
    }
    // Event facts stay in their canonical fields, separate from decorative wording.
    if (
      key !== "eventTitle" &&
      key !== "eventDetails" &&
      key !== "eventDisplayDate" &&
      key !== "eventVenue" &&
      key !== "eventAddress" &&
      isGymnasticsPageTextKey(key) &&
      typeof text === "string"
    ) {
      result[key] = text.slice(0, gymnasticsPageTextLimit(key));
    }
  }
  return result;
}

type GymnasticsEditableData = {
  title?: string;
  details?: string;
  venue?: string;
  address?: string;
  extra?: Record<string, unknown>;
  gymnasticsPageText?: GymnasticsPageText;
};

/** Inline facts and sidebar inputs update the same event data. */
export function applyGymnasticsPageTextChange<T extends GymnasticsEditableData>(
  previous: T,
  key: GymnasticsPageTextKey,
  value: string | undefined,
): T {
  if (key === "eventTitle") return { ...previous, title: value ?? "" };
  if (key === "eventDetails") return { ...previous, details: value ?? "" };
  if (key === "eventVenue") return { ...previous, venue: value ?? "" };
  if (key === "eventAddress") return { ...previous, address: value ?? "" };
  if (key === "eventDisplayDate") {
    return { ...previous, extra: { ...previous.extra, meetDateRangeLabel: value ?? "" } };
  }
  const gymnasticsPageText = normalizeGymnasticsPageText(previous.gymnasticsPageText);
  if (value === undefined) {
    delete gymnasticsPageText[key];
    if (isGymnasticsTextCopyKey(key)) delete gymnasticsPageText[`placement:${key}`];
  }
  else gymnasticsPageText[key] = value;
  return { ...previous, gymnasticsPageText };
}

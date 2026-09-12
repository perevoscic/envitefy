export const GYMNASTICS_PAGE_TEXT_LABELS = {
  mastheadLeft: "Top-left label",
  mastheadRight: "Top-right label",
  invitation: "Welcome message",
  tagline: "Encouragement",
  signoffLeft: "Bottom-left label",
  signoffRight: "Bottom-right label",
  eventTitle: "Event title",
  eventDetails: "Event description",
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

export type GymnasticsPageTextKey =
  | keyof typeof GYMNASTICS_PAGE_TEXT_LABELS
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
    /^(?:section:[^:]{1,200}:label|block:[^:]{1,200}:(?:title|text)|card:[^:]{1,400}:(?:label|body|meta)|action:[^:]{1,400}:label|line:[^:]{1,400}:text)$/.test(
      key,
    )
  );
}

export function gymnasticsPageTextLimit(key: GymnasticsPageTextKey) {
  return key === "eventDetails" || /:(?:text|body)$/.test(key) ? 4000 : GYMNASTICS_PAGE_TEXT_LIMIT;
}

/** Missing keys use the design's wording; an explicitly empty string hides the line. */
export function normalizeGymnasticsPageText(value: unknown): GymnasticsPageText {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: GymnasticsPageText = {};
  for (const [key, text] of Object.entries(value)) {
    // Titles stay in the canonical event title so calendars and saved cards agree.
    if (
      key !== "eventTitle" &&
      key !== "eventDetails" &&
      isGymnasticsPageTextKey(key) &&
      typeof text === "string"
    ) {
      result[key] = text.slice(0, gymnasticsPageTextLimit(key));
    }
  }
  return result;
}

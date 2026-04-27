import { STUDIO_LIBRARY_STORAGE_KEY } from "./studio-constants";
import type {
  EventDetails,
  FieldConfig,
  InviteCategory,
  SharedFieldConfig,
} from "./studio-workspace-types";

export const STORAGE_KEY = STUDIO_LIBRARY_STORAGE_KEY;

export const CATEGORY_FIELDS: Partial<Record<InviteCategory, FieldConfig[]>> = {
  Birthday: [
    {
      label: "Person's Name",
      key: "name",
      type: "text",
      placeholder: "e.g. Lara",
      required: true,
    },
    {
      label: "Age Turning",
      key: "age",
      type: "text",
      placeholder: "e.g. 7",
      required: true,
      maxLength: 6,
      inputMode: "numeric",
      compact: true,
    },
    { label: "Birthday Theme", key: "theme", type: "text", placeholder: "e.g. Movie Cats" },
    {
      label: "Who Is Invited",
      key: "invitedWho",
      type: "text",
      placeholder: "e.g. Family and friends",
    },
    { label: "Dress Code", key: "dressCode", type: "text", placeholder: "e.g. Sparkly casual" },
    { label: "Gift Note", key: "giftNote", type: "text", placeholder: "e.g. No gifts please" },
    {
      label: "Gift List Link",
      key: "registryLink",
      type: "text",
      placeholder: "e.g. Amazon gift list or wishlist link",
      inputMode: "url",
    },
    { label: "Surprise Party?", key: "isSurprise", type: "checkbox" },
    { label: "Milestone Birthday?", key: "isMilestone", type: "checkbox" },
    {
      label: "Preferred Cake / Activity",
      key: "activityNote",
      type: "textarea",
      placeholder: "e.g. Popcorn bar and cat ears",
    },
  ],
  Wedding: [
    {
      label: "Couple Names",
      key: "coupleNames",
      type: "text",
      placeholder: "e.g. Sarah & James",
      required: true,
    },
    { label: "Event Title", key: "eventTitle", type: "text", placeholder: "e.g. Our Big Day" },
    { label: "Ceremony Date", key: "ceremonyDate", type: "date" },
    { label: "Ceremony Time", key: "ceremonyTime", type: "time" },
    { label: "Reception Time", key: "receptionTime", type: "time" },
    {
      label: "Ceremony Venue",
      key: "ceremonyVenue",
      type: "text",
      placeholder: "e.g. St. Mary's Church",
    },
    {
      label: "Reception Venue",
      key: "receptionVenue",
      type: "text",
      placeholder: "e.g. The Grand Ballroom",
    },
    { label: "Dress Code", key: "dressCode", type: "text", placeholder: "e.g. Black Tie" },
    {
      label: "Registry Link",
      key: "registryLink",
      type: "text",
      placeholder: "e.g. Amazon, Zola, The Knot, or registry link",
      inputMode: "url",
    },
    {
      label: "Wedding Website",
      key: "weddingWebsite",
      type: "text",
      placeholder: "e.g. www.sarahandjames.com",
    },
    { label: "Adults Only?", key: "adultsOnly", type: "checkbox" },
    {
      label: "Accommodation Info",
      key: "accommodationInfo",
      type: "textarea",
      placeholder: "e.g. Hotel block at Hilton",
    },
    {
      label: "Plus-One Policy",
      key: "plusOnePolicy",
      type: "text",
      placeholder: "e.g. Invite only",
    },
    {
      label: "Transportation Info",
      key: "transportationInfo",
      type: "text",
      placeholder: "e.g. Shuttle provided",
    },
  ],
  "Baby Shower": [
    {
      label: "Honoree / Parent Name(s)",
      key: "honoreeNames",
      type: "text",
      placeholder: "e.g. Emily",
      required: true,
    },
    {
      label: 'Baby Name or "Baby of"',
      key: "babyName",
      type: "text",
      placeholder: "e.g. Baby Smith",
    },
    { label: "Shower Theme", key: "theme", type: "text", placeholder: "e.g. Jungle" },
    {
      label: "Boy / Girl / Neutral",
      key: "gender",
      type: "select",
      options: ["Boy", "Girl", "Neutral"],
    },
    { label: "Hosted By", key: "hostedBy", type: "text", placeholder: "e.g. Grandma Jane" },
    {
      label: "Registry Link",
      key: "registryLink",
      type: "text",
      placeholder: "e.g. Buy Buy Baby link",
    },
    { label: "Diaper Raffle?", key: "diaperRaffle", type: "checkbox" },
    { label: "Book Instead of Card?", key: "bookInsteadOfCard", type: "checkbox" },
    {
      label: "Bring-a-Book Note",
      key: "bringABookNote",
      type: "text",
      placeholder: "e.g. Please bring a book",
    },
    {
      label: "Gift Preference Note",
      key: "giftPreferenceNote",
      type: "text",
      placeholder: "e.g. Gift cards preferred",
    },
  ],
  Anniversary: [
    {
      label: "Couple Names",
      key: "coupleNames",
      type: "text",
      placeholder: "e.g. Sarah & James",
      required: true,
    },
    { label: "Years Celebrating", key: "age", type: "text", placeholder: "e.g. 25" },
    {
      label: "Event Title",
      key: "eventTitle",
      type: "text",
      placeholder: "e.g. Silver Anniversary",
    },
    { label: "Dress Code", key: "dressCode", type: "text", placeholder: "e.g. Semi-Formal" },
    {
      label: "Gift Preference",
      key: "giftPreferenceNote",
      type: "text",
      placeholder: "e.g. Your presence is our gift",
    },
  ],
  "Bridal Shower": [
    {
      label: "Bride's Name",
      key: "honoreeNames",
      type: "text",
      placeholder: "e.g. Sarah",
      required: true,
    },
    { label: "Shower Theme", key: "theme", type: "text", placeholder: "e.g. Garden Party" },
    { label: "Hosted By", key: "hostedBy", type: "text", placeholder: "e.g. Maid of Honor" },
    {
      label: "Registry Link",
      key: "registryLink",
      type: "text",
      placeholder: "e.g. Amazon, Target, or registry link",
      inputMode: "url",
    },
    { label: "Dress Code", key: "dressCode", type: "text", placeholder: "e.g. Floral dresses" },
  ],
  Housewarming: [
    {
      label: "Host Name(s)",
      key: "honoreeNames",
      type: "text",
      placeholder: "e.g. The Smiths",
      required: true,
    },
    {
      label: "New Address Note",
      key: "message",
      type: "textarea",
      placeholder: "e.g. We can't wait to show you our new home!",
    },
    {
      label: "Registry / Gift Note",
      key: "giftPreferenceNote",
      type: "text",
      placeholder: "e.g. No gifts needed",
    },
    {
      label: "Gift List Link",
      key: "registryLink",
      type: "text",
      placeholder: "e.g. Housewarming wishlist link",
      inputMode: "url",
    },
  ],
  "Field Trip/Day": [
    {
      label: "Event Title",
      key: "eventTitle",
      type: "text",
      placeholder: "e.g. Museum Visit",
      required: true,
    },
    {
      label: "Grade / Class Level",
      key: "gradeLevel",
      type: "text",
      placeholder: "e.g. 3rd Grade",
    },
    { label: "Teacher Name", key: "teacherName", type: "text", placeholder: "e.g. Mrs. Smith" },
    { label: "Chaperones Needed?", key: "chaperonesNeeded", type: "checkbox" },
    { label: "Cost per Student", key: "costPerStudent", type: "text", placeholder: "e.g. $15" },
    { label: "Permission Slip Required?", key: "permissionSlipRequired", type: "checkbox" },
    { label: "Lunch Info", key: "lunchInfo", type: "text", placeholder: "e.g. Bring sack lunch" },
    {
      label: "Transportation",
      key: "transportationType",
      type: "text",
      placeholder: "e.g. School Bus",
    },
    {
      label: "Emergency Contact",
      key: "emergencyContact",
      type: "text",
      placeholder: "e.g. School Office",
    },
    {
      label: "What to Bring",
      key: "whatToBring",
      type: "textarea",
      placeholder: "e.g. Water bottle and comfortable shoes",
    },
  ],
  "Game Day": [
    {
      label: "Event Title",
      key: "eventTitle",
      type: "text",
      placeholder: "e.g. Friday Night Lights",
      required: true,
    },
    {
      label: "Sport",
      key: "sportType",
      type: "text",
      placeholder: "e.g. Football",
      required: true,
    },
    {
      label: "Team / Host",
      key: "teamName",
      type: "text",
      placeholder: "e.g. Varsity Panthers",
      required: true,
    },
    {
      label: "Opponent",
      key: "opponentName",
      type: "text",
      placeholder: "e.g. Central City Tigers",
    },
    {
      label: "League / Division",
      key: "leagueDivision",
      type: "text",
      placeholder: "e.g. District 4",
    },
    {
      label: "Tickets / Link",
      key: "ticketsLink",
      type: "text",
      placeholder: "e.g. https://tickets.example.com",
    },
    {
      label: "Broadcast / Stream",
      key: "broadcastInfo",
      type: "text",
      placeholder: "e.g. ESPN+, YouTube, local radio",
    },
    {
      label: "Parking / Arrival",
      key: "parkingInfo",
      type: "text",
      placeholder: "e.g. Gate B, Lot C, arrive 30 minutes early",
    },
  ],
  "Custom Invite": [
    {
      label: "Event Title",
      key: "eventTitle",
      type: "text",
      placeholder: "e.g. Special Celebration",
      required: true,
    },
    {
      label: "Main Person / Host / Honoree",
      key: "mainPerson",
      type: "text",
      placeholder: "e.g. The Smith Family",
    },
    { label: "Occasion", key: "occasion", type: "text", placeholder: "e.g. Retirement" },
    { label: "Audience", key: "audience", type: "text", placeholder: "e.g. Colleagues" },
    { label: "Theme", key: "theme", type: "text", placeholder: "e.g. Nautical" },
    { label: "Dress Code", key: "dressCode", type: "text", placeholder: "e.g. Casual" },
    {
      label: "Callout Text",
      key: "calloutText",
      type: "text",
      placeholder: "e.g. Join us for a night to remember",
    },
    {
      label: "Optional Link",
      key: "optionalLink",
      type: "text",
      placeholder: "e.g. www.event-link.com",
    },
    {
      label: "Custom Label 1",
      key: "customLabel1",
      type: "text",
      placeholder: "e.g. Favorite Color",
    },
    { label: "Custom Value 1", key: "customValue1", type: "text", placeholder: "e.g. Blue" },
    {
      label: "Custom Label 2",
      key: "customLabel2",
      type: "text",
      placeholder: "e.g. Favorite Food",
    },
    { label: "Custom Value 2", key: "customValue2", type: "text", placeholder: "e.g. Pizza" },
  ],
};

/** Guest-facing "Event details / description" textarea placeholder in StudioFormStep, per invite category. */
export const DETAILS_DESCRIPTION_PLACEHOLDER: Record<InviteCategory, string> = {
  Birthday:
    "e.g. Pizza and games first, then cake and presents. Parents welcome to stay. Pool party—bring a towel.",
  Wedding:
    "e.g. Ceremony at 4 PM, cocktail hour on the terrace, dinner and dancing to follow. Hotel block under the couple's last name.",
  "Baby Shower":
    "e.g. Brunch at 11, games and gifts after. Book instead of a card—see registry. Street parking out front.",
  Anniversary:
    "e.g. Cocktail hour at 6, seated dinner at 7, dancing after. Valet at the main entrance; gifts optional.",
  "Bridal Shower":
    "e.g. Mimosa bar at 10, brunch and gifts to follow. Casual garden attire. Registry link in the invite email.",
  Housewarming:
    "e.g. Drop in between 2 and 6—apps and drinks provided. Park on Oak Street; blue door on the left.",
  "Field Trip/Day":
    "e.g. Meet at the gym at 8:15 AM; bus leaves at 8:30. Bring sack lunch and a water bottle. Back by 3 PM for pickup.",
  "Game Day":
    "e.g. Gates open at 6, kickoff at 7, and student section fills early. Park in Lot C, bring your team colors, and use the ticket link before arrival.",
  "Custom Invite":
    "e.g. Private screening, popcorn provided, feature starts at noon. Park in the east lot.",
};

export const SHARED_BASICS: SharedFieldConfig[] = [
  { label: "Event Date", key: "eventDate", type: "date", required: true },
  { label: "Start Time", key: "startTime", type: "time", required: true },
  { label: "End Time", key: "endTime", type: "time" },
  { label: "Venue Name", key: "venueName", type: "text", placeholder: "e.g. AMC Theater" },
  {
    label: "Location / Address",
    key: "location",
    type: "text",
    placeholder: "e.g. 123 Event St, City",
    required: true,
  },
];

export const RSVP_FIELDS: Array<{
  label: string;
  key: keyof EventDetails;
  type: "text" | "date";
  placeholder?: string;
  required?: boolean;
}> = [
  { label: "Host Name", key: "rsvpName", type: "text", placeholder: "e.g. Sarah", required: true },
  {
    label: "Host Contact",
    key: "rsvpContact",
    type: "text",
    placeholder: "Phone or Email",
    required: true,
  },
  { label: "RSVP Deadline", key: "rsvpDeadline", type: "date" },
];

export type StudioCompactCategoryFormConfig = {
  primaryFields: FieldConfig[];
  secondaryFields?: FieldConfig[];
  supportsRsvp: boolean;
};

export const STUDIO_COMPACT_RSVP_CONTACT_FIELD: FieldConfig = {
  label: "RSVP",
  key: "rsvpContact",
  type: "text",
  placeholder: "Phone or Email",
  required: true,
};

function pickCategoryFields(
  category: InviteCategory,
  keys: Array<keyof EventDetails>,
): FieldConfig[] {
  const categoryFields = CATEGORY_FIELDS[category] || [];
  return keys.map((key) => {
    const field = categoryFields.find((entry) => entry.key === key);
    if (!field) {
      throw new Error(`Missing studio field config for ${category}:${String(key)}`);
    }
    return field;
  });
}

export function supportsStudioCategoryRsvp(
  category: InviteCategory | string | null | undefined,
): boolean {
  return category !== "Game Day";
}

export function getStudioDefaultCallToAction(
  category: InviteCategory | string | null | undefined,
): string {
  return supportsStudioCategoryRsvp(category)
    ? "Tap for details and RSVP."
    : "Tap for details and game info.";
}

export function getStudioDefaultRsvpMessage(
  category: InviteCategory | string | null | undefined,
): string {
  return supportsStudioCategoryRsvp(category)
    ? "Reply to let the host know you're coming."
    : "Check the live card for game details and arrival info.";
}

export const STUDIO_COMPACT_CATEGORY_FORM_CONFIG: Record<
  InviteCategory,
  StudioCompactCategoryFormConfig
> = {
  Birthday: {
    primaryFields: [
      ...pickCategoryFields("Birthday", ["name", "age", "registryLink"]),
      STUDIO_COMPACT_RSVP_CONTACT_FIELD,
    ],
    supportsRsvp: true,
  },
  Wedding: {
    primaryFields: [
      ...pickCategoryFields("Wedding", ["coupleNames", "eventTitle", "registryLink"]),
      STUDIO_COMPACT_RSVP_CONTACT_FIELD,
    ],
    supportsRsvp: true,
  },
  "Baby Shower": {
    primaryFields: [
      ...pickCategoryFields("Baby Shower", ["honoreeNames", "babyName"]),
      STUDIO_COMPACT_RSVP_CONTACT_FIELD,
    ],
    supportsRsvp: true,
  },
  Anniversary: {
    primaryFields: [
      ...pickCategoryFields("Anniversary", ["coupleNames", "age"]),
      STUDIO_COMPACT_RSVP_CONTACT_FIELD,
    ],
    supportsRsvp: true,
  },
  "Bridal Shower": {
    primaryFields: [
      ...pickCategoryFields("Bridal Shower", ["honoreeNames", "hostedBy", "registryLink"]),
      STUDIO_COMPACT_RSVP_CONTACT_FIELD,
    ],
    supportsRsvp: true,
  },
  Housewarming: {
    primaryFields: [
      ...pickCategoryFields("Housewarming", ["honoreeNames", "registryLink"]),
      STUDIO_COMPACT_RSVP_CONTACT_FIELD,
    ],
    secondaryFields: pickCategoryFields("Housewarming", ["message"]),
    supportsRsvp: true,
  },
  "Field Trip/Day": {
    primaryFields: [
      ...pickCategoryFields("Field Trip/Day", ["eventTitle", "gradeLevel"]),
      STUDIO_COMPACT_RSVP_CONTACT_FIELD,
    ],
    supportsRsvp: true,
  },
  "Game Day": {
    primaryFields: pickCategoryFields("Game Day", ["eventTitle", "sportType", "teamName"]),
    secondaryFields: pickCategoryFields("Game Day", ["opponentName"]),
    supportsRsvp: false,
  },
  "Custom Invite": {
    primaryFields: [
      ...pickCategoryFields("Custom Invite", ["eventTitle", "mainPerson"]),
      STUDIO_COMPACT_RSVP_CONTACT_FIELD,
    ],
    supportsRsvp: true,
  },
};

export const EMPTY_POSITIONS = {
  rsvp: { x: 0, y: 0 },
  location: { x: 0, y: 0 },
  share: { x: 0, y: 0 },
  calendar: { x: 0, y: 0 },
  registry: { x: 0, y: 0 },
  details: { x: 0, y: 0 },
};

export const STUDIO_LIBRARY_LIMIT = 10;

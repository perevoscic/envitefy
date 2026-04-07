import {
  Baby,
  Bus,
  Cake,
  CalendarHeart,
  Heart,
  Home,
  WandSparkles,
  Wine,
} from "lucide-react";
import { STUDIO_LIBRARY_STORAGE_KEY } from "./studio-constants";
import type {
  CategoryCard,
  EventDetails,
  FieldConfig,
  InviteCategory,
  SharedFieldConfig,
} from "./studio-workspace-types";

export const STORAGE_KEY = STUDIO_LIBRARY_STORAGE_KEY;

export const CATEGORY_FIELDS: Partial<Record<InviteCategory, FieldConfig[]>> = {
  Birthday: [
    {
      label: "Birthday Person's Name",
      key: "name",
      type: "text",
      placeholder: "e.g. Lara",
      required: true,
    },
    { label: "Age Turning", key: "age", type: "text", placeholder: "e.g. 7", required: true },
    { label: "Birthday Theme", key: "theme", type: "text", placeholder: "e.g. Movie Cats" },
    {
      label: "Who Is Invited",
      key: "invitedWho",
      type: "text",
      placeholder: "e.g. Family and friends",
    },
    { label: "Dress Code", key: "dressCode", type: "text", placeholder: "e.g. Sparkly casual" },
    { label: "Gift Note", key: "giftNote", type: "text", placeholder: "e.g. No gifts please" },
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
    { label: "Registry Link", key: "registryLink", type: "text", placeholder: "e.g. Zola link" },
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
      placeholder: "e.g. Registry link",
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

export const CATEGORIES: CategoryCard[] = [
  { name: "Birthday", icon: Cake },
  { name: "Field Trip/Day", icon: Bus },
  { name: "Bridal Shower", icon: Wine },
  { name: "Wedding", icon: Heart },
  { name: "Housewarming", icon: Home },
  { name: "Baby Shower", icon: Baby },
  { name: "Anniversary", icon: CalendarHeart },
  { name: "Custom Invite", icon: WandSparkles },
];
export const EMPTY_POSITIONS = {
  rsvp: { x: 0, y: 0 },
  location: { x: 0, y: 0 },
  share: { x: 0, y: 0 },
  calendar: { x: 0, y: 0 },
  registry: { x: 0, y: 0 },
  details: { x: 0, y: 0 },
};

export const STUDIO_LIBRARY_LIMIT = 10;

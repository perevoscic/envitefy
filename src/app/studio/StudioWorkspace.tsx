"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Cake,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Gift,
  Heart,
  Home,
  Image as ImageIcon,
  Info,
  Layout,
  Loader2,
  MapPin,
  PartyPopper,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Trash2,
  User,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  normalizeInvitationText,
  normalizeLiveCardMetadata,
  type StudioGenerateApiResponse,
  type StudioGenerateMode,
  type StudioGenerateRequest,
  type StudioGenerationError,
} from "@/lib/studio/types";
import { buildEventSlug, buildStudioCardPath } from "@/utils/event-url";
import { persistImageMediaValue } from "@/utils/media-upload-client";

type StudioStep = "category" | "form" | "studio" | "library";
type MediaType = "image" | "page";
type InviteCategory =
  | "Birthday"
  | "Field Trip/Day"
  | "Bridal Shower"
  | "Wedding"
  | "Housewarming"
  | "Baby Shower"
  | "Anniversary"
  | "Custom Invite";

type ActiveTab = "none" | "location" | "calendar" | "registry" | "share" | "details" | "rsvp";

type EventDetails = {
  category: InviteCategory;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  location: string;
  rsvpName: string;
  rsvpContact: string;
  rsvpDeadline: string;
  message: string;
  specialInstructions: string;
  orientation: "portrait" | "landscape";
  colors: string;
  style: string;
  visualPreferences: string;
  name: string;
  age: string;
  theme: string;
  invitedWho: string;
  dressCode: string;
  giftNote: string;
  isSurprise: boolean;
  isMilestone: boolean;
  activityNote: string;
  coupleNames: string;
  ceremonyDate: string;
  ceremonyTime: string;
  receptionTime: string;
  ceremonyVenue: string;
  receptionVenue: string;
  registryLink: string;
  weddingWebsite: string;
  adultsOnly: boolean;
  accommodationInfo: string;
  plusOnePolicy: string;
  transportationInfo: string;
  honoreeNames: string;
  babyName: string;
  gender: "Boy" | "Girl" | "Neutral";
  hostedBy: string;
  diaperRaffle: boolean;
  bookInsteadOfCard: boolean;
  bringABookNote: string;
  giftPreferenceNote: string;
  gradeLevel: string;
  teacherName: string;
  chaperonesNeeded: boolean;
  costPerStudent: string;
  permissionSlipRequired: boolean;
  lunchInfo: string;
  transportationType: string;
  emergencyContact: string;
  whatToBring: string;
  mainPerson: string;
  occasion: string;
  audience: string;
  calloutText: string;
  optionalLink: string;
  customLabel1: string;
  customValue1: string;
  customLabel2: string;
  customValue2: string;
};

type ButtonPosition = {
  x: number;
  y: number;
};

type InvitationData = {
  title: string;
  subtitle: string;
  description: string;
  scheduleLine: string;
  locationLine: string;
  callToAction: string;
  socialCaption: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    themeStyle: string;
  };
  interactiveMetadata: {
    rsvpMessage: string;
    funFacts: string[];
    ctaLabel: string;
    shareNote: string;
  };
  eventDetails: EventDetails;
};

type MediaItem = {
  id: string;
  type: MediaType;
  url?: string;
  data?: InvitationData;
  errorMessage?: string;
  publishedEventId?: string;
  sharePath?: string;
  theme: string;
  status: "ready" | "loading" | "error";
  details: EventDetails;
  createdAt: string;
  positions?: {
    rsvp: ButtonPosition;
    location: ButtonPosition;
    share: ButtonPosition;
    calendar: ButtonPosition;
    registry: ButtonPosition;
    details: ButtonPosition;
  };
};

type FieldConfig = {
  label: string;
  key: keyof EventDetails;
  type: "text" | "number" | "date" | "time" | "checkbox" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

type SharedFieldConfig = {
  label: string;
  key: keyof EventDetails;
  type: "text" | "date" | "time";
  placeholder?: string;
  required?: boolean;
};

type CategoryCard = {
  name: InviteCategory;
  icon: LucideIcon;
};

type Preset = {
  id: string;
  category: InviteCategory;
  name: string;
  description: string;
  icon: LucideIcon;
  thumbnail: string;
  birthdayAgeGroup?: BirthdayPresetAgeGroup;
  birthdayAudience?: BirthdayPresetAudience;
};

type BirthdayPresetAudience = "female" | "male";
type BirthdayPresetAgeGroup =
  | "little-kids"
  | "kids"
  | "teens"
  | "young-adults"
  | "adults"
  | "milestones";

type BirthdayPresetSeed = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  from: string;
  to: string;
};

const STORAGE_KEY = "envitefy_media";

const CATEGORY_FIELDS: Partial<Record<InviteCategory, FieldConfig[]>> = {
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

const SHARED_BASICS: SharedFieldConfig[] = [
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

const RSVP_FIELDS: Array<{
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

const CATEGORIES: CategoryCard[] = [
  { name: "Birthday", icon: Cake },
  { name: "Field Trip/Day", icon: MapPin },
  { name: "Bridal Shower", icon: Gift },
  { name: "Wedding", icon: Heart },
  { name: "Housewarming", icon: Home },
  { name: "Baby Shower", icon: PartyPopper },
  { name: "Anniversary", icon: Calendar },
  { name: "Custom Invite", icon: WandSparkles },
];

const CATEGORY_DESCRIPTIONS: Record<InviteCategory, string> = {
  Birthday: "Birthdays, milestones, and personal celebrations.",
  "Field Trip/Day": "Class trips, group days, and shared outings.",
  "Bridal Shower": "Showers, tea parties, and pre-wedding gatherings.",
  Wedding: "Ceremonies, receptions, and wedding weekend moments.",
  Housewarming: "Open houses, move-in parties, and new-home invites.",
  "Baby Shower": "Showers, sip-and-sees, and welcoming celebrations.",
  Anniversary: "Anniversaries, vow renewals, and elegant dinners.",
  "Custom Invite": "A flexible format for any celebration or gathering.",
};

function svgThumbnail(label: string, from: string, to: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="720" height="960" rx="56" fill="url(#g)" />
      <circle cx="610" cy="120" r="96" fill="rgba(255,255,255,0.18)" />
      <circle cx="120" cy="810" r="120" fill="rgba(255,255,255,0.12)" />
      <rect x="76" y="92" width="568" height="776" rx="44" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.35)" />
      <text x="92" y="640" fill="white" font-size="70" font-family="Arial, sans-serif" font-weight="700">${label}</text>
      <text x="92" y="718" fill="rgba(255,255,255,0.82)" font-size="26" font-family="Arial, sans-serif">Envitefy Studio preset</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const BIRTHDAY_PRESET_LIBRARY: Record<
  BirthdayPresetAgeGroup,
  {
    label: string;
    female: BirthdayPresetSeed[];
    male: BirthdayPresetSeed[];
  }
> = {
  kids: {
    label: "Kids",
    female: [
      {
        id: "kids-princess-castle",
        name: "Princess Castle",
        description: "Royal pinks, crowns, and storybook sparkle.",
        icon: Sparkles,
        from: "#ff8cc6",
        to: "#ffcadf",
      },
      {
        id: "kids-unicorn-rainbow",
        name: "Unicorn Rainbow",
        description: "Pastel rainbows, clouds, and candy-color shine.",
        icon: PartyPopper,
        from: "#a855f7",
        to: "#f9a8d4",
      },
      {
        id: "kids-mermaid-lagoon",
        name: "Mermaid Lagoon",
        description: "Ocean sparkle, shells, and aqua birthday magic.",
        icon: Heart,
        from: "#06b6d4",
        to: "#67e8f9",
      },
      {
        id: "kids-fairy-garden",
        name: "Fairy Garden",
        description: "Butterflies, florals, and enchanted meadow charm.",
        icon: WandSparkles,
        from: "#22c55e",
        to: "#f9a8d4",
      },
      {
        id: "kids-kawaii-kitty",
        name: "Kawaii Kitty",
        description: "Cute bows, sweet pinks, and playful kitten vibes.",
        icon: Gift,
        from: "#fb7185",
        to: "#fbcfe8",
      },
      {
        id: "kids-ballet-sparkle",
        name: "Ballet Sparkle",
        description: "Soft blush tones with tutus and stage lights.",
        icon: Cake,
        from: "#f9a8d4",
        to: "#fde68a",
      },
    ],
    male: [
      {
        id: "kids-superhero-city",
        name: "Superhero City",
        description: "Comic-book energy with bold primaries and action bursts.",
        icon: Sparkles,
        from: "#2563eb",
        to: "#ef4444",
      },
      {
        id: "kids-dino-adventure",
        name: "Dino Adventure",
        description: "Jurassic greens, fossils, and roaring fun.",
        icon: PartyPopper,
        from: "#16a34a",
        to: "#84cc16",
      },
      {
        id: "kids-space-explorer",
        name: "Space Explorer",
        description: "Planets, rockets, and galaxy glow.",
        icon: WandSparkles,
        from: "#0f172a",
        to: "#3b82f6",
      },
      {
        id: "kids-monster-trucks",
        name: "Monster Trucks",
        description: "Mud splashes, ramps, and loud party energy.",
        icon: Gift,
        from: "#f97316",
        to: "#ef4444",
      },
      {
        id: "kids-soccer-stars",
        name: "Soccer Stars",
        description: "Stadium green, trophies, and all-star party action.",
        icon: Cake,
        from: "#16a34a",
        to: "#22c55e",
      },
      {
        id: "kids-construction-zone",
        name: "Construction Zone",
        description: "Bulldozers, caution stripes, and build-it fun.",
        icon: Heart,
        from: "#facc15",
        to: "#f97316",
      },
    ],
  },
  teens: {
    label: "Teen",
    female: [
      {
        id: "teens-coquette-pink",
        name: "Coquette Pink",
        description: "Bows, glossy pinks, and soft glam details.",
        icon: Sparkles,
        from: "#ec4899",
        to: "#fbcfe8",
      },
      {
        id: "teens-disco-cowgirl",
        name: "Disco Cowgirl",
        description: "Chrome sparkle, western flair, and party shine.",
        icon: PartyPopper,
        from: "#f59e0b",
        to: "#f472b6",
      },
      {
        id: "teens-pop-star-night",
        name: "Pop Star Night",
        description: "Stage lights, glam posters, and concert energy.",
        icon: WandSparkles,
        from: "#7c3aed",
        to: "#ec4899",
      },
      {
        id: "teens-spa-sleepover",
        name: "Spa Sleepover",
        description: "Silk robes, beauty bar details, and chill luxury.",
        icon: Gift,
        from: "#f9a8d4",
        to: "#c4b5fd",
      },
      {
        id: "teens-cherry-y2k",
        name: "Cherry Y2K",
        description: "Retro gloss, cherries, and throwback internet cool.",
        icon: Cake,
        from: "#ef4444",
        to: "#fb7185",
      },
      {
        id: "teens-beach-club",
        name: "Beach Club Glow",
        description: "Sunset tones, palm energy, and coastal sparkle.",
        icon: Heart,
        from: "#fb7185",
        to: "#f59e0b",
      },
    ],
    male: [
      {
        id: "teens-gaming-arena",
        name: "Gaming Arena",
        description: "Neon glow, leaderboard graphics, and tournament hype.",
        icon: Sparkles,
        from: "#111827",
        to: "#22c55e",
      },
      {
        id: "teens-sneaker-drop",
        name: "Sneaker Drop",
        description: "Streetwear styling with clean hype-release energy.",
        icon: PartyPopper,
        from: "#111827",
        to: "#e5e7eb",
      },
      {
        id: "teens-streetball-night",
        name: "Streetball Night",
        description: "Court lights, bold type, and all-star edge.",
        icon: WandSparkles,
        from: "#ea580c",
        to: "#1d4ed8",
      },
      {
        id: "teens-anime-battle",
        name: "Anime Battle",
        description: "High-contrast action panels with epic energy.",
        icon: Gift,
        from: "#7c3aed",
        to: "#2563eb",
      },
      {
        id: "teens-racing-league",
        name: "Racing League",
        description: "Checkered flags, speed lines, and track-night style.",
        icon: Cake,
        from: "#ef4444",
        to: "#111827",
      },
      {
        id: "teens-soccer-finals",
        name: "Soccer Finals",
        description: "Championship graphics with match-day intensity.",
        icon: Heart,
        from: "#16a34a",
        to: "#0f172a",
      },
    ],
  },
  "young-adults": {
    label: "Young Adult",
    female: [
      {
        id: "young-disco-glam",
        name: "Disco Glam",
        description: "Mirror-ball sparkle with late-night party energy.",
        icon: Sparkles,
        from: "#7c3aed",
        to: "#f472b6",
      },
      {
        id: "young-coastal-brunch",
        name: "Coastal Brunch",
        description: "Soft blue skies, citrus notes, and chic daylight vibes.",
        icon: PartyPopper,
        from: "#38bdf8",
        to: "#fde68a",
      },
      {
        id: "young-satin-champagne",
        name: "Satin Champagne",
        description: "Glossy neutrals, candlelight, and elevated dinner-party style.",
        icon: WandSparkles,
        from: "#e7cfa3",
        to: "#f8e7c8",
      },
      {
        id: "young-western-disco",
        name: "Western Disco",
        description: "Boots, shimmer, and polished rodeo-night glamour.",
        icon: Gift,
        from: "#f59e0b",
        to: "#ec4899",
      },
      {
        id: "young-garden-soiree",
        name: "Garden Soiree",
        description: "Florals, string lights, and romantic outdoor hosting.",
        icon: Cake,
        from: "#22c55e",
        to: "#f9a8d4",
      },
      {
        id: "young-sunset-rooftop",
        name: "Sunset Rooftop",
        description: "Skyline tones with stylish after-work birthday energy.",
        icon: Heart,
        from: "#fb7185",
        to: "#7c3aed",
      },
    ],
    male: [
      {
        id: "young-rooftop-neon",
        name: "Rooftop Neon",
        description: "City-night glow with modern lounge styling.",
        icon: Sparkles,
        from: "#111827",
        to: "#3b82f6",
      },
      {
        id: "young-retro-arcade",
        name: "Retro Arcade",
        description: "Pixel graphics, neon cabinets, and playful nostalgia.",
        icon: PartyPopper,
        from: "#0f172a",
        to: "#a855f7",
      },
      {
        id: "young-casino-royale",
        name: "Casino Royale",
        description: "Black, red, and gold with sleek nightlife appeal.",
        icon: WandSparkles,
        from: "#111827",
        to: "#dc2626",
      },
      {
        id: "young-formula-night",
        name: "Formula Night",
        description: "Fast-track styling with premium racing cues.",
        icon: Gift,
        from: "#dc2626",
        to: "#111827",
      },
      {
        id: "young-all-white-party",
        name: "All-White Party",
        description: "Minimal luxe with crisp monochrome celebration energy.",
        icon: Cake,
        from: "#d1d5db",
        to: "#ffffff",
      },
      {
        id: "young-yacht-club",
        name: "Yacht Club",
        description: "Navy, cream, and polished resort-party vibes.",
        icon: Heart,
        from: "#1d4ed8",
        to: "#f8fafc",
      },
    ],
  },
  adults: {
    label: "Adult",
    female: [
      {
        id: "adults-amalfi-citrus",
        name: "Amalfi Citrus",
        description: "Lemon tones, Mediterranean polish, and summer dinner charm.",
        icon: Sparkles,
        from: "#facc15",
        to: "#60a5fa",
      },
      {
        id: "adults-rose-gold-dinner",
        name: "Rose Gold Dinner",
        description: "Warm metallics with elegant tablescape energy.",
        icon: PartyPopper,
        from: "#fda4af",
        to: "#f5d0fe",
      },
      {
        id: "adults-black-tie-glam",
        name: "Black Tie Glam",
        description: "Sharp evening styling with a luxe editorial edge.",
        icon: WandSparkles,
        from: "#111827",
        to: "#f59e0b",
      },
      {
        id: "adults-boho-sunset",
        name: "Boho Sunset",
        description: "Terracotta tones, pampas details, and warm celebration light.",
        icon: Gift,
        from: "#ea580c",
        to: "#f59e0b",
      },
      {
        id: "adults-garden-party",
        name: "Garden Party",
        description: "Fresh florals, greenery, and polished outdoor hosting.",
        icon: Cake,
        from: "#22c55e",
        to: "#e9d5ff",
      },
      {
        id: "adults-tropical-luxe",
        name: "Tropical Luxe",
        description: "Palm leaves, resort details, and bold celebratory color.",
        icon: Heart,
        from: "#0f766e",
        to: "#f97316",
      },
    ],
    male: [
      {
        id: "adults-whiskey-lounge",
        name: "Whiskey Lounge",
        description: "Moody amber lighting with classic lounge depth.",
        icon: Sparkles,
        from: "#7c2d12",
        to: "#111827",
      },
      {
        id: "adults-cigar-cards",
        name: "Cigar & Cards",
        description: "Dark wood, card-table styling, and old-school cool.",
        icon: PartyPopper,
        from: "#1f2937",
        to: "#7c2d12",
      },
      {
        id: "adults-backyard-bbq",
        name: "Backyard BBQ",
        description: "Relaxed cookout energy with bold Americana flavor.",
        icon: WandSparkles,
        from: "#dc2626",
        to: "#f59e0b",
      },
      {
        id: "adults-golf-classic",
        name: "Golf Classic",
        description: "Country-club greens with refined daytime polish.",
        icon: Gift,
        from: "#166534",
        to: "#65a30d",
      },
      {
        id: "adults-black-tie-club",
        name: "Black Tie Club",
        description: "Formal monochrome styling with understated luxury.",
        icon: Cake,
        from: "#111827",
        to: "#4b5563",
      },
      {
        id: "adults-vintage-vinyl",
        name: "Vintage Vinyl",
        description: "Record-bar warmth with retro music-night personality.",
        icon: Heart,
        from: "#7c3aed",
        to: "#f97316",
      },
    ],
  },
  milestones: {
    label: "Milestone",
    female: [
      {
        id: "milestones-golden-gala",
        name: "Golden Gala",
        description: "Big-night glamour designed for a statement birthday.",
        icon: Sparkles,
        from: "#ca8a04",
        to: "#fef08a",
      },
      {
        id: "milestones-diamond-dinner",
        name: "Diamond Dinner",
        description: "Crystal shine, candlelight, and luxe celebration polish.",
        icon: PartyPopper,
        from: "#cbd5e1",
        to: "#f8fafc",
      },
      {
        id: "milestones-parisian-chic",
        name: "Parisian Chic",
        description: "Soft black-and-cream styling with fashion-week elegance.",
        icon: WandSparkles,
        from: "#111827",
        to: "#f5e6c8",
      },
      {
        id: "milestones-bloom-brunch",
        name: "Bloom Brunch",
        description: "Fresh florals and champagne daylight celebration energy.",
        icon: Gift,
        from: "#f9a8d4",
        to: "#fde68a",
      },
      {
        id: "milestones-palm-springs",
        name: "Palm Springs Luxe",
        description: "Resort color, playful elegance, and modern celebration cool.",
        icon: Cake,
        from: "#fb7185",
        to: "#38bdf8",
      },
      {
        id: "milestones-pearl-soiree",
        name: "Pearl Soiree",
        description: "Soft ivory layers with timeless milestone sophistication.",
        icon: Heart,
        from: "#f8fafc",
        to: "#d4d4d8",
      },
    ],
    male: [
      {
        id: "milestones-great-gatsby",
        name: "Great Gatsby",
        description: "Art deco gold, black lacquer, and major-birthday drama.",
        icon: Sparkles,
        from: "#111827",
        to: "#ca8a04",
      },
      {
        id: "milestones-bourbon-reserve",
        name: "Bourbon Reserve",
        description: "Warm barrel tones with elevated speakeasy mood.",
        icon: PartyPopper,
        from: "#7c2d12",
        to: "#f59e0b",
      },
      {
        id: "milestones-casino-black-gold",
        name: "Casino Black Gold",
        description: "High-contrast luxury with celebratory nightlife edge.",
        icon: WandSparkles,
        from: "#111827",
        to: "#facc15",
      },
      {
        id: "milestones-yacht-dinner",
        name: "Yacht Dinner",
        description: "Navy-and-ivory styling with polished waterfront appeal.",
        icon: Gift,
        from: "#1d4ed8",
        to: "#f8fafc",
      },
      {
        id: "milestones-golf-scotch",
        name: "Golf & Scotch",
        description: "Classic club styling for a relaxed upscale milestone.",
        icon: Cake,
        from: "#166534",
        to: "#92400e",
      },
      {
        id: "milestones-havana-night",
        name: "Havana Night",
        description: "Rich tropical tones with smooth evening energy.",
        icon: Heart,
        from: "#b45309",
        to: "#0f766e",
      },
    ],
  },
};

const EMPTY_POSITIONS = {
  rsvp: { x: 0, y: 0 },
  location: { x: 0, y: 0 },
  share: { x: 0, y: 0 },
  calendar: { x: 0, y: 0 },
  registry: { x: 0, y: 0 },
  details: { x: 0, y: 0 },
};

const STUDIO_LIBRARY_LIMIT = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown): string | null {
  const next = readString(value);
  return next || null;
}

function isInviteCategory(value: unknown): value is InviteCategory {
  return (
    value === "Birthday" ||
    value === "Field Trip/Day" ||
    value === "Bridal Shower" ||
    value === "Wedding" ||
    value === "Housewarming" ||
    value === "Baby Shower" ||
    value === "Anniversary" ||
    value === "Custom Invite"
  );
}

function sanitizePositions(value: unknown): MediaItem["positions"] {
  if (!isRecord(value)) return { ...EMPTY_POSITIONS };

  const sanitizePoint = (point: unknown) => {
    if (!isRecord(point)) return { x: 0, y: 0 };
    const x = typeof point.x === "number" && Number.isFinite(point.x) ? point.x : 0;
    const y = typeof point.y === "number" && Number.isFinite(point.y) ? point.y : 0;
    return { x, y };
  };

  return {
    rsvp: sanitizePoint(value.rsvp),
    location: sanitizePoint(value.location),
    share: sanitizePoint(value.share),
    calendar: sanitizePoint(value.calendar),
    registry: sanitizePoint(value.registry),
    details: sanitizePoint(value.details),
  };
}

function sanitizeEventDetails(value: unknown): EventDetails {
  const details: any = createInitialDetails();
  if (!isRecord(value)) return details;

  const stringKeys: Array<keyof EventDetails> = [
    "eventTitle",
    "eventDate",
    "startTime",
    "endTime",
    "venueName",
    "location",
    "rsvpName",
    "rsvpContact",
    "rsvpDeadline",
    "message",
    "specialInstructions",
    "colors",
    "style",
    "visualPreferences",
    "name",
    "age",
    "theme",
    "invitedWho",
    "dressCode",
    "giftNote",
    "activityNote",
    "coupleNames",
    "ceremonyDate",
    "ceremonyTime",
    "receptionTime",
    "ceremonyVenue",
    "receptionVenue",
    "registryLink",
    "weddingWebsite",
    "accommodationInfo",
    "plusOnePolicy",
    "transportationInfo",
    "honoreeNames",
    "babyName",
    "hostedBy",
    "bringABookNote",
    "giftPreferenceNote",
    "gradeLevel",
    "teacherName",
    "costPerStudent",
    "lunchInfo",
    "transportationType",
    "emergencyContact",
    "whatToBring",
    "mainPerson",
    "occasion",
    "audience",
    "calloutText",
    "optionalLink",
    "customLabel1",
    "customValue1",
    "customLabel2",
    "customValue2",
  ];

  for (const key of stringKeys) {
    details[key] = readString(value[key]);
  }

  const category = readString(value.category);
  details.category = isInviteCategory(category) ? category : details.category;
  details.orientation = value.orientation === "landscape" ? "landscape" : "portrait";
  details.gender =
    value.gender === "Boy" || value.gender === "Girl" || value.gender === "Neutral"
      ? value.gender
      : "Neutral";
  details.isSurprise =
    typeof value.isSurprise === "boolean" ? value.isSurprise : details.isSurprise;
  details.isMilestone =
    typeof value.isMilestone === "boolean" ? value.isMilestone : details.isMilestone;
  details.adultsOnly =
    typeof value.adultsOnly === "boolean" ? value.adultsOnly : details.adultsOnly;
  details.diaperRaffle =
    typeof value.diaperRaffle === "boolean" ? value.diaperRaffle : details.diaperRaffle;
  details.bookInsteadOfCard =
    typeof value.bookInsteadOfCard === "boolean"
      ? value.bookInsteadOfCard
      : details.bookInsteadOfCard;
  details.chaperonesNeeded =
    typeof value.chaperonesNeeded === "boolean" ? value.chaperonesNeeded : details.chaperonesNeeded;
  details.permissionSlipRequired =
    typeof value.permissionSlipRequired === "boolean"
      ? value.permissionSlipRequired
      : details.permissionSlipRequired;

  return details;
}

function sanitizeGenerationError(value: unknown): StudioGenerationError | undefined {
  if (!isRecord(value)) return undefined;
  return {
    code: readString(value.code) || "unknown_error",
    message: readString(value.message) || "Studio generation failed.",
    retryable: typeof value.retryable === "boolean" ? value.retryable : true,
    provider: "gemini",
    status: typeof value.status === "number" ? value.status : undefined,
  };
}

function sanitizeInvitationData(
  value: unknown,
  fallbackDetails: EventDetails,
): InvitationData | undefined {
  if (!isRecord(value)) return undefined;

  const theme = isRecord(value.theme) ? value.theme : null;
  const interactiveMetadata = isRecord(value.interactiveMetadata)
    ? value.interactiveMetadata
    : null;
  const eventDetails = sanitizeEventDetails(value.eventDetails);
  const defaultTheme = getThemeColors(fallbackDetails);

  return {
    title: readString(value.title) || getDisplayTitle(fallbackDetails),
    subtitle:
      readString(value.subtitle) || pickFirst(fallbackDetails.theme, fallbackDetails.category),
    description:
      readString(value.description) ||
      buildDescription(fallbackDetails) ||
      "Celebrate together with a beautifully designed invitation.",
    scheduleLine:
      readString(value.scheduleLine) ||
      `${formatDate(fallbackDetails.eventDate)}${fallbackDetails.startTime ? ` at ${fallbackDetails.startTime}` : ""}`,
    locationLine:
      readString(value.locationLine) ||
      pickFirst(fallbackDetails.venueName, fallbackDetails.location, "Location TBD"),
    callToAction:
      readString(value.callToAction) ||
      pickFirst(fallbackDetails.calloutText, "Tap for details and RSVP."),
    socialCaption:
      readString(value.socialCaption) ||
      readString(value.description) ||
      buildDescription(fallbackDetails),
    theme: {
      primaryColor: readString(theme?.primaryColor) || defaultTheme.primaryColor,
      secondaryColor: readString(theme?.secondaryColor) || defaultTheme.primaryColor,
      accentColor: readString(theme?.accentColor) || defaultTheme.accentColor,
      themeStyle: readString(theme?.themeStyle) || "editorial gradient",
    },
    interactiveMetadata: {
      rsvpMessage:
        readString(interactiveMetadata?.rsvpMessage) || "Reply to let the host know you're coming.",
      funFacts: Array.isArray(interactiveMetadata?.funFacts)
        ? interactiveMetadata.funFacts.map(readString).filter(Boolean).slice(0, 5)
        : [],
      ctaLabel:
        readString(interactiveMetadata?.ctaLabel) ||
        readString(value.callToAction) ||
        "Tap for details and RSVP.",
      shareNote:
        readString(interactiveMetadata?.shareNote) ||
        readString(value.socialCaption) ||
        readString(value.description) ||
        "Share this live card with your guests.",
    },
    eventDetails,
  };
}

function sanitizeMediaItem(value: unknown): MediaItem | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const type = value.type === "image" || value.type === "page" ? value.type : null;
  if (!id || !type) return null;

  const details = sanitizeEventDetails(value.details);
  return {
    id,
    type,
    url: readNullableString(value.url) || undefined,
    data: sanitizeInvitationData(value.data, details),
    errorMessage: readNullableString(value.errorMessage) || undefined,
    publishedEventId: readNullableString(value.publishedEventId) || undefined,
    sharePath: readNullableString(value.sharePath) || undefined,
    theme: readString(value.theme) || getDisplayTitle(details),
    status:
      value.status === "ready" || value.status === "loading" || value.status === "error"
        ? value.status
        : "error",
    details,
    createdAt: readString(value.createdAt) || new Date().toISOString(),
    positions: sanitizePositions(value.positions),
  };
}

function sanitizeMediaItems(value: unknown): MediaItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(sanitizeMediaItem)
    .filter((item): item is MediaItem => Boolean(item))
    .slice(0, STUDIO_LIBRARY_LIMIT);
}

function sanitizeStudioGenerateResponse(value: unknown): StudioGenerateApiResponse | null {
  if (!isRecord(value)) return null;

  const mode =
    value.mode === "text" || value.mode === "image" || value.mode === "both" ? value.mode : "both";
  const liveCard = normalizeLiveCardMetadata(value.liveCard);
  const invitation = normalizeInvitationText(value.invitation);
  const imageDataUrl =
    typeof value.imageDataUrl === "string" && value.imageDataUrl.startsWith("data:image/")
      ? value.imageDataUrl
      : null;
  const warnings = Array.isArray(value.warnings)
    ? value.warnings.map(readString).filter(Boolean).slice(0, 8)
    : [];
  const errors = isRecord(value.errors)
    ? (() => {
        const nextErrors: NonNullable<StudioGenerateApiResponse["errors"]> = {};
        const textError = sanitizeGenerationError(value.errors.text);
        const imageError = sanitizeGenerationError(value.errors.image);
        if (textError) nextErrors.text = textError;
        if (imageError) nextErrors.image = imageError;
        return Object.keys(nextErrors).length > 0 ? nextErrors : undefined;
      })()
    : undefined;

  const ok = value.ok === true;
  if (!ok) {
    if (!errors) return null;
    return {
      ok: false,
      mode,
      liveCard: null,
      invitation: null,
      imageDataUrl: null,
      warnings,
      errors,
    };
  }

  if (!liveCard && !invitation && !imageDataUrl) return null;

  return {
    ok: true,
    mode,
    liveCard,
    invitation: invitation || liveCard?.invitation || null,
    imageDataUrl,
    warnings,
    errors,
  };
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

function formatDate(dateStr: string) {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  return `${month}.${day}.${year}`;
}

function clean(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function pickFirst(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = clean(value);
    if (trimmed) return trimmed;
  }
  return "";
}

function getDisplayTitle(details: EventDetails) {
  if (details.category === "Birthday") {
    return pickFirst(
      details.eventTitle,
      details.name ? `${details.name}'s Birthday` : "",
      "Birthday Celebration",
    );
  }
  if (details.category === "Wedding") {
    return pickFirst(
      details.eventTitle,
      details.coupleNames ? `${details.coupleNames} Wedding` : "",
      "Wedding Celebration",
    );
  }
  if (details.category === "Baby Shower") {
    return pickFirst(
      details.eventTitle,
      details.honoreeNames ? `${details.honoreeNames} Baby Shower` : "",
      "Baby Shower",
    );
  }
  if (details.category === "Anniversary") {
    return pickFirst(
      details.eventTitle,
      details.coupleNames ? `${details.coupleNames} Anniversary` : "",
      "Anniversary Celebration",
    );
  }
  if (details.category === "Bridal Shower") {
    return pickFirst(
      details.eventTitle,
      details.honoreeNames ? `${details.honoreeNames} Bridal Shower` : "",
      "Bridal Shower",
    );
  }
  if (details.category === "Housewarming") {
    return pickFirst(
      details.eventTitle,
      details.honoreeNames ? `${details.honoreeNames} Housewarming` : "",
      "Housewarming",
    );
  }
  return pickFirst(details.eventTitle, details.occasion, `${details.category} Event`);
}

function getHonoreeName(details: EventDetails) {
  return pickFirst(
    details.name,
    details.coupleNames,
    details.honoreeNames,
    details.mainPerson,
    details.eventTitle,
  );
}

function getRegistryText(details: EventDetails) {
  return pickFirst(
    details.giftPreferenceNote,
    details.giftNote,
    details.bringABookNote,
    details.registryLink ? "Registry available for guests." : "",
    "Your presence is the best gift.",
  );
}

function hasRegistryContent(details: EventDetails) {
  return Boolean(
    clean(details.registryLink) ||
      clean(details.giftPreferenceNote) ||
      clean(details.giftNote) ||
      clean(details.bringABookNote),
  );
}

function getFallbackThumbnail(details: EventDetails) {
  const preset = getPresetsForDetails(details).find((item) => item.name === details.theme);
  if (preset) return preset.thumbnail;
  return svgThumbnail(getDisplayTitle(details), "#111827", "#7c3aed");
}

function parseAgeValue(ageValue: string): number | null {
  const match = readString(ageValue).match(/\d{1,3}/);
  if (!match) return null;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

const COMMON_GIRL_BIRTHDAY_NAMES = new Set([
  "ava",
  "bella",
  "charlotte",
  "chloe",
  "ella",
  "emma",
  "eva",
  "grace",
  "harper",
  "isabella",
  "lara",
  "layla",
  "lily",
  "lucy",
  "mia",
  "olivia",
  "sophia",
  "zoe",
]);

const COMMON_BOY_BIRTHDAY_NAMES = new Set([
  "alex",
  "ben",
  "charlie",
  "daniel",
  "ethan",
  "henry",
  "jack",
  "james",
  "leo",
  "liam",
  "logan",
  "lucas",
  "mason",
  "noah",
  "oliver",
  "owen",
  "theo",
  "wyatt",
]);

function normalizeBirthdayFirstName(nameValue: string): string {
  const [firstName = ""] = readString(nameValue).split(/[\s-]+/);
  return firstName.replace(/[^a-z]/gi, "").toLowerCase();
}

function inferBirthdayGenderFromName(nameValue: string): EventDetails["gender"] | null {
  const normalized = normalizeBirthdayFirstName(nameValue);
  if (!normalized) return null;
  if (COMMON_GIRL_BIRTHDAY_NAMES.has(normalized)) return "Girl";
  if (COMMON_BOY_BIRTHDAY_NAMES.has(normalized)) return "Boy";
  if (/(ella|emma|enna|ette|ia|ina|isha|la|lina|lyn|lynn|ria|ssa|yah|yn)$/.test(normalized)) {
    return "Girl";
  }
  if (/(son|ton|den|iel|ias|ard|ert|rick|aldo|enzo|ian|ias|o|on)$/.test(normalized)) {
    return "Boy";
  }
  return null;
}

function getBirthdayPresetAgeGroup(ageValue: string): BirthdayPresetAgeGroup {
  const age = parseAgeValue(ageValue);
  if (age == null) return "kids";
  if (age <= 12) return "kids";
  if (age <= 17) return "teens";
  if (age <= 29) return "young-adults";
  if (age <= 49) return "adults";
  return "milestones";
}

function buildBirthdayPresets(ageValue: string): {
  label: string;
  female: Preset[];
  male: Preset[];
} {
  const ageGroup = getBirthdayPresetAgeGroup(ageValue);
  const library = BIRTHDAY_PRESET_LIBRARY[ageGroup];
  const buildPresets = (audience: BirthdayPresetAudience, items: BirthdayPresetSeed[]): Preset[] =>
    items.map((item) => ({
      id: `birthday-${ageGroup}-${audience}-${item.id}`,
      category: "Birthday",
      name: item.name,
      description: item.description,
      icon: item.icon,
      thumbnail: svgThumbnail(item.name, item.from, item.to),
    }));

  return {
    label: library.label,
    female: buildPresets("female", library.female),
    male: buildPresets("male", library.male),
  };
}

const BIRTHDAY_PRESET_AGE_GROUPS: BirthdayPresetAgeGroup[] = [
  "kids",
  "teens",
  "young-adults",
  "adults",
  "milestones",
];

function getBirthdayPresetAgeGroupPriority(ageGroup: BirthdayPresetAgeGroup) {
  const activeIndex = BIRTHDAY_PRESET_AGE_GROUPS.indexOf(ageGroup);
  return [...BIRTHDAY_PRESET_AGE_GROUPS].sort((left, right) => {
    const leftDistance = Math.abs(BIRTHDAY_PRESET_AGE_GROUPS.indexOf(left) - activeIndex);
    const rightDistance = Math.abs(BIRTHDAY_PRESET_AGE_GROUPS.indexOf(right) - activeIndex);
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    return BIRTHDAY_PRESET_AGE_GROUPS.indexOf(left) - BIRTHDAY_PRESET_AGE_GROUPS.indexOf(right);
  });
}

function buildBirthdayAudiencePresets(
  ageValue: string,
  audience: BirthdayPresetAudience,
  limit = 12,
): Preset[] {
  const ageGroup = getBirthdayPresetAgeGroup(ageValue);
  const prioritizedAgeGroups = getBirthdayPresetAgeGroupPriority(ageGroup);
  const presets: Preset[] = [];

  for (const nextAgeGroup of prioritizedAgeGroups) {
    const groupPresets = buildBirthdayPresetsForAgeGroup(nextAgeGroup)[audience];
    presets.push(...groupPresets);
    if (presets.length >= limit) break;
  }

  return presets.slice(0, limit);
}

function buildBirthdayPresetsForAgeGroup(ageGroup: BirthdayPresetAgeGroup): {
  label: string;
  female: Preset[];
  male: Preset[];
} {
  const library = BIRTHDAY_PRESET_LIBRARY[ageGroup];
  const buildPresets = (audience: BirthdayPresetAudience, items: BirthdayPresetSeed[]): Preset[] =>
    items.map((item) => ({
      id: `birthday-${ageGroup}-${audience}-${item.id}`,
      category: "Birthday",
      name: item.name,
      description: item.description,
      icon: item.icon,
      thumbnail: svgThumbnail(item.name, item.from, item.to),
    }));

  return {
    label: library.label,
    female: buildPresets("female", library.female),
    male: buildPresets("male", library.male),
  };
}
function getBirthdayPresetAudience(details: EventDetails): BirthdayPresetAudience | null {
  const inferredGender = inferBirthdayGenderFromName(details.name);
  if (inferredGender === "Girl") return "female";
  if (inferredGender === "Boy") return "male";
  return null;
}

function getPresetsForDetails(details: EventDetails): Preset[] {
  if (details.category === "Birthday") {
    const birthdayPresets = buildBirthdayPresets(details.age);
    const audience = getBirthdayPresetAudience(details);
    return audience
      ? buildBirthdayAudiencePresets(details.age, audience, 12)
      : [...birthdayPresets.female, ...birthdayPresets.male];
  }
  return PRESETS.filter((preset) => preset.category === details.category);
}

function getThemeColors(details: EventDetails) {
  if (details.category === "Birthday") {
    return { primaryColor: "#9333ea", accentColor: "#ec4899" };
  }
  if (details.category === "Wedding") {
    return { primaryColor: "#111827", accentColor: "#f59e0b" };
  }
  if (details.category === "Baby Shower") {
    return { primaryColor: "#60a5fa", accentColor: "#f472b6" };
  }
  return { primaryColor: "#111827", accentColor: "#7c3aed" };
}

function createInitialDetails(): EventDetails {
  return {
    category: "Birthday",
    eventTitle: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    venueName: "",
    location: "",
    rsvpName: "",
    rsvpContact: "",
    rsvpDeadline: "",
    message: "",
    specialInstructions: "",
    orientation: "portrait",
    colors: "",
    style: "",
    visualPreferences: "",
    name: "",
    age: "",
    theme: "",
    invitedWho: "",
    dressCode: "",
    giftNote: "",
    isSurprise: false,
    isMilestone: false,
    activityNote: "",
    coupleNames: "",
    ceremonyDate: "",
    ceremonyTime: "",
    receptionTime: "",
    ceremonyVenue: "",
    receptionVenue: "",
    registryLink: "",
    weddingWebsite: "",
    adultsOnly: false,
    accommodationInfo: "",
    plusOnePolicy: "",
    transportationInfo: "",
    honoreeNames: "",
    babyName: "",
    gender: "Neutral",
    hostedBy: "",
    diaperRaffle: false,
    bookInsteadOfCard: false,
    bringABookNote: "",
    giftPreferenceNote: "",
    gradeLevel: "",
    teacherName: "",
    chaperonesNeeded: false,
    costPerStudent: "",
    permissionSlipRequired: false,
    lunchInfo: "",
    transportationType: "",
    emergencyContact: "",
    whatToBring: "",
    mainPerson: "",
    occasion: "",
    audience: "",
    calloutText: "",
    optionalLink: "",
    customLabel1: "",
    customValue1: "",
    customLabel2: "",
    customValue2: "",
  };
}

function buildDescription(details: EventDetails) {
  const parts = [
    clean(details.message),
    clean(details.specialInstructions),
    clean(details.activityNote),
    clean(details.calloutText),
  ].filter(Boolean);
  return parts.join(" ").trim();
}

function buildLinks(details: EventDetails) {
  return [
    details.registryLink ? { label: "Registry", url: details.registryLink } : null,
    details.weddingWebsite ? { label: "Website", url: details.weddingWebsite } : null,
    details.optionalLink ? { label: "Event Link", url: details.optionalLink } : null,
  ].filter((value): value is { label: string; url: string } => Boolean(value));
}

function buildStudioVisualDirection(details: EventDetails) {
  const customIdea = clean(details.theme);
  const extraPreferences = clean(details.visualPreferences);
  const combinedDirection = [customIdea, extraPreferences].filter(Boolean).join(". ");
  const instructions: string[] = [];

  if (combinedDirection) {
    instructions.push(
      `Highest-priority visual direction from the user: ${combinedDirection}. Follow this literally and let it override generic preset, category, or celebration styling.`,
    );
  }

  if (
    /\b(realistic|photorealistic|photo[- ]?realistic|lifelike|naturalistic|real life)\b/i.test(
      combinedDirection,
    )
  ) {
    instructions.push(
      "Render subjects realistically with natural anatomy, realistic fur or skin texture, believable lighting, and real-world proportions.",
    );
    instructions.push(
      "Do not turn realistic subjects into cartoons, mascots, plush characters, anime, or anthropomorphic figures unless the user explicitly asks for that.",
    );
  }

  if (/\bcats?\b/i.test(combinedDirection)) {
    instructions.push(
      "If cats appear, they should look like real cats unless the user explicitly requests a stylized or cartoon treatment.",
    );
  }

  return instructions.join(" ");
}

function buildStudioRequest(
  details: EventDetails,
  mode: StudioGenerateMode,
  editPrompt?: string,
  sourceImageDataUrl?: string,
): StudioGenerateRequest {
  const refinement = clean(editPrompt);
  const baseDescription = buildDescription(details);
  const visualDirection = buildStudioVisualDirection(details);
  const studioGuardrails =
    "Preserve exact spelling from the event details. Double-check visible words. Keep the lower button area visually clear and avoid placing important copy near the bottom of the card.";
  return {
    mode,
    event: {
      title: getDisplayTitle(details),
      occasion: pickFirst(details.occasion, details.category),
      hostName:
        pickFirst(details.rsvpName, details.hostedBy, details.teacherName, details.mainPerson) ||
        null,
      honoreeName: getHonoreeName(details) || null,
      description:
        [baseDescription, refinement ? `Edit request: ${refinement}` : ""]
          .filter(Boolean)
          .join(" ") || null,
      date: clean(details.eventDate) || null,
      startTime: clean(details.startTime) || null,
      endTime: clean(details.endTime) || null,
      timezone:
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago"
          : "America/Chicago",
      venueName:
        pickFirst(details.venueName, details.ceremonyVenue, details.receptionVenue) || null,
      venueAddress: clean(details.location) || null,
      dressCode: clean(details.dressCode) || null,
      rsvpBy: clean(details.rsvpDeadline) || null,
      rsvpContact: clean(details.rsvpContact) || null,
      registryNote: getRegistryText(details) || null,
      links: buildLinks(details),
    },
    guidance: {
      tone:
        pickFirst(
          details.style,
          details.category === "Birthday" ? "Playful and polished" : "Warm and elevated",
        ) || null,
      style: [visualDirection, refinement, studioGuardrails].filter(Boolean).join(". ") || null,
      audience: pickFirst(details.invitedWho, details.audience, "Guests") || null,
      colorPalette: clean(details.colors) || null,
      includeEmoji: true,
    },
    imageEdit: clean(sourceImageDataUrl)
      ? { sourceImageDataUrl: clean(sourceImageDataUrl) }
      : undefined,
  };
}

async function requestStudioGeneration(
  details: EventDetails,
  mode: StudioGenerateMode,
  editPrompt?: string,
  sourceImageDataUrl?: string,
) {
  const response = await fetch("/api/studio/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildStudioRequest(details, mode, editPrompt, sourceImageDataUrl)),
  });

  let rawData: unknown = null;
  try {
    rawData = await response.json();
  } catch {
    rawData = null;
  }

  const data = sanitizeStudioGenerateResponse(rawData);

  if (!response.ok || !data || !data.ok) {
    const errorMessage =
      data?.errors?.image?.message ||
      data?.errors?.text?.message ||
      (isRecord(rawData) && typeof rawData.message === "string" ? rawData.message : "") ||
      `Studio generation failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  return data;
}

function buildInvitationData(
  details: EventDetails,
  response: StudioGenerateApiResponse,
): InvitationData {
  const liveCard = response.liveCard;
  const invitation = liveCard?.invitation || response.invitation;
  const fallbackTheme = getThemeColors(details);
  const title = liveCard?.title || invitation?.title || getDisplayTitle(details);
  const subtitle =
    invitation?.subtitle || buildDescription(details) || pickFirst(details.theme, details.category);
  const scheduleLine =
    invitation?.scheduleLine ||
    `${formatDate(details.eventDate)}${details.startTime ? ` at ${details.startTime}` : ""}`;
  const locationLine =
    invitation?.locationLine || pickFirst(details.venueName, details.location, "Location TBD");
  const callToAction =
    liveCard?.interactiveMetadata.ctaLabel ||
    invitation?.callToAction ||
    pickFirst(details.calloutText, "Tap for details and RSVP.");
  const description =
    liveCard?.description ||
    invitation?.openingLine ||
    buildDescription(details) ||
    "Celebrate together with a beautifully designed invitation.";

  return {
    title,
    subtitle,
    description,
    scheduleLine,
    locationLine,
    callToAction,
    socialCaption:
      liveCard?.interactiveMetadata.shareNote || invitation?.socialCaption || description,
    theme: {
      primaryColor: liveCard?.palette.primary || fallbackTheme.primaryColor,
      secondaryColor: liveCard?.palette.secondary || fallbackTheme.primaryColor,
      accentColor: liveCard?.palette.accent || fallbackTheme.accentColor,
      themeStyle: liveCard?.themeStyle || "editorial gradient",
    },
    interactiveMetadata: {
      rsvpMessage:
        liveCard?.interactiveMetadata.rsvpMessage || "Reply to let the host know you're coming.",
      funFacts: liveCard?.interactiveMetadata.funFacts || [],
      ctaLabel: liveCard?.interactiveMetadata.ctaLabel || callToAction,
      shareNote:
        liveCard?.interactiveMetadata.shareNote || invitation?.socialCaption || description,
    },
    eventDetails: details,
  };
}

function normalizeStudioEventCategory(category: InviteCategory): string {
  switch (category) {
    case "Birthday":
      return "birthdays";
    case "Wedding":
      return "weddings";
    case "Baby Shower":
      return "baby showers";
    case "Bridal Shower":
    case "Housewarming":
    case "Anniversary":
      return "party";
    default:
      return "special events";
  }
}

function toIsoFromLocalDateTime(dateValue: string, timeValue?: string): string | undefined {
  const date = readString(dateValue);
  if (!date) return undefined;

  const normalizedTime = readString(timeValue);
  if (!normalizedTime) return date;
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(normalizedTime)) return undefined;
  return `${date}T${normalizedTime.length === 5 ? `${normalizedTime}:00` : normalizedTime}`;
}

function getStudioEventDate(details: EventDetails): string {
  return readString(details.eventDate) || readString(details.ceremonyDate);
}

function getStudioEventStartTime(details: EventDetails): string {
  return readString(details.startTime) || readString(details.ceremonyTime);
}

function getStudioEventEndTime(details: EventDetails): string {
  return readString(details.endTime) || readString(details.receptionTime);
}

function normalizeStudioExternalUrl(value: string): string {
  const trimmed = readString(value);
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function buildStudioRsvpLine(details: EventDetails): string | undefined {
  const hostName = readString(details.rsvpName);
  const hostContact = readString(details.rsvpContact);
  const deadline = formatDate(details.rsvpDeadline);
  const contactLine = [hostName, hostContact].filter(Boolean).join(" - ");
  if (!contactLine && !deadline) return undefined;
  if (deadline && contactLine) {
    return `RSVP by ${deadline}: ${contactLine}`;
  }
  return deadline ? `RSVP by ${deadline}` : `RSVP: ${contactLine}`;
}

function getStudioShareTitle(item: MediaItem): string {
  return item.data?.title || getDisplayTitle(item.details);
}

function buildStudioPublishPayload(item: MediaItem, imageUrl: string | null) {
  const details = item.details;
  const title = getStudioShareTitle(item);
  const startISO = toIsoFromLocalDateTime(
    getStudioEventDate(details),
    getStudioEventStartTime(details),
  );
  const endISO = toIsoFromLocalDateTime(
    getStudioEventDate(details),
    getStudioEventEndTime(details),
  );
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const category = normalizeStudioEventCategory(details.category);
  const descriptionParts = [
    item.data?.description,
    readString(details.message),
    readString(details.specialInstructions),
    readString(details.optionalLink)
      ? `More info: ${normalizeStudioExternalUrl(details.optionalLink)}`
      : "",
    readString(details.weddingWebsite)
      ? `Wedding website: ${normalizeStudioExternalUrl(details.weddingWebsite)}`
      : "",
  ].filter(Boolean);
  const registries = [
    readString(details.registryLink)
      ? { label: "Registry", url: normalizeStudioExternalUrl(details.registryLink) }
      : null,
    readString(details.weddingWebsite)
      ? { label: "Wedding Website", url: normalizeStudioExternalUrl(details.weddingWebsite) }
      : null,
    readString(details.optionalLink)
      ? { label: "More Info", url: normalizeStudioExternalUrl(details.optionalLink) }
      : null,
  ]
    .filter(Boolean)
    .map((entry) => entry as { label: string; url: string });
  const rsvpLine = buildStudioRsvpLine(details);
  const venue =
    readString(details.venueName) ||
    readString(details.ceremonyVenue) ||
    readString(details.receptionVenue);
  const location = readString(details.location) || venue || undefined;

  return {
    title,
    data: {
      title,
      description:
        descriptionParts.join("\n\n") || "Celebrate together with a beautifully designed invite.",
      startISO,
      startAt: startISO,
      start: startISO,
      endISO,
      endAt: endISO,
      end: endISO,
      timezone,
      category,
      status: "published",
      ownership: "created",
      createdVia: "studio",
      venue: venue || undefined,
      location,
      rsvp: rsvpLine,
      rsvpEnabled: Boolean(rsvpLine),
      rsvpDeadline: readString(details.rsvpDeadline) || undefined,
      thumbnail: imageUrl || undefined,
      heroImage: imageUrl || undefined,
      customHeroImage: imageUrl || undefined,
      registries: registries.length > 0 ? registries : undefined,
      themeStyle: item.data?.theme.themeStyle || undefined,
      studioCard: {
        mediaType: item.type,
        imageUrl: imageUrl || undefined,
        invitationData: item.data || undefined,
        positions: item.positions || { ...EMPTY_POSITIONS },
      },
    },
  };
}

function inputValue(value: EventDetails[keyof EventDetails]) {
  if (typeof value === "boolean") return value;
  return value ?? "";
}

export default function StudioWorkspace() {
  const [step, setStep] = useState<StudioStep>("category");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOptionalCollapsed, setIsOptionalCollapsed] = useState(true);
  const [details, setDetails] = useState<EventDetails>(createInitialDetails);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePage, setActivePage] = useState<MediaItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("none");
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [applyingEditId, setApplyingEditId] = useState<string | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

  const activePageRecord = useMemo(
    () => mediaList.find((item) => item.id === activePage?.id) ?? activePage,
    [activePage, mediaList],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setMediaList(sanitizeMediaItems(parsed));
    } catch {
      setMediaList([]);
    }
  }, []);

  useEffect(() => {
    try {
      const sanitized = sanitizeMediaItems(mediaList);
      if (sanitized.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // Ignore storage quota issues in the studio shell.
    }
  }, [mediaList]);

  useEffect(() => {
    setEditPrompt("");
    setIsEditPanelOpen(false);
  }, [selectedImage?.id, activePageRecord?.id]);

  useEffect(() => {
    if (details.category !== "Birthday") return;
    const nextGender = inferBirthdayGenderFromName(details.name) || "Neutral";
    if (details.gender === nextGender) return;
    setDetails((prev) =>
      prev.category === "Birthday" && prev.gender !== nextGender
        ? { ...prev, gender: nextGender }
        : prev,
    );
  }, [details.category, details.gender, details.name]);

  function isFormValid() {
    const missingShared = SHARED_BASICS.filter(
      (field) => field.required && !clean(String(inputValue(details[field.key]))),
    );
    if (missingShared.length > 0) return false;

    const missingCategory = (CATEGORY_FIELDS[details.category] || []).filter(
      (field) => field.required && !clean(String(inputValue(details[field.key]))),
    );
    if (missingCategory.length > 0) return false;

    const missingRsvp = RSVP_FIELDS.filter(
      (field) => field.required && !clean(String(inputValue(details[field.key]))),
    );
    return missingRsvp.length === 0;
  }

  function deleteMedia(id: string) {
    setMediaList((prev) => sanitizeMediaItems(prev.filter((item) => item.id !== id)));
    if (activePage?.id === id) {
      setActivePage(null);
      setActiveTab("none");
      setIsDesignMode(false);
    }
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
  }

  function downloadMedia(item: MediaItem) {
    if (!item.url || typeof document === "undefined") return;
    const link = document.createElement("a");
    link.href = item.url;
    link.download = `envitefy-${item.type}-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function patchMediaItem(id: string, patch: Partial<MediaItem>) {
    setMediaList((prev) =>
      sanitizeMediaItems(prev.map((item) => (item.id === id ? { ...item, ...patch } : item))),
    );
    if (activePage?.id === id) {
      setActivePage((prev) => (prev ? { ...prev, ...patch } : prev));
    }
    if (selectedImage?.id === id) {
      setSelectedImage((prev) => (prev ? { ...prev, ...patch } : prev));
    }
  }

  function getAbsoluteShareUrl(sharePath: string): string {
    if (typeof window === "undefined") return sharePath;
    return new URL(sharePath, window.location.origin).toString();
  }

  async function ensurePublicSharePath(item: MediaItem): Promise<string> {
    if (item.sharePath?.startsWith("/card/")) {
      return item.sharePath;
    }
    if (item.status !== "ready") {
      throw new Error("This invite must finish generating before it can be shared.");
    }

    const persistedImageUrl = await persistImageMediaValue({
      value: item.url,
      fileName: `${buildEventSlug(getStudioShareTitle(item)) || "studio-invite"}.png`,
    });
    const payload = buildStudioPublishPayload(item, persistedImageUrl);

    const response = item.publishedEventId
      ? await fetch(`/api/history/${encodeURIComponent(item.publishedEventId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            data: payload.data,
          }),
        })
      : await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
    const json = await response.json().catch(() => null);

    if (!response.ok || !json || typeof json.id !== "string" || !json.id.trim()) {
      const errorMessage =
        isRecord(json) && typeof json.error === "string" && json.error.trim()
          ? json.error.trim()
          : "Failed to publish this invite for sharing.";
      throw new Error(errorMessage);
    }

    const sharePath = buildStudioCardPath(json.id, payload.title);
    patchMediaItem(item.id, {
      publishedEventId: json.id,
      sharePath,
    });
    return sharePath;
  }

  async function shareMedia(item: MediaItem) {
    try {
      setSharingId(item.id);
      const sharePath = await ensurePublicSharePath(item);
      const shareUrl = getAbsoluteShareUrl(sharePath);
      const shareData = {
        title: getStudioShareTitle(item),
        text:
          item.data?.interactiveMetadata.shareNote ||
          item.data?.socialCaption ||
          item.data?.description ||
          "Check out this invitation!",
        url: shareUrl,
      };

      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (typeof window !== "undefined") {
        window.prompt("Copy your share link:", shareUrl);
      }
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("[studio] share failed", error);
      if (typeof window !== "undefined") {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "Unable to create a public share link right now.";
        window.alert(message);
      }
    } finally {
      setSharingId((current) => (current === item.id ? null : current));
    }
  }

  function updatePosition(
    id: string,
    buttonKey: keyof typeof EMPTY_POSITIONS,
    point: ButtonPosition,
  ) {
    setMediaList((prev) =>
      sanitizeMediaItems(
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = {
            ...item,
            positions: {
              ...EMPTY_POSITIONS,
              ...item.positions,
              [buttonKey]: point,
            },
          };
          if (activePage?.id === id) {
            setActivePage(updated);
          }
          return updated;
        }),
      ),
    );
  }

  async function generateMedia(type: MediaType) {
    const currentDetails = { ...details };
    const targetId = editingId ?? createId();
    const loadingItem: MediaItem = {
      id: targetId,
      type,
      theme: pickFirst(currentDetails.theme, `${currentDetails.category} Event`),
      status: "loading",
      details: currentDetails,
      createdAt: new Date().toISOString(),
      positions: { ...EMPTY_POSITIONS },
    };

    setIsGenerating(true);
    setActiveTab("none");

    setMediaList((prev) => {
      if (editingId) {
        return sanitizeMediaItems(
          prev.map((item) =>
            item.id === editingId ? { ...loadingItem, createdAt: item.createdAt } : item,
          ),
        );
      }
      return sanitizeMediaItems([loadingItem, ...prev]);
    });

    try {
      const response = await requestStudioGeneration(
        currentDetails,
        type === "page" ? "both" : "image",
      );
      const nextItem: MediaItem = {
        ...loadingItem,
        status: "ready",
        url: response.imageDataUrl || getFallbackThumbnail(currentDetails),
        data: type === "page" ? buildInvitationData(currentDetails, response) : undefined,
        errorMessage: undefined,
      };

      setMediaList((prev) =>
        sanitizeMediaItems(prev.map((item) => (item.id === targetId ? nextItem : item))),
      );
      setEditingId(null);
      setStep("studio");
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : "Studio generation failed.";
      console.error("Studio generation failed", error);
      setMediaList((prev) =>
        sanitizeMediaItems(
          prev.map((item) =>
            item.id === targetId
              ? {
                  ...item,
                  status: "error",
                  url: getFallbackThumbnail(currentDetails),
                  errorMessage,
                }
              : item,
          ),
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function applyImageEdit(item: MediaItem) {
    const prompt = clean(editPrompt);
    if (!prompt) {
      if (typeof window !== "undefined") {
        window.alert("Add an edit prompt first.");
      }
      return;
    }

    const sourceImageDataUrl = clean(item.url);
    if (!sourceImageDataUrl) {
      if (typeof window !== "undefined") {
        window.alert("The current image is not available to edit.");
      }
      return;
    }

    try {
      setApplyingEditId(item.id);
      const response = await requestStudioGeneration(
        item.details,
        "image",
        prompt,
        sourceImageDataUrl,
      );

      patchMediaItem(item.id, {
        url: response.imageDataUrl || item.url,
        status: "ready",
        errorMessage: undefined,
        sharePath: undefined,
      });
      setEditPrompt("");
      setIsEditPanelOpen(false);
    } catch (error) {
      console.error("[studio] image edit failed", error);
      if (typeof window !== "undefined") {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "Unable to apply that edit right now.";
        window.alert(message);
      }
    } finally {
      setApplyingEditId((current) => (current === item.id ? null : current));
    }
  }

  function renderEditImagePanel(item: MediaItem, description: string) {
    return (
      <div className="pointer-events-auto flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setIsEditPanelOpen((prev) => !prev)}
          aria-expanded={isEditPanelOpen}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left backdrop-blur-md transition-colors hover:bg-white/15"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/15 p-2 text-white">
              <WandSparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Edit Image
              </p>
              <p className="text-sm font-semibold text-white">
                {isEditPanelOpen ? "Prompt editor is open" : "Open image edit prompt"}
              </p>
            </div>
          </div>
          <ChevronRight
            className={`h-5 w-5 text-white/70 transition-transform ${isEditPanelOpen ? "rotate-90" : ""}`}
          />
        </button>

        {isEditPanelOpen ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
            <p className="text-sm text-white/90">{description}</p>
            <textarea
              value={editPrompt}
              onChange={(event) => setEditPrompt(event.target.value)}
              placeholder="e.g. clean up the text, reduce clutter, and soften the gold lighting"
              className="mt-3 min-h-[104px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/55">
                Applies your prompt directly to the current image instead of creating a brand-new
                composition.
              </p>
              <button
                onClick={() => applyImageEdit(item)}
                disabled={applyingEditId === item.id}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-wait disabled:opacity-70"
              >
                {applyingEditId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <WandSparkles className="h-4 w-4" />
                )}
                Edit Image
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const birthdayPresets =
    details.category === "Birthday" ? buildBirthdayPresets(details.age) : null;
  const birthdayPresetAudience =
    details.category === "Birthday" ? getBirthdayPresetAudience(details) : null;
  const currentPresets = getPresetsForDetails(details);
  const isDetailsTabActive = step === "category" || step === "form";
  const shellClass =
    "rounded-[32px] border border-[#ece4f7] bg-white/88 p-6 shadow-[0_20px_55px_rgba(84,61,140,0.08)] backdrop-blur-xl sm:p-8 lg:p-10";
  const secondaryShellClass =
    "rounded-[32px] border border-[#eee8f7] bg-[#fdfaff]/92 p-6 shadow-[0_14px_40px_rgba(84,61,140,0.06)] backdrop-blur-xl sm:p-8 lg:p-10";
  const fieldLabelClass = "text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500";
  const inputClass =
    "h-13 w-full rounded-2xl border border-[#e8e0f5] bg-[#fcfaff] px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[#b59cff] focus:outline-none focus:ring-4 focus:ring-[#cab8ff]/35";
  const iconInputClass =
    "h-13 w-full rounded-2xl border border-[#e8e0f5] bg-[#fcfaff] py-3 pr-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[#b59cff] focus:outline-none focus:ring-4 focus:ring-[#cab8ff]/35";
  const textAreaClass =
    "min-h-[120px] w-full rounded-2xl border border-[#e8e0f5] bg-[#fcfaff] px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[#b59cff] focus:outline-none focus:ring-4 focus:ring-[#cab8ff]/35";
  const mediaCardClass =
    "group relative flex flex-col overflow-hidden rounded-[28px] border border-[#ece4f7] bg-white/95 shadow-[0_16px_40px_-24px_rgba(25,20,40,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(88,55,140,0.18)]";
  const mediaBadgeClass =
    "inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-800 backdrop-blur-md";
  const ghostIconButtonClass =
    "rounded-full border border-white/70 bg-white/82 p-2.5 text-neutral-700 shadow-[0_10px_24px_rgba(25,20,40,0.12)] transition-all hover:scale-105 hover:bg-white";

  return (
    <div className="min-h-screen bg-[#faf7ff] text-neutral-900 selection:bg-purple-200">
      <header className="sticky top-0 z-40 border-b border-[#efe7f8] bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-center px-5 sm:h-[72px] sm:px-6 lg:px-8">
          <div className="flex w-full max-w-md items-center justify-center rounded-full border border-white/70 bg-white/75 p-1.5 shadow-[0_12px_40px_rgba(84,61,140,0.08)] backdrop-blur-xl">
            <button
              onClick={() => setStep("form")}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                isDetailsTabActive
                  ? "bg-[#f6f0ff] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_22px_rgba(84,61,140,0.12)]"
                  : "text-neutral-500 hover:bg-[#f7f3fd] hover:text-neutral-900"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => {
                if (isFormValid()) setStep("studio");
              }}
              disabled={!isFormValid()}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                step === "studio"
                  ? "bg-[#f6f0ff] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_22px_rgba(84,61,140,0.12)]"
                  : "text-neutral-500 hover:bg-[#f7f3fd] hover:text-neutral-900 disabled:text-neutral-400"
              }`}
            >
              Studio
            </button>
            <button
              onClick={() => setStep("library")}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                step === "library"
                  ? "bg-[#f6f0ff] text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_22px_rgba(84,61,140,0.12)]"
                  : "text-neutral-500 hover:bg-[#f7f3fd] hover:text-neutral-900"
              }`}
            >
              Library
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto px-5 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <AnimatePresence mode="wait">
          {step === "category" ? (
            <motion.div
              key="category"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-[1120px]"
            >
              <div className={`${shellClass} relative overflow-hidden`}>
                <div className="absolute left-8 top-6 h-32 w-32 rounded-full bg-[#e8ddff]/50 blur-3xl" />
                <div className="absolute bottom-0 right-10 h-28 w-28 rounded-full bg-[#f3ecff] blur-3xl" />
                <div className="relative space-y-10">
                  <div className="mx-auto max-w-2xl space-y-4 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                      Details
                    </p>
                    <h2 className="font-[var(--font-playfair)] text-4xl tracking-[-0.03em] text-neutral-900 sm:text-5xl">
                      What are we celebrating?
                    </h2>
                    <p className="text-sm leading-6 text-neutral-600 sm:text-[15px]">
                      Choose a category to start the exact same Envitefy studio flow with a calmer,
                      more editorial setup.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      const active = details.category === category.name;
                      return (
                        <motion.button
                          key={category.name}
                          whileHover={{ scale: 1.01, y: -2 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setDetails((prev) => ({ ...prev, category: category.name }));
                            setStep("form");
                          }}
                          className={`relative flex min-h-[220px] flex-col items-start justify-between rounded-[28px] border p-7 text-left transition-all ${
                            active
                              ? "border-[#d8c7fb] bg-[#f7f1ff] text-neutral-900 shadow-[0_24px_60px_-24px_rgba(88,55,140,0.22)] ring-1 ring-[#ece1ff]"
                              : "border-[#ece4f7] bg-white/95 text-neutral-900 shadow-[0_16px_40px_-24px_rgba(25,20,40,0.14)] hover:-translate-y-1 hover:border-[#ddd0f6] hover:shadow-[0_24px_60px_-24px_rgba(88,55,140,0.18)]"
                          }`}
                        >
                          {active ? (
                            <div className="absolute right-5 top-5 rounded-full bg-[#8f6fe8] p-1.5 text-white shadow-lg">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          ) : null}
                          <div
                            className={`rounded-[18px] p-4 ${
                              active ? "bg-white text-[#7d5ed8]" : "bg-[#f7f3fd] text-[#8a6fdb]"
                            }`}
                          >
                            <Icon className="h-7 w-7" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
                              {category.name}
                            </p>
                            <p className="text-sm leading-6 text-neutral-600">
                              {CATEGORY_DESCRIPTIONS[category.name]}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}

          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mx-auto max-w-[1180px] space-y-10"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => setStep("category")}
                  className="mt-1 rounded-full border border-[#ece4f7] bg-white/90 p-3 text-neutral-700 shadow-[0_12px_24px_rgba(25,20,40,0.08)] transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  <ArrowLeft className="h-5 w-5 text-neutral-900" />
                </button>
                <div className="space-y-3">
                  <div className="inline-flex items-center rounded-full border border-[#e6ddf3] bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {details.category}
                  </div>
                  <h2 className="font-[var(--font-playfair)] text-4xl tracking-[-0.03em] text-neutral-900 sm:text-[44px]">
                    {details.category} Details
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-neutral-600 sm:text-[15px]">
                    Fill in the same event information and settings, now arranged with more
                    breathing room and clearer hierarchy.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className={`${shellClass} space-y-8`}>
                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Required Information
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-[#f4edff] p-3 text-[#8a6fdb]">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-900">
                          Core event details
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-neutral-600">
                          These fields keep the invitation generation flow unchanged and unlock the
                          Studio tab.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2 lg:grid-cols-3">
                    {(CATEGORY_FIELDS[details.category] || [])
                      .filter((field) => field.required)
                      .map((field) => (
                        <div
                          key={field.key}
                          className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                        >
                          <label className={fieldLabelClass}>
                            {field.label} <span className="text-[#8a6fdb]">*</span>
                          </label>
                          {field.type === "textarea" ? (
                            <textarea
                              placeholder={field.placeholder}
                              className={textAreaClass}
                              value={String(inputValue(details[field.key]))}
                              onChange={(event) =>
                                setDetails((prev) => ({ ...prev, [field.key]: event.target.value }))
                              }
                            />
                          ) : field.type === "select" ? (
                            <select
                              className={`${inputClass} appearance-none`}
                              value={String(inputValue(details[field.key]))}
                              onChange={(event) =>
                                setDetails((prev) => ({
                                  ...prev,
                                  [field.key]: event.target.value as EventDetails[typeof field.key],
                                }))
                              }
                            >
                              {field.options?.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              className={inputClass}
                              value={String(inputValue(details[field.key]))}
                              onChange={(event) =>
                                setDetails((prev) => ({ ...prev, [field.key]: event.target.value }))
                              }
                            />
                          )}
                        </div>
                      ))}

                    {SHARED_BASICS.filter((field) => field.required).map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className={fieldLabelClass}>
                          {field.label} <span className="text-[#8a6fdb]">*</span>
                        </label>
                        <div className="relative">
                          {field.key === "startTime" ? (
                            <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                          ) : null}
                          {field.key === "location" ? (
                            <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                          ) : null}
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            className={`${iconInputClass} ${
                              field.key === "startTime" || field.key === "location"
                                ? "pl-12"
                                : "px-4"
                            }`}
                            value={String(inputValue(details[field.key]))}
                            onChange={(event) =>
                              setDetails((prev) => ({ ...prev, [field.key]: event.target.value }))
                            }
                          />
                        </div>
                      </div>
                    ))}

                    {RSVP_FIELDS.filter((field) => field.required).map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className={fieldLabelClass}>
                          {field.label} <span className="text-[#8a6fdb]">*</span>
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className={inputClass}
                          value={String(inputValue(details[field.key]))}
                          onChange={(event) =>
                            setDetails((prev) => ({ ...prev, [field.key]: event.target.value }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${secondaryShellClass} space-y-6`}>
                  <button
                    onClick={() => setIsOptionalCollapsed((prev) => !prev)}
                    className="group flex w-full items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl bg-white p-3 text-[#8a6fdb] shadow-[0_10px_24px_rgba(25,20,40,0.08)] transition-colors">
                        <Plus className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                          Optional Details
                        </p>
                        <h3 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-neutral-900">
                          Refinements and preferences
                        </h3>
                      </div>
                    </div>
                    <div
                      className={`transition-transform duration-300 ${isOptionalCollapsed ? "" : "rotate-90"}`}
                    >
                      <ChevronRight className="h-6 w-6 text-neutral-400 group-hover:text-neutral-600" />
                    </div>
                  </button>

                  {!isOptionalCollapsed ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-10 border-t border-white/80 pt-8"
                    >
                      <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
                        {(CATEGORY_FIELDS[details.category] || [])
                          .filter((field) => !field.required)
                          .map((field) => (
                            <div
                              key={field.key}
                              className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                            >
                              <label className={fieldLabelClass}>{field.label}</label>
                              {field.type === "textarea" ? (
                                <textarea
                                  placeholder={field.placeholder}
                                  className={textAreaClass}
                                  value={String(inputValue(details[field.key]))}
                                  onChange={(event) =>
                                    setDetails((prev) => ({
                                      ...prev,
                                      [field.key]: event.target.value,
                                    }))
                                  }
                                />
                              ) : field.type === "checkbox" ? (
                                <div className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-[#e8e0f5] bg-white px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                                  <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-neutral-200 bg-white text-purple-600 focus:ring-purple-500/20"
                                    checked={Boolean(details[field.key])}
                                    onChange={(event) =>
                                      setDetails((prev) => ({
                                        ...prev,
                                        [field.key]: event.target.checked,
                                      }))
                                    }
                                  />
                                  <span className="text-sm text-neutral-500">{field.label}</span>
                                </div>
                              ) : (
                                <input
                                  type={field.type}
                                  placeholder={field.placeholder}
                                  className={inputClass}
                                  value={String(inputValue(details[field.key]))}
                                  onChange={(event) =>
                                    setDetails((prev) => ({
                                      ...prev,
                                      [field.key]: event.target.value,
                                    }))
                                  }
                                />
                              )}
                            </div>
                          ))}

                        {SHARED_BASICS.filter((field) => !field.required).map((field) => (
                          <div key={field.key} className="space-y-2">
                            <label className={fieldLabelClass}>{field.label}</label>
                            <div className="relative">
                              {field.key === "endTime" ? (
                                <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                              ) : null}
                              <input
                                type={field.type}
                                placeholder={field.placeholder}
                                className={`${iconInputClass} ${
                                  field.key === "endTime" ? "pl-12" : "px-4"
                                }`}
                                value={String(inputValue(details[field.key]))}
                                onChange={(event) =>
                                  setDetails((prev) => ({
                                    ...prev,
                                    [field.key]: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        ))}

                        {RSVP_FIELDS.filter((field) => !field.required).map((field) => (
                          <div key={field.key} className="space-y-2">
                            <label className={fieldLabelClass}>{field.label}</label>
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              className={inputClass}
                              value={String(inputValue(details[field.key]))}
                              onChange={(event) =>
                                setDetails((prev) => ({ ...prev, [field.key]: event.target.value }))
                              }
                            />
                          </div>
                        ))}

                        <div className="space-y-2 md:col-span-2">
                          <label className={fieldLabelClass}>Personal Message</label>
                          <textarea
                            placeholder="e.g. We can't wait to see you there!"
                            className={textAreaClass}
                            value={details.message}
                            onChange={(event) =>
                              setDetails((prev) => ({ ...prev, message: event.target.value }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={fieldLabelClass}>Special Instructions</label>
                          <input
                            type="text"
                            placeholder="e.g. Parking info, entrance code"
                            className={inputClass}
                            value={details.specialInstructions}
                            onChange={(event) =>
                              setDetails((prev) => ({
                                ...prev,
                                specialInstructions: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-8">
                        <div className="mb-6 flex items-center gap-3">
                          <div className="rounded-2xl bg-[#f6efff] p-3 text-[#8a6fdb]">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                              Design Preferences
                            </p>
                            <h4 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-neutral-900">
                              Visual direction
                            </h4>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-2">
                            <label className={fieldLabelClass}>Orientation</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setDetails((prev) => ({ ...prev, orientation: "portrait" }))
                                }
                                className={`h-13 flex-1 rounded-2xl border text-sm font-semibold transition-all ${
                                  details.orientation === "portrait"
                                    ? "border-[#c9b5fb] bg-[#f6efff] text-neutral-900 shadow-[0_10px_24px_rgba(84,61,140,0.10)]"
                                    : "border-[#e8e0f5] bg-white text-neutral-500 hover:bg-[#faf7ff]"
                                }`}
                              >
                                Portrait
                              </button>
                              <button
                                onClick={() =>
                                  setDetails((prev) => ({ ...prev, orientation: "landscape" }))
                                }
                                className={`h-13 flex-1 rounded-2xl border text-sm font-semibold transition-all ${
                                  details.orientation === "landscape"
                                    ? "border-[#c9b5fb] bg-[#f6efff] text-neutral-900 shadow-[0_10px_24px_rgba(84,61,140,0.10)]"
                                    : "border-[#e8e0f5] bg-white text-neutral-500 hover:bg-[#faf7ff]"
                                }`}
                              >
                                Landscape
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className={fieldLabelClass}>Preferred Colors</label>
                            <input
                              type="text"
                              placeholder="e.g. Red and gold"
                              className={inputClass}
                              value={details.colors}
                              onChange={(event) =>
                                setDetails((prev) => ({ ...prev, colors: event.target.value }))
                              }
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2 lg:col-span-1">
                            <label className={fieldLabelClass}>Visual Style Idea</label>
                            <textarea
                              placeholder="e.g. Editorial premiere poster with red carpet lighting..."
                              className={textAreaClass}
                              value={details.visualPreferences}
                              onChange={(event) =>
                                setDetails((prev) => ({
                                  ...prev,
                                  visualPreferences: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 pt-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  <span className="mr-1 text-[#8a6fdb]">*</span> Required fields
                </p>
                <button
                  onClick={() => setStep("studio")}
                  disabled={!isFormValid()}
                  className="flex items-center gap-3 rounded-full bg-neutral-900 px-10 py-4 text-base font-semibold text-white shadow-[0_20px_50px_rgba(25,20,40,0.18)] transition-all hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingId ? "Update Invitation" : "Enter Studio"}
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              </div>
            </motion.div>
          ) : null}

          {step === "library" ? (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-[1320px] space-y-10"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Library
                  </p>
                  <h2 className="font-[var(--font-playfair)] text-4xl tracking-[-0.03em] text-neutral-900 sm:text-[44px]">
                    Your Library
                  </h2>
                  <p className="text-sm leading-6 text-neutral-600 sm:text-[15px]">
                    Browse the same saved invitations and generated assets in a cleaner, more
                    gallery-like archive.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setStep("form");
                  }}
                  className="flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(25,20,40,0.18)] transition-all hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  <Plus className="h-5 w-5" />
                  Create New
                </button>
              </div>

              {mediaList.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-[#e5dbf6] bg-white/88 py-24 text-center shadow-[0_20px_55px_rgba(84,61,140,0.06)]">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f7f1ff] shadow-[0_10px_24px_rgba(84,61,140,0.08)]">
                    <ImageIcon className="h-8 w-8 text-[#9b82e7]" />
                  </div>
                  <p className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
                    No invitations created yet
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Your saved live cards and images will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-7 md:grid-cols-2 2xl:grid-cols-3">
                  {mediaList.map((item) => (
                    <motion.div key={item.id} layoutId={item.id} className={mediaCardClass}>
                      <div className="relative aspect-[9/16] overflow-hidden">
                        {item.status === "loading" ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#faf7ff]">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                          </div>
                        ) : (
                          <>
                            <img
                              src={item.url}
                              alt={item.theme}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,rgba(18,14,28,0.12),rgba(18,14,28,0.54))] opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                              {item.type === "page" ? (
                                <button
                                  onClick={() => setActivePage(item)}
                                  className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-[0_14px_34px_rgba(25,20,40,0.18)] transition-transform hover:scale-[1.02]"
                                >
                                  <Layout className="h-5 w-5" />
                                  Open Live Card
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedImage(item)}
                                  className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-[0_14px_34px_rgba(25,20,40,0.18)] transition-transform hover:scale-[1.02]"
                                >
                                  <ImageIcon className="h-5 w-5" />
                                  View Full Image
                                </button>
                              )}
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => {
                                    setDetails(item.details);
                                    setEditingId(item.id);
                                    setIsOptionalCollapsed(false);
                                    setStep("form");
                                  }}
                                  className="rounded-full bg-white p-3 text-neutral-900 shadow-[0_12px_24px_rgba(25,20,40,0.14)] transition-transform hover:scale-105"
                                  title="Edit"
                                >
                                  <RefreshCw className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => downloadMedia(item)}
                                  className={ghostIconButtonClass}
                                  title="Download"
                                >
                                  <Download className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => deleteMedia(item.id)}
                                  className={`${ghostIconButtonClass} text-red-500 hover:text-red-600`}
                                  title="Delete"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="absolute left-4 top-4 flex gap-2">
                          <span className={mediaBadgeClass}>
                            {item.type === "page" ? (
                              <Layout className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <ImageIcon className="h-3 w-3 text-sky-600" />
                            )}
                            {item.type === "page" ? "Live Card" : "Image"}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteMedia(item.id)}
                          className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/82 p-2.5 text-neutral-500 shadow-[0_10px_24px_rgba(25,20,40,0.12)] transition-all hover:bg-white hover:text-red-500"
                          title="Delete from library"
                          aria-label={`Delete ${item.type === "page" ? "live card" : "image"} from library`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1 px-6 py-5">
                        <h3 className="truncate text-lg font-semibold tracking-[-0.02em] text-neutral-900">
                          {getDisplayTitle(item.details)}
                        </h3>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                          {item.theme}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}

          {step === "studio" ? (
            <motion.div
              key="studio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[380px_minmax(0,1fr)] xl:gap-10"
            >
              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <button
                  onClick={() => setStep("form")}
                  className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500 transition-colors hover:text-[#8a6fdb]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Details
                </button>

                <div className={`${shellClass} space-y-8`}>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        Presets
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-neutral-900">
                        Choose a direction
                      </h2>
                    </div>
                    {details.category !== "Birthday" ? (
                      <div className="flex items-center gap-3 rounded-[24px] border border-[#eee7f7] bg-[#fdfaff] px-4 py-3">
                        <div className="rounded-2xl bg-[#f4edff] p-2.5 text-[#8a6fdb]">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-neutral-900">
                          {details.category} Presets
                        </span>
                      </div>
                    ) : null}

                    {details.category === "Birthday" && birthdayPresets ? (
                      <div className="space-y-4">
                        {birthdayPresetAudience ? (
                          <div className="rounded-[22px] border border-[#ece4f7] bg-[#faf7ff] px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                              Showing 12 {birthdayPresetAudience === "female" ? "girl" : "boy"}{" "}
                              presets
                            </p>
                          </div>
                        ) : null}
                        <div className="grid max-h-[480px] grid-cols-2 gap-3 overflow-y-auto pr-2">
                          {currentPresets.map((preset) => {
                            const Icon = preset.icon;
                            const active = details.theme === preset.name;
                            return (
                              <button
                                key={preset.id}
                                onClick={() =>
                                  setDetails((prev) => ({ ...prev, theme: preset.name }))
                                }
                                className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                                  active
                                    ? "border-[#d8c7fb] bg-[#f7f1ff] shadow-[0_18px_34px_-20px_rgba(88,55,140,0.26)] ring-1 ring-[#ece1ff]"
                                    : "border-[#ece4f7] bg-white hover:-translate-y-0.5 hover:border-[#ddd0f6] hover:bg-[#fdfaff]"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`mt-0.5 rounded-2xl p-2.5 ${
                                      active
                                        ? "bg-white text-[#7d5ed8]"
                                        : "bg-[#f7f3fd] text-[#8a6fdb]"
                                    }`}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900">
                                      {preset.name}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="grid max-h-[450px] grid-cols-2 gap-3 overflow-y-auto pr-2">
                        {currentPresets.map((preset) => {
                          const Icon = preset.icon;
                          const active = details.theme === preset.name;
                          return (
                            <button
                              key={preset.id}
                              onClick={() =>
                                setDetails((prev) => ({ ...prev, theme: preset.name }))
                              }
                              className={`group relative aspect-[3/4] overflow-hidden rounded-[24px] border text-left transition-all ${
                                active
                                  ? "border-[#d8c7fb] shadow-[0_18px_34px_-20px_rgba(88,55,140,0.26)] ring-1 ring-[#ece1ff]"
                                  : "border-[#ece4f7] hover:-translate-y-0.5 hover:border-[#ddd0f6]"
                              }`}
                            >
                              <img
                                src={preset.thumbnail}
                                alt={preset.name}
                                className="absolute inset-0 h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-90"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[rgba(255,255,255,0.96)] via-[rgba(255,255,255,0.18)] to-transparent p-3">
                                <div className="mb-1 flex items-center gap-1.5">
                                  <div className="rounded-xl border border-white/70 bg-white/80 p-1.5 backdrop-blur-sm">
                                    <Icon className="h-3 w-3 text-purple-600" />
                                  </div>
                                  <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-neutral-900">
                                    {preset.name}
                                  </span>
                                </div>
                                <span className="line-clamp-2 text-[10px] leading-4 text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100">
                                  {preset.description}
                                </span>
                              </div>
                              {active ? (
                                <div className="absolute right-3 top-3 rounded-full bg-white p-1.5 text-[#8a6fdb] shadow-[0_10px_24px_rgba(25,20,40,0.16)]">
                                  <CheckCircle2 className="h-3 w-3 text-[#8a6fdb]" />
                                </div>
                              ) : null}
                            </button>
                          );
                        })}

                        {currentPresets.length === 0 ? (
                          <div className="col-span-2 py-8 text-center">
                            <p className="text-[11px] italic text-neutral-600">
                              No presets for this category yet. Use a custom idea below.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="rounded-[24px] border border-[#eee7f7] bg-[#fdfaff] p-4">
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        Custom Visual Idea
                      </label>
                      <p className="mb-3 text-sm leading-6 text-neutral-600">
                        Keep the same prompt input, but present it like a creative brief.
                      </p>
                      <textarea
                        placeholder="e.g. A minimalist gold and white theme with marble textures..."
                        className="min-h-[120px] w-full rounded-2xl border border-[#e8e0f5] bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[#b59cff] focus:outline-none focus:ring-4 focus:ring-[#cab8ff]/35"
                        value={details.theme}
                        onChange={(event) =>
                          setDetails((prev) => ({ ...prev, theme: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/80 pt-2">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Generate Media
                  </h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => generateMedia("page")}
                      disabled={isGenerating}
                      className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(25,20,40,0.18)] transition-all hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-50"
                    >
                      <Layout className="h-5 w-5" />
                      Create Live Card
                      <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>

                    <button
                      onClick={() => generateMedia("image")}
                      disabled={isGenerating}
                      className="group flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[#e8e0f5] bg-white text-sm font-semibold text-neutral-900 shadow-[0_12px_30px_rgba(25,20,40,0.08)] transition-all hover:-translate-y-0.5 hover:bg-[#faf7ff] disabled:opacity-50"
                    >
                      <ImageIcon className="h-5 w-5" />
                      Generate Image
                      <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>
                  </div>
                  <p className="text-center text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Powered by Gemini 3 &amp; Veo 3.1
                  </p>
                </div>
              </aside>

              <section className="space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Studio
                    </p>
                    <h2 className="font-[var(--font-playfair)] text-4xl tracking-[-0.03em] text-neutral-900 sm:text-[44px]">
                      Your Studio
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Saved to local library</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-7 md:grid-cols-2 2xl:grid-cols-3">
                  <AnimatePresence>
                    {mediaList.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={mediaCardClass}
                      >
                        <div
                          className={`relative flex items-center justify-center overflow-hidden bg-neutral-100 ${
                            item.details.orientation === "portrait"
                              ? "aspect-[9/16]"
                              : "aspect-[16/9]"
                          }`}
                        >
                          {item.status === "loading" ? (
                            <div className="flex flex-col items-center gap-4">
                              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                              <span className="animate-pulse text-xs font-bold uppercase tracking-widest text-neutral-400">
                                Processing {item.type}...
                              </span>
                            </div>
                          ) : item.status === "error" ? (
                            <div className="p-6 text-center">
                              <p className="mb-2 font-bold text-red-500">Generation Failed</p>
                              {item.errorMessage ? (
                                <p className="mb-3 text-[11px] leading-5 text-neutral-500">
                                  {item.errorMessage}
                                </p>
                              ) : null}
                              <button
                                onClick={() => generateMedia(item.type)}
                                className="text-xs text-neutral-500 underline hover:text-neutral-900"
                              >
                                Try Again
                              </button>
                            </div>
                          ) : (
                            <div className="relative h-full w-full">
                              <img
                                src={item.url}
                                alt={item.theme}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {item.status === "ready" ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,rgba(18,14,28,0.12),rgba(18,14,28,0.54))] opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                              {item.type === "page" ? (
                                <button
                                  onClick={() => setActivePage(item)}
                                  className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-[0_14px_34px_rgba(25,20,40,0.18)] transition-transform hover:scale-[1.02]"
                                >
                                  <Layout className="h-5 w-5" />
                                  Open Live Card
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedImage(item)}
                                  className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-[0_14px_34px_rgba(25,20,40,0.18)] transition-transform hover:scale-[1.02]"
                                >
                                  <ImageIcon className="h-5 w-5" />
                                  View Full Image
                                </button>
                              )}

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => downloadMedia(item)}
                                  className={ghostIconButtonClass}
                                  title="Download"
                                >
                                  <Download className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => shareMedia(item)}
                                  disabled={sharingId === item.id}
                                  className={ghostIconButtonClass}
                                  title={sharingId === item.id ? "Creating share link" : "Share"}
                                >
                                  {sharingId === item.id ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : copySuccess ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Share2 className="h-5 w-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => deleteMedia(item.id)}
                                  className={`${ghostIconButtonClass} text-red-500 hover:text-red-600`}
                                  title="Delete"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ) : null}

                          <div className={`absolute left-4 top-4 ${mediaBadgeClass}`}>
                            {item.type === "page" ? (
                              <>
                                <Layout className="h-3 w-3 text-green-600" />
                                Live Card
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-3 w-3 text-blue-600" />
                                Image
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => deleteMedia(item.id)}
                            className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/82 p-2.5 text-neutral-500 shadow-[0_10px_24px_rgba(25,20,40,0.12)] transition-all hover:bg-white hover:text-red-500"
                            title="Delete from library"
                            aria-label={`Delete ${item.type === "page" ? "live card" : "image"} from library`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1 px-6 py-5">
                          <h3 className="truncate text-lg font-semibold tracking-[-0.02em] text-neutral-900">
                            {getStudioShareTitle(item)}
                          </h3>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                            {item.theme}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {mediaList.length === 0 ? (
                      <div className="col-span-full rounded-[32px] border border-dashed border-[#e5dbf6] bg-white/88 py-28 text-center shadow-[0_20px_55px_rgba(84,61,140,0.06)]">
                        <div className="mb-6 inline-flex rounded-full bg-[#f7f1ff] p-6 shadow-[0_10px_24px_rgba(84,61,140,0.08)]">
                          <Sparkles className="h-12 w-12 text-[#9b82e7]" />
                        </div>
                        <h3 className="mb-2 text-2xl font-semibold tracking-[-0.02em] text-neutral-900">
                          No media generated yet
                        </h3>
                        <p className="mx-auto max-w-sm text-sm leading-6 text-neutral-500">
                          Select a preset and generate the same assets in a calmer, more curated
                          gallery workspace.
                        </p>
                      </div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedImage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-6 backdrop-blur-xl"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative flex max-h-full w-full max-w-5xl flex-col items-center gap-6"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute right-0 top-0 z-20 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-8 w-8" />
              </button>

              <div className="absolute right-0 top-16 z-10 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-3">
                {renderEditImagePanel(
                  selectedImage,
                  "Describe the change you want. This edits the current image instead of generating a different one.",
                )}
              </div>

              <div className="group relative flex w-full justify-center">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.theme}
                  className="max-h-[80vh] max-w-full rounded-2xl border border-white/20 object-contain shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => downloadMedia(selectedImage)}
                    className="rounded-full bg-white p-4 text-neutral-900 shadow-xl transition-transform hover:scale-110"
                  >
                    <Download className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold text-white">{selectedImage.theme}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  {selectedImage.details.category} • {selectedImage.details.eventDate}
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activePageRecord?.data ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl md:p-12"
          >
            <button
              onClick={() => {
                setActivePage(null);
                setActiveTab("none");
                setIsDesignMode(false);
              }}
              className="absolute right-8 top-8 z-[110] rounded-full bg-white/20 p-3 text-white transition-colors hover:bg-white/30"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="absolute right-4 top-20 z-[110] flex w-[min(22rem,calc(100vw-1rem))] flex-col gap-3 md:right-8 md:top-24">
              {renderEditImagePanel(
                activePageRecord,
                "Describe the change you want. This edits the current live-card artwork and keeps your existing card details and button placement.",
              )}

              <div className="pointer-events-auto flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                    Design Mode
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {isDesignMode ? "Button editing is on" : "Adjust card button placement"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={isDesignMode}
                  aria-label={isDesignMode ? "Turn off design mode" : "Turn on design mode"}
                  onClick={() => setIsDesignMode((prev) => !prev)}
                  className={`relative h-7 w-14 rounded-full transition-all ${isDesignMode ? "bg-purple-500" : "bg-neutral-700"}`}
                >
                  <motion.div
                    animate={{ x: isDesignMode ? 28 : 4 }}
                    className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg"
                  />
                </button>
              </div>

              {isDesignMode ? (
                <div className="pointer-events-auto rounded-2xl border border-purple-300/30 bg-black/35 px-4 py-3 text-sm text-white/90 backdrop-blur-md">
                  Drag the RSVP, Details, Location, Calendar, Share, and Registry buttons to move
                  them around the card. Turn Design Mode off when you're done.
                </div>
              ) : null}
            </div>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[3rem] border border-white/10 bg-neutral-900 shadow-2xl shadow-purple-500/20 aspect-[9/16]"
            >
              <img
                src={activePageRecord.url}
                alt={activePageRecord.theme}
                className="absolute inset-0 h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />

              <div className="absolute inset-0 flex flex-col p-8 pointer-events-none">
                <div className="flex h-full flex-col justify-end">
                  <AnimatePresence>
                    {activeTab !== "none" && activeTab !== "share" ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="pointer-events-auto absolute bottom-32 left-6 right-6 z-50 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-neutral-100 p-2 text-neutral-900">
                              {activeTab === "location" ? <MapPin className="h-5 w-5" /> : null}
                              {activeTab === "calendar" ? <Calendar className="h-5 w-5" /> : null}
                              {activeTab === "registry" ? <Sparkles className="h-5 w-5" /> : null}
                              {activeTab === "rsvp" ? <User className="h-5 w-5" /> : null}
                              {activeTab === "details" ? <Info className="h-5 w-5" /> : null}
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                              {activeTab === "location" ? "Event Location" : null}
                              {activeTab === "calendar" ? "Add to Calendar" : null}
                              {activeTab === "registry" ? "Gift Registry" : null}
                              {activeTab === "rsvp" ? "RSVP Info" : null}
                              {activeTab === "details" ? "Event Details" : null}
                            </h4>
                          </div>
                          <button
                            onClick={() => setActiveTab("none")}
                            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {activeTab === "rsvp" ? (
                            <div className="space-y-4">
                              <p className="text-sm font-bold uppercase tracking-widest text-green-600">
                                RSVP Details
                              </p>
                              <p className="text-sm leading-6 text-neutral-700">
                                {activePageRecord.data.interactiveMetadata.rsvpMessage}
                              </p>
                              <div className="space-y-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                                <div>
                                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                    Host / RSVP Contact
                                  </p>
                                  <p className="text-sm font-medium text-neutral-900">
                                    {activePageRecord.data.eventDetails.rsvpName || "Host"}
                                  </p>
                                </div>
                                {activePageRecord.data.eventDetails.rsvpContact ? (
                                  <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                      Contact Info
                                    </p>
                                    <p className="text-sm text-neutral-700">
                                      {activePageRecord.data.eventDetails.rsvpContact}
                                    </p>
                                  </div>
                                ) : null}
                                {activePageRecord.data.eventDetails.rsvpDeadline ? (
                                  <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                      RSVP Deadline
                                    </p>
                                    <p className="text-sm text-red-600">
                                      {formatDate(activePageRecord.data.eventDetails.rsvpDeadline)}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-xs font-bold text-white">
                                <CheckCircle2 className="h-3 w-3" />
                                {activePageRecord.data.interactiveMetadata.ctaLabel}
                              </button>
                            </div>
                          ) : null}

                          {activeTab === "details" ? (
                            <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2">
                              <p className="text-sm font-bold uppercase tracking-widest text-purple-600">
                                {activePageRecord.data.eventDetails.category} Information
                              </p>
                              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                  Theme Style
                                </p>
                                <p className="mt-1 text-sm font-medium text-neutral-900">
                                  {activePageRecord.data.theme.themeStyle}
                                </p>
                              </div>
                              {activePageRecord.data.interactiveMetadata.funFacts.length > 0 ? (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                                    Fun Facts
                                  </p>
                                  <ul className="mt-3 space-y-2 text-sm text-amber-950">
                                    {activePageRecord.data.interactiveMetadata.funFacts.map(
                                      (fact) => (
                                        <li key={fact}>{fact}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              ) : null}
                              <div className="grid grid-cols-1 gap-3">
                                {Object.entries(activePageRecord.data.eventDetails)
                                  .filter(([key, value]) => {
                                    if (!value || typeof value === "boolean") return false;
                                    return ![
                                      "category",
                                      "eventDate",
                                      "startTime",
                                      "endTime",
                                      "location",
                                      "venueName",
                                      "rsvpName",
                                      "rsvpContact",
                                      "rsvpDeadline",
                                      "message",
                                      "specialInstructions",
                                      "orientation",
                                      "colors",
                                      "style",
                                      "visualPreferences",
                                      "theme",
                                    ].includes(key);
                                  })
                                  .map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="rounded-xl border border-neutral-100 bg-neutral-50 p-3"
                                    >
                                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                        {key
                                          .replace(/([A-Z])/g, " $1")
                                          .replace(/^./, (char) => char.toUpperCase())}
                                      </p>
                                      <p className="text-sm text-neutral-900">{String(value)}</p>
                                    </div>
                                  ))}
                                {activePageRecord.data.eventDetails.message ? (
                                  <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 italic">
                                    <p className="text-xs text-purple-600">
                                      "{activePageRecord.data.eventDetails.message}"
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}

                          {activeTab === "location" ? (
                            <>
                              <p className="text-sm font-medium text-neutral-900">
                                {activePageRecord.data.eventDetails.venueName ||
                                  activePageRecord.data.eventDetails.location}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {activePageRecord.data.eventDetails.location}
                              </p>
                              <p className="mt-2 text-xs text-neutral-500">
                                {formatDate(activePageRecord.data.eventDetails.eventDate)} @{" "}
                                {activePageRecord.data.eventDetails.startTime}
                              </p>
                              <button
                                onClick={() =>
                                  window.open(
                                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePageRecord.data?.eventDetails.location || "")}`,
                                    "_blank",
                                  )
                                }
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2 text-xs font-bold text-white"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open in Maps
                              </button>
                            </>
                          ) : null}

                          {activeTab === "calendar" ? (
                            <>
                              <p className="text-sm font-medium text-neutral-900">Save the Date</p>
                              <p className="text-xs text-neutral-500">
                                {activePageRecord.data.eventDetails.eventDate
                                  ? formatDate(activePageRecord.data.eventDetails.eventDate)
                                  : "Date TBD"}
                                {activePageRecord.data.eventDetails.startTime
                                  ? ` at ${activePageRecord.data.eventDetails.startTime}`
                                  : ""}
                              </p>
                              <button
                                onClick={() => {
                                  const title = encodeURIComponent(
                                    activePageRecord.data?.title || "Event",
                                  );
                                  const detailsText = encodeURIComponent(
                                    activePageRecord.data?.description || "",
                                  );
                                  const location = encodeURIComponent(
                                    activePageRecord.data?.eventDetails.location || "",
                                  );
                                  const date = (
                                    activePageRecord.data?.eventDetails.eventDate || ""
                                  ).replace(/-/g, "");
                                  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${detailsText}&location=${location}&dates=${date}/${date}`;
                                  window.open(url, "_blank");
                                }}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white"
                              >
                                <Calendar className="h-3 w-3" />
                                Add to Google Calendar
                              </button>
                            </>
                          ) : null}

                          {activeTab === "registry" ? (
                            <>
                              <p className="text-sm font-medium text-neutral-900">Gift Registry</p>
                              {hasRegistryContent(activePageRecord.data.eventDetails) ? (
                                <p className="text-xs text-neutral-500">
                                  {getRegistryText(activePageRecord.data.eventDetails)}
                                </p>
                              ) : null}
                              <p className="text-xs text-neutral-500">
                                {activePageRecord.data.interactiveMetadata.shareNote}
                              </p>
                              {activePageRecord.data.eventDetails.registryLink ? (
                                <button
                                  onClick={() =>
                                    window.open(
                                      activePageRecord.data?.eventDetails.registryLink,
                                      "_blank",
                                    )
                                  }
                                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 py-2 text-xs font-bold text-white"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Visit Registry
                                </button>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div className="pointer-events-none flex items-end justify-center gap-4 px-4 pb-8">
                    {(
                      [
                        {
                          key: "rsvp",
                          label: "RSVP",
                          icon: User,
                          visible: Boolean(
                            activePageRecord.data.eventDetails.rsvpName ||
                              activePageRecord.data.eventDetails.rsvpContact,
                          ),
                          onClick: () => setActiveTab(activeTab === "rsvp" ? "none" : "rsvp"),
                        },
                        {
                          key: "details",
                          label: "Details",
                          icon: Info,
                          visible: true,
                          onClick: () => setActiveTab(activeTab === "details" ? "none" : "details"),
                        },
                        {
                          key: "location",
                          label: "Location",
                          icon: MapPin,
                          visible: true,
                          onClick: () =>
                            setActiveTab(activeTab === "location" ? "none" : "location"),
                        },
                        {
                          key: "calendar",
                          label: "Calendar",
                          icon: Calendar,
                          visible: true,
                          onClick: () =>
                            setActiveTab(activeTab === "calendar" ? "none" : "calendar"),
                        },
                        {
                          key: "share",
                          label:
                            sharingId === activePageRecord.id
                              ? "Sharing..."
                              : copySuccess
                                ? "Copied!"
                                : "Share",
                          icon:
                            sharingId === activePageRecord.id
                              ? Loader2
                              : copySuccess
                                ? CheckCircle2
                                : Share2,
                          visible: true,
                          onClick: () => shareMedia(activePageRecord),
                        },
                        {
                          key: "registry",
                          label: "Registry",
                          icon: Sparkles,
                          visible: hasRegistryContent(activePageRecord.data.eventDetails),
                          onClick: () =>
                            setActiveTab(activeTab === "registry" ? "none" : "registry"),
                        },
                      ] as const
                    )
                      .filter((button) => button.visible)
                      .map((button) => {
                        const Icon = button.icon;
                        const position =
                          activePageRecord.positions?.[button.key] || EMPTY_POSITIONS[button.key];
                        return (
                          <motion.div
                            key={button.key}
                            drag={isDesignMode}
                            dragMomentum={false}
                            onDragEnd={(_, info) =>
                              updatePosition(activePageRecord.id, button.key, {
                                x: position.x + info.offset.x,
                                y: position.y + info.offset.y,
                              })
                            }
                            style={{ x: position.x, y: position.y }}
                            className="pointer-events-auto"
                          >
                            <button
                              onClick={() => {
                                if (!isDesignMode) button.onClick();
                              }}
                              disabled={button.key === "share" && sharingId === activePageRecord.id}
                              className={`group flex flex-col items-center gap-2 ${isDesignMode ? "cursor-move" : ""}`}
                            >
                              <div
                                className={`rounded-full border border-white/30 bg-white/20 p-3 shadow-xl backdrop-blur-md transition-all group-hover:bg-white/40 ${
                                  isDesignMode ? "ring-2 ring-purple-400" : ""
                                } ${
                                  (button.key === "rsvp" && activeTab === "rsvp") ||
                                  (button.key === "details" && activeTab === "details") ||
                                  (button.key === "location" && activeTab === "location") ||
                                  (button.key === "calendar" && activeTab === "calendar") ||
                                  (button.key === "registry" && activeTab === "registry")
                                    ? "border-white/50 bg-white/40"
                                    : ""
                                }`}
                              >
                                <Icon
                                  className={`h-5 w-5 ${
                                    button.key === "share" && sharingId === activePageRecord.id
                                      ? "animate-spin text-white"
                                      : button.key === "share" && copySuccess
                                        ? "text-green-400"
                                        : "text-white"
                                  }`}
                                />
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                                {button.label}
                              </span>
                            </button>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-purple-600/5 blur-[120px]" />
    </div>
  );
}

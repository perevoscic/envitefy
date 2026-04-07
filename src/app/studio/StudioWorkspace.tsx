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

function getPresetsForDetails(details: EventDetails): Preset[] {
  if (details.category === "Birthday") {
    const birthdayPresets = buildBirthdayPresets(details.age);
    return [...birthdayPresets.female, ...birthdayPresets.male];
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
  const currentPresets = getPresetsForDetails(details);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-purple-200">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-center px-6">
          <div className="hidden items-center gap-6 text-sm font-medium text-neutral-500 md:flex">
            <button
              onClick={() => setStep("form")}
              className={`transition-colors hover:text-purple-600 ${step === "form" ? "text-purple-600" : ""}`}
            >
              Details
            </button>
            <button
              onClick={() => {
                if (isFormValid()) setStep("studio");
              }}
              disabled={!isFormValid()}
              className={`transition-colors hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-30 ${step === "studio" ? "text-purple-600" : ""}`}
            >
              Studio
            </button>
            <button
              onClick={() => setStep("library")}
              className={`transition-colors hover:text-purple-600 ${step === "library" ? "text-purple-600" : ""}`}
            >
              Library
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <AnimatePresence mode="wait">
          {step === "category" ? (
            <motion.div
              key="category"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-4xl space-y-12"
            >
              <div className="space-y-4 text-center">
                <h2 className="text-4xl font-bold tracking-tight text-neutral-900">
                  What are we celebrating?
                </h2>
                <p className="text-neutral-500">
                  Select a category to start your invitation journey.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const active = details.category === category.name;
                  return (
                    <motion.button
                      key={category.name}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setDetails((prev) => ({ ...prev, category: category.name }));
                        setStep("form");
                      }}
                      className={`flex flex-col items-center gap-4 rounded-[2rem] border p-8 transition-all ${
                        active
                          ? "border-purple-500 bg-purple-600 text-white shadow-2xl shadow-purple-500/20"
                          : "border-neutral-200 bg-white text-neutral-900 shadow-sm hover:border-neutral-300"
                      }`}
                    >
                      <div
                        className={`rounded-2xl p-4 ${active ? "bg-white/20" : "bg-neutral-100"}`}
                      >
                        <Icon className="h-8 w-8" />
                      </div>
                      <span className="text-sm font-bold tracking-tight">{category.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}

          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mx-auto max-w-6xl space-y-12"
            >
              <div className="mb-8 flex items-center gap-4">
                <button
                  onClick={() => setStep("category")}
                  className="rounded-full border border-neutral-200 bg-white p-2 transition-colors hover:bg-neutral-100"
                >
                  <ArrowLeft className="h-5 w-5 text-neutral-900" />
                </button>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                    {details.category} Details
                  </h2>
                  <p className="text-neutral-500">
                    Fill in the event info for your {details.category.toLowerCase()}.
                  </p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl shadow-purple-500/5">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-600/10 p-2 text-purple-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900">Required Information</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {(CATEGORY_FIELDS[details.category] || [])
                      .filter((field) => field.required)
                      .map((field) => (
                        <div
                          key={field.key}
                          className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                        >
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                            {field.label} <span className="text-red-500">*</span>
                          </label>
                          {field.type === "textarea" ? (
                            <textarea
                              placeholder={field.placeholder}
                              className="min-h-[80px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                              value={String(inputValue(details[field.key]))}
                              onChange={(event) =>
                                setDetails((prev) => ({ ...prev, [field.key]: event.target.value }))
                              }
                            />
                          ) : field.type === "select" ? (
                            <select
                              className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                          {field.label} <span className="text-red-500">*</span>
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
                            className={`w-full rounded-xl border border-neutral-200 bg-white py-3 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
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
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                          {field.label} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                          value={String(inputValue(details[field.key]))}
                          onChange={(event) =>
                            setDetails((prev) => ({ ...prev, [field.key]: event.target.value }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
                  <button
                    onClick={() => setIsOptionalCollapsed((prev) => !prev)}
                    className="group flex w-full items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-neutral-100 p-2 text-neutral-500 transition-colors group-hover:bg-neutral-200">
                        <Plus className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900">Optional Details</h3>
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
                      className="space-y-12 border-t border-neutral-100 pt-6"
                    >
                      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {(CATEGORY_FIELDS[details.category] || [])
                          .filter((field) => !field.required)
                          .map((field) => (
                            <div
                              key={field.key}
                              className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                            >
                              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                                {field.label}
                              </label>
                              {field.type === "textarea" ? (
                                <textarea
                                  placeholder={field.placeholder}
                                  className="min-h-[80px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                  value={String(inputValue(details[field.key]))}
                                  onChange={(event) =>
                                    setDetails((prev) => ({
                                      ...prev,
                                      [field.key]: event.target.value,
                                    }))
                                  }
                                />
                              ) : field.type === "checkbox" ? (
                                <div className="flex items-center gap-3 py-2">
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
                                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                              {field.label}
                            </label>
                            <div className="relative">
                              {field.key === "endTime" ? (
                                <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                              ) : null}
                              <input
                                type={field.type}
                                placeholder={field.placeholder}
                                className={`w-full rounded-xl border border-neutral-200 bg-white py-3 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
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
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                              {field.label}
                            </label>
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                              value={String(inputValue(details[field.key]))}
                              onChange={(event) =>
                                setDetails((prev) => ({ ...prev, [field.key]: event.target.value }))
                              }
                            />
                          </div>
                        ))}

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                            Personal Message
                          </label>
                          <textarea
                            placeholder="e.g. We can't wait to see you there!"
                            className="min-h-[80px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            value={details.message}
                            onChange={(event) =>
                              setDetails((prev) => ({ ...prev, message: event.target.value }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                            Special Instructions
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Parking info, entrance code"
                            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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

                      <div className="border-t border-neutral-100 pt-8">
                        <div className="mb-6 flex items-center gap-3">
                          <div className="rounded-lg bg-pink-600/10 p-2 text-pink-600">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <h4 className="text-lg font-bold text-neutral-900">Design Preferences</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                              Orientation
                            </label>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setDetails((prev) => ({ ...prev, orientation: "portrait" }))
                                }
                                className={`flex-1 rounded-xl border py-3 text-xs font-bold transition-all ${
                                  details.orientation === "portrait"
                                    ? "border-purple-500 bg-purple-600 text-white"
                                    : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
                                }`}
                              >
                                Portrait
                              </button>
                              <button
                                onClick={() =>
                                  setDetails((prev) => ({ ...prev, orientation: "landscape" }))
                                }
                                className={`flex-1 rounded-xl border py-3 text-xs font-bold transition-all ${
                                  details.orientation === "landscape"
                                    ? "border-purple-500 bg-purple-600 text-white"
                                    : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
                                }`}
                              >
                                Landscape
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                              Preferred Colors
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Red and gold"
                              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                              value={details.colors}
                              onChange={(event) =>
                                setDetails((prev) => ({ ...prev, colors: event.target.value }))
                              }
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2 lg:col-span-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                              Visual Style Idea
                            </label>
                            <textarea
                              placeholder="e.g. Editorial premiere poster with red carpet lighting..."
                              className="min-h-[80px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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

              <div className="flex flex-col items-center gap-4 pt-8">
                <p className="text-[10px] uppercase tracking-widest text-neutral-600">
                  <span className="mr-1 text-red-500">*</span> Required fields
                </p>
                <button
                  onClick={() => setStep("studio")}
                  disabled={!isFormValid()}
                  className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-12 py-5 text-lg font-bold text-white shadow-2xl shadow-neutral-200 transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingId ? "Update Invitation" : "Enter Studio"}
                  <ChevronRight className="h-6 w-6 text-white" />
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
              className="space-y-8"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                    Your Library
                  </h2>
                  <p className="text-neutral-500">Manage and edit your created invitations.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setStep("form");
                  }}
                  className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-700"
                >
                  <Plus className="h-5 w-5" />
                  Create New
                </button>
              </div>

              {mediaList.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-neutral-200 bg-white py-20 text-center">
                  <div className="mx-auto mb-4 w-fit rounded-full bg-neutral-50 p-4">
                    <ImageIcon className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500">No invitations created yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {mediaList.map((item) => (
                    <motion.div
                      key={item.id}
                      layoutId={item.id}
                      className="group overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm transition-all hover:border-purple-500/50 hover:shadow-xl"
                    >
                      <div className="relative aspect-[9/16] overflow-hidden">
                        {item.status === "loading" ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-neutral-50">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                          </div>
                        ) : (
                          <>
                            <img
                              src={item.url}
                              alt={item.theme}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                              {item.type === "page" ? (
                                <button
                                  onClick={() => setActivePage(item)}
                                  className="flex items-center gap-2 rounded-full bg-neutral-900 px-8 py-4 text-lg font-bold text-white transition-transform hover:scale-105"
                                >
                                  <Layout className="h-5 w-5" />
                                  Open Live Card
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedImage(item)}
                                  className="flex items-center gap-2 rounded-full bg-neutral-900 px-8 py-4 text-lg font-bold text-white transition-transform hover:scale-105"
                                >
                                  <ImageIcon className="h-5 w-5" />
                                  View Full Image
                                </button>
                              )}
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => {
                                    setDetails(item.details);
                                    setEditingId(item.id);
                                    setIsOptionalCollapsed(false);
                                    setStep("form");
                                  }}
                                  className="rounded-full bg-purple-600 p-4 text-white shadow-lg transition-transform hover:scale-110"
                                  title="Edit"
                                >
                                  <RefreshCw className="h-6 w-6" />
                                </button>
                                <button
                                  onClick={() => downloadMedia(item)}
                                  className="rounded-full border border-neutral-200 bg-white p-4 text-neutral-900 shadow-lg transition-transform hover:scale-110"
                                  title="Download"
                                >
                                  <Download className="h-6 w-6" />
                                </button>
                                <button
                                  onClick={() => deleteMedia(item.id)}
                                  className="rounded-full border border-neutral-200 bg-white p-4 text-red-500 shadow-lg transition-transform hover:scale-110"
                                  title="Delete"
                                >
                                  <Trash2 className="h-6 w-6" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="absolute left-4 top-4 flex gap-2">
                          <span className="rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-900 backdrop-blur-md">
                            {item.type === "page" ? "Live Card" : "Image"}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteMedia(item.id)}
                          className="absolute right-4 top-4 rounded-full border border-neutral-200 bg-white/90 p-2 text-red-500 shadow-sm transition-colors hover:bg-white hover:text-red-600"
                          title="Delete from library"
                          aria-label={`Delete ${item.type === "page" ? "live card" : "image"} from library`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-6">
                        <h3 className="truncate text-lg font-bold text-neutral-900">
                          {getDisplayTitle(item.details)}
                        </h3>
                        <p className="text-xs uppercase tracking-widest text-neutral-500">
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
              className="grid gap-12 lg:grid-cols-[350px_1fr]"
            >
              <aside className="space-y-8">
                <button
                  onClick={() => setStep("form")}
                  className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-purple-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Details
                </button>

                <div className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500">
                    Select a Preset
                  </h2>
                  <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                    {details.category !== "Birthday" ? (
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-purple-600/10 p-2 text-purple-600">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-neutral-900">
                          {details.category} Presets
                        </span>
                      </div>
                    ) : null}

                    {details.category === "Birthday" && birthdayPresets ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {([{ key: "female" }, { key: "male" }] as const).map((column) => (
                            <div key={column.key} className="space-y-2">
                              {(column.key === "female"
                                ? birthdayPresets.female
                                : birthdayPresets.male
                              ).map((preset) => {
                                const Icon = preset.icon;
                                const active = details.theme === preset.name;
                                return (
                                  <button
                                    key={preset.id}
                                    onClick={() =>
                                      setDetails((prev) => ({ ...prev, theme: preset.name }))
                                    }
                                    className={`w-full rounded-2xl border p-3 text-left transition-all ${
                                      active
                                        ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500/20"
                                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={`mt-0.5 rounded-lg p-2 ${
                                          active
                                            ? "bg-purple-600 text-white"
                                            : "bg-neutral-100 text-purple-600"
                                        }`}
                                      >
                                        <Icon className="h-3.5 w-3.5" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-neutral-900">
                                          {preset.name}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ))}
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
                              className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border text-left transition-all ${
                                active
                                  ? "border-purple-500 ring-2 ring-purple-500/20"
                                  : "border-neutral-200 hover:border-neutral-300"
                              }`}
                            >
                              <img
                                src={preset.thumbnail}
                                alt={preset.name}
                                className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-80"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-white/90 via-white/20 to-transparent p-3">
                                <div className="mb-1 flex items-center gap-1.5">
                                  <div className="rounded-md border border-neutral-200 bg-white/80 p-1 backdrop-blur-sm">
                                    <Icon className="h-3 w-3 text-purple-600" />
                                  </div>
                                  <span className="line-clamp-2 text-[10px] font-bold leading-tight text-neutral-900">
                                    {preset.name}
                                  </span>
                                </div>
                                <span className="line-clamp-2 text-[8px] leading-tight text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100">
                                  {preset.description}
                                </span>
                              </div>
                              {active ? (
                                <div className="absolute right-2 top-2 rounded-full bg-purple-500 p-1 shadow-lg">
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                              ) : null}
                            </button>
                          );
                        })}

                        {currentPresets.length === 0 ? (
                          <div className="col-span-2 py-8 text-center">
                            <p className="text-[10px] italic text-neutral-600">
                              No presets for this category yet. Use a custom idea below.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="border-t border-neutral-100 pt-2">
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                        Custom Visual Idea
                      </label>
                      <textarea
                        placeholder="e.g. A minimalist gold and white theme with marble textures..."
                        className="min-h-[80px] w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        value={details.theme}
                        onChange={(event) =>
                          setDetails((prev) => ({ ...prev, theme: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500">
                    Generate Media
                  </h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => generateMedia("page")}
                      disabled={isGenerating}
                      className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-neutral-900 py-4 font-bold text-white shadow-xl shadow-neutral-200 transition-all hover:bg-neutral-800 disabled:opacity-50"
                    >
                      <Layout className="h-5 w-5" />
                      Create Live Card
                      <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>

                    <button
                      onClick={() => generateMedia("image")}
                      disabled={isGenerating}
                      className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white py-4 font-bold text-neutral-900 shadow-sm transition-all hover:bg-neutral-50 disabled:opacity-50"
                    >
                      <ImageIcon className="h-5 w-5" />
                      Generate Image
                      <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>
                  </div>
                  <p className="text-center text-[10px] uppercase tracking-widest text-neutral-500">
                    Powered by Gemini 3 &amp; Veo 3.1
                  </p>
                </div>
              </aside>

              <section className="space-y-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-3xl font-bold text-neutral-900">Your Studio</h2>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Saved to local library</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence>
                    {mediaList.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-xl"
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
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {item.status === "ready" ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                              {item.type === "page" ? (
                                <button
                                  onClick={() => setActivePage(item)}
                                  className="flex items-center gap-2 rounded-full bg-neutral-900 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
                                >
                                  <Layout className="h-5 w-5" />
                                  Open Live Card
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedImage(item)}
                                  className="flex items-center gap-2 rounded-full bg-neutral-900 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
                                >
                                  <ImageIcon className="h-5 w-5" />
                                  View Full Image
                                </button>
                              )}

                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => downloadMedia(item)}
                                  className="rounded-full border border-neutral-200 bg-white p-4 text-neutral-900 shadow-lg transition-transform hover:scale-110"
                                  title="Download"
                                >
                                  <Download className="h-6 w-6" />
                                </button>
                                <button
                                  onClick={() => shareMedia(item)}
                                  disabled={sharingId === item.id}
                                  className="rounded-full border border-neutral-200 bg-white p-4 text-neutral-900 shadow-lg transition-transform hover:scale-110"
                                  title={sharingId === item.id ? "Creating share link" : "Share"}
                                >
                                  {sharingId === item.id ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                  ) : copySuccess ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                  ) : (
                                    <Share2 className="h-6 w-6" />
                                  )}
                                </button>
                                <button
                                  onClick={() => deleteMedia(item.id)}
                                  className="rounded-full border border-neutral-200 bg-white p-4 text-red-500 shadow-lg transition-transform hover:scale-110"
                                  title="Delete"
                                >
                                  <Trash2 className="h-6 w-6" />
                                </button>
                              </div>
                            </div>
                          ) : null}

                          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-900 backdrop-blur-md">
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
                            className="absolute right-4 top-4 rounded-full border border-neutral-200 bg-white/90 p-2 text-red-500 shadow-sm transition-colors hover:bg-white hover:text-red-600"
                            title="Delete from library"
                            aria-label={`Delete ${item.type === "page" ? "live card" : "image"} from library`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-1 p-6">
                          <h3 className="truncate text-lg font-bold text-neutral-900">
                            {getStudioShareTitle(item)}
                          </h3>
                          <p className="text-xs uppercase tracking-widest text-neutral-500">
                            {item.theme}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {mediaList.length === 0 ? (
                      <div className="col-span-full rounded-3xl border-2 border-dashed border-neutral-200 bg-white py-32 text-center">
                        <div className="mb-6 inline-flex rounded-full bg-neutral-50 p-6">
                          <Sparkles className="h-12 w-12 text-neutral-300" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-neutral-900">
                          No media generated yet
                        </h3>
                        <p className="mx-auto max-w-xs text-neutral-500">
                          Select a theme and choose a media type to start your creative journey.
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

              <div className="absolute left-0 right-0 top-0 flex h-8 items-center justify-between px-8 text-[10px] font-bold text-white/50">
                <span>9:41</span>
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-full bg-white/20" />
                  <div className="h-3 w-3 rounded-full bg-white/20" />
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

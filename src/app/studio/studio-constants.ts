import {
  Baby,
  CalendarHeart,
  Flower2,
  Heart,
  House,
  MapPinned,
  PartyPopper,
  WandSparkles,
} from "lucide-react";
import type {
  StudioCategoryDefinition,
  StudioCreateStep,
  StudioWorkspaceView,
} from "./studio-types";

/** Browser local cache for Studio library (same key historically used by the workspace). */
export const STUDIO_LIBRARY_STORAGE_KEY = "envitefy_media";

export const STUDIO_CREATE_STEPS: Array<{ id: StudioCreateStep; label: string }> = [
  { id: "type", label: "Type" },
  { id: "details", label: "Details" },
  { id: "editor", label: "Editor" },
];

export const STUDIO_WORKSPACE_VIEWS: Array<{ id: StudioWorkspaceView; label: string }> = [
  { id: "create", label: "Create" },
  { id: "library", label: "Library" },
];

export const STUDIO_CATEGORIES: StudioCategoryDefinition[] = [
  {
    id: "birthday",
    label: "Birthday",
    icon: PartyPopper,
    description: "Party invites for birthdays, milestone dinners, and family celebrations.",
    pill: "Party",
    suggestedTone: "Fun and warm",
    suggestedStyle: "Colorful modern",
    dynamicFields: [
      {
        id: "birthday_age",
        label: "Age or milestone",
        placeholder: "Turning 30 / Sweet 16 / Retirement",
      },
      {
        id: "birthday_theme",
        label: "Theme highlight",
        placeholder: "Garden brunch, disco night, rooftop sunset",
      },
    ],
  },
  {
    id: "field-trip-day",
    label: "Field Trip/Day",
    icon: MapPinned,
    description: "School outings, class trips, and daytime group adventures.",
    pill: "School",
    suggestedTone: "Clear and upbeat",
    suggestedStyle: "Friendly editorial",
    dynamicFields: [
      {
        id: "field_trip_group",
        label: "Group or class",
        placeholder: "Third grade, youth group, STEM club",
      },
      {
        id: "field_trip_activity",
        label: "Activity focus",
        placeholder: "Museum visit, park day, aquarium tour",
      },
    ],
  },
  {
    id: "bridal-shower",
    label: "Bridal Shower",
    icon: Flower2,
    description: "Bridal showers, tea parties, and pre-wedding celebrations.",
    pill: "Bridal",
    suggestedTone: "Elegant and warm",
    suggestedStyle: "Soft romantic",
    dynamicFields: [
      {
        id: "bridal_names",
        label: "Honoree names",
        placeholder: "Mia and Sophie",
      },
      {
        id: "bridal_theme",
        label: "Theme or vibe",
        placeholder: "Tea service, garden brunch, champagne lunch",
      },
    ],
  },
  {
    id: "wedding",
    label: "Wedding",
    icon: Heart,
    description: "Save-the-dates, ceremonies, receptions, and wedding weekends.",
    pill: "Classic",
    suggestedTone: "Elegant and heartfelt",
    suggestedStyle: "Romantic editorial",
    dynamicFields: [
      {
        id: "wedding_couple",
        label: "Couple names",
        placeholder: "Avery & Jordan",
      },
      {
        id: "wedding_reception",
        label: "Reception style",
        placeholder: "Cocktail reception, seated dinner, weekend getaway",
      },
    ],
  },
  {
    id: "housewarming",
    label: "Housewarming",
    icon: House,
    description: "Open houses, move-in parties, and new-home celebrations.",
    pill: "Home",
    suggestedTone: "Friendly and inviting",
    suggestedStyle: "Clean cozy",
    dynamicFields: [
      {
        id: "housewarming_address",
        label: "Neighborhood or city",
        placeholder: "East Austin, South Loop, Greenpoint",
      },
      {
        id: "housewarming_note",
        label: "Hosting note",
        placeholder: "Bring a bottle, shoes off, come see the new place",
      },
    ],
  },
  {
    id: "baby-shower",
    label: "Baby Shower",
    icon: Baby,
    description: "Baby showers, sip-and-sees, and family gifting events.",
    pill: "Baby",
    suggestedTone: "Sweet and welcoming",
    suggestedStyle: "Soft playful",
    dynamicFields: [
      {
        id: "shower_parent_names",
        label: "Parents or honoree names",
        placeholder: "Taylor and Chris",
      },
      {
        id: "shower_registry_focus",
        label: "Gift preferences",
        placeholder: "Books instead of cards, diaper raffle, registry link",
      },
    ],
  },
  {
    id: "anniversary",
    label: "Anniversary",
    icon: CalendarHeart,
    description: "Anniversaries, vow renewals, and milestone dinners.",
    pill: "Milestone",
    suggestedTone: "Warm and celebratory",
    suggestedStyle: "Elegant classic",
    dynamicFields: [
      {
        id: "anniversary_years",
        label: "Years together",
        placeholder: "5 years, 25 years, golden anniversary",
      },
      {
        id: "anniversary_style",
        label: "Celebration style",
        placeholder: "Dinner party, backyard toast, weekend trip",
      },
    ],
  },
  {
    id: "custom-invite",
    label: "Custom Invite",
    icon: WandSparkles,
    description: "Flexible invites for anything that does not fit a template.",
    pill: "Custom",
    suggestedTone: "Adaptable and clear",
    suggestedStyle: "Minimal flexible",
    dynamicFields: [
      {
        id: "custom_context",
        label: "What are you making?",
        placeholder: "Launch party, club night, family reunion, anything else",
      },
      {
        id: "custom_essence",
        label: "What should stand out?",
        placeholder: "The vibe, the location, the reason to come together",
      },
    ],
  },
];

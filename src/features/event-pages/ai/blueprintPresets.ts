import type { EventPageMode, EventSectionType, EventTheme } from "../schemas/eventBlueprint.schema";

export type EventPageBlueprintPreset = {
  mode: EventPageMode;
  label: string;
  migrationTargets: string[];
  defaultSections: EventSectionType[];
  theme: EventTheme;
};

export const DYNAMIC_EVENT_PAGE_BLUEPRINT_PRESETS: EventPageBlueprintPreset[] = [
  {
    mode: "gymnastics_meet",
    label: "Gymnastics meet",
    migrationTargets: ["gym-meet-templates", "event/gymnastics/customize"],
    defaultSections: [
      "hero",
      "quick_details",
      "schedule_timeline",
      "team_notes",
      "location",
      "checklist",
      "rsvp",
    ],
    theme: {
      mood: "sporty_premium",
      formality: "semi_formal",
      visualDensity: "high",
      palette: "violet_sky_rose",
      typography: "clean",
      heroStyle: "dashboard",
      sectionRhythm: "compact",
      backgroundTreatment: "soft_gradient",
      colors: {
        primary: "#4B42D6",
        secondary: "#F1A9C8",
        background: "#F5F7FF",
        surface: "#FFFFFF",
        text: "#171A2A",
        mutedText: "#596075",
      },
    },
  },
  {
    mode: "wedding_weekend",
    label: "Wedding weekend",
    migrationTargets: ["event/weddings/_renderers", "templates/weddings"],
    defaultSections: [
      "hero",
      "quick_details",
      "schedule_timeline",
      "travel",
      "registry",
      "faq",
      "rsvp",
    ],
    theme: {
      mood: "elegant_romantic",
      formality: "formal",
      visualDensity: "medium",
      palette: "soft_blush_ink",
      typography: "editorial",
      heroStyle: "editorial",
      sectionRhythm: "spacious",
      backgroundTreatment: "soft_gradient",
      colors: {
        primary: "#6B4E71",
        secondary: "#D6A6A6",
        background: "#FBF6F4",
        surface: "#FFFFFF",
        text: "#2B2430",
        mutedText: "#6D6372",
      },
    },
  },
  {
    mode: "shower_or_registry_event",
    label: "Shower or registry event",
    migrationTargets: ["BabyShowerTemplateView", "event/baby-showers", "bridal-showers"],
    defaultSections: ["hero", "quick_details", "registry", "people", "location", "faq", "rsvp"],
    theme: {
      mood: "warm_polished",
      formality: "semi_formal",
      visualDensity: "medium",
      palette: "rose_sage_ivory",
      typography: "rounded",
      heroStyle: "editorial",
      sectionRhythm: "balanced",
      backgroundTreatment: "soft_gradient",
      colors: {
        primary: "#8D4F63",
        secondary: "#9FB99D",
        background: "#FFF7F5",
        surface: "#FFFFFF",
        text: "#2B2428",
        mutedText: "#6E6268",
      },
    },
  },
  {
    mode: "sports_team_event",
    label: "Sports team event",
    migrationTargets: ["football-discovery", "event/football-season", "event/sport-events"],
    defaultSections: [
      "hero",
      "quick_details",
      "schedule_timeline",
      "team_notes",
      "location",
      "checklist",
      "rsvp",
    ],
    theme: {
      mood: "structured_team",
      formality: "casual",
      visualDensity: "high",
      palette: "green_gold_charcoal",
      typography: "clean",
      heroStyle: "dashboard",
      sectionRhythm: "compact",
      backgroundTreatment: "solid",
      colors: {
        primary: "#176B5D",
        secondary: "#D5A843",
        background: "#F3F7F1",
        surface: "#FFFFFF",
        text: "#18201F",
        mutedText: "#5D6764",
      },
    },
  },
  {
    mode: "simple_social_event",
    label: "Simple social event",
    migrationTargets: ["event-templates/BirthdaysTemplate", "BirthdaySkin", "GenericEventSkin"],
    defaultSections: ["hero", "quick_details", "people", "location", "registry", "rsvp"],
    theme: {
      mood: "warm_event_hub",
      formality: "casual",
      visualDensity: "medium",
      palette: "envitefy_warm",
      typography: "rounded",
      heroStyle: "dashboard",
      sectionRhythm: "balanced",
      backgroundTreatment: "soft_gradient",
      colors: {
        primary: "#5B4DCC",
        secondary: "#F3B3C8",
        background: "#F8F6FF",
        surface: "#FFFFFF",
        text: "#1F2233",
        mutedText: "#606579",
      },
    },
  },
];

export function findEventPageBlueprintPreset(mode: EventPageMode): EventPageBlueprintPreset | null {
  return DYNAMIC_EVENT_PAGE_BLUEPRINT_PRESETS.find((preset) => preset.mode === mode) || null;
}

import type { EventPageMode, EventSectionType } from "../schemas/eventBlueprint.schema";

export type EventPageVerticalParityScenario = {
  id: string;
  mode: EventPageMode;
  label: string;
  legacyRoutes: string[];
  legacyComponents: string[];
  requiredSections: EventSectionType[];
  requiredChecks: string[];
};

export const EVENT_PAGE_VERTICAL_PARITY_SCENARIOS: EventPageVerticalParityScenario[] = [
  {
    id: "gymnastics-meet",
    mode: "gymnastics_meet",
    label: "Gymnastics meet",
    legacyRoutes: ["/event/gymnastics", "/event/gymnastics/customize"],
    legacyComponents: ["src/components/gym-meet-templates/*"],
    requiredSections: [
      "hero",
      "quick_details",
      "schedule_timeline",
      "team_notes",
      "location",
      "checklist",
      "rsvp",
    ],
    requiredChecks: [
      "desktop_screenshot",
      "mobile_screenshot",
      "arrival_time_visible",
      "schedule_scan_mobile",
      "directions_action",
      "rsvp_action",
    ],
  },
  {
    id: "wedding-weekend",
    mode: "wedding_weekend",
    label: "Wedding weekend",
    legacyRoutes: ["/event/weddings", "/event/weddings/customize"],
    legacyComponents: ["src/app/event/weddings/_renderers/*", "templates/weddings/*"],
    requiredSections: [
      "hero",
      "quick_details",
      "schedule_timeline",
      "travel",
      "registry",
      "faq",
      "rsvp",
    ],
    requiredChecks: [
      "desktop_screenshot",
      "mobile_screenshot",
      "ceremony_reception_visible",
      "registry_action",
      "travel_hotel_visible",
      "rsvp_action",
    ],
  },
  {
    id: "shower-registry",
    mode: "shower_or_registry_event",
    label: "Bridal or baby shower with registry",
    legacyRoutes: ["/baby-showers", "/bridal-showers", "/event/baby-showers"],
    legacyComponents: ["src/components/BabyShowerTemplateView.tsx"],
    requiredSections: ["hero", "quick_details", "registry", "people", "location", "faq", "rsvp"],
    requiredChecks: [
      "desktop_screenshot",
      "mobile_screenshot",
      "host_notes_visible",
      "registry_action",
      "location_action",
      "rsvp_action",
    ],
  },
  {
    id: "birthday-party",
    mode: "simple_social_event",
    label: "Birthday party",
    legacyRoutes: ["/birthdays", "/event/birthdays", "/event/birthdays/customize"],
    legacyComponents: ["src/components/BirthdaySkin.tsx", "src/components/event-templates/BirthdaysTemplate.tsx"],
    requiredSections: ["hero", "quick_details", "people", "location", "registry", "rsvp"],
    requiredChecks: [
      "desktop_screenshot",
      "mobile_screenshot",
      "age_or_honoree_visible",
      "gift_notes_visible_when_present",
      "location_action",
      "rsvp_action",
    ],
  },
  {
    id: "football-team-schedule",
    mode: "sports_team_event",
    label: "Football or team schedule",
    legacyRoutes: ["/event/football-season", "/event/sport-events", "/event/football"],
    legacyComponents: ["src/components/football-discovery/*", "src/components/event-templates/FootballSeasonTemplate.tsx"],
    requiredSections: [
      "hero",
      "quick_details",
      "schedule_timeline",
      "team_notes",
      "location",
      "checklist",
      "rsvp",
    ],
    requiredChecks: [
      "desktop_screenshot",
      "mobile_screenshot",
      "practice_and_game_schedule_visible",
      "team_notes_visible",
      "directions_action",
      "rsvp_action",
    ],
  },
];

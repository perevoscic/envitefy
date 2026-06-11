export type SportEventPreset = {
  key: string;
  label: string;
  shortLabel: string;
  routeLabel: string;
  defaultTitle: string;
  defaultDetails: string;
  opponentPlaceholder: string;
  leaguePlaceholder: string;
  venuePlaceholder: string;
  themeIds: string[];
};

export const SPORT_EVENT_PRESETS: SportEventPreset[] = [
  {
    key: "football",
    label: "Football",
    shortLabel: "Football",
    routeLabel: "Football Game",
    defaultTitle: "Friday Night Football",
    defaultDetails: "Game time, ticket links, parking, broadcast info, and team notes in one mobile page.",
    opponentPlaceholder: "vs Central High",
    leaguePlaceholder: "Varsity conference game",
    venuePlaceholder: "Memorial Stadium",
    themeIds: ["stadium_nights", "champion_red", "championship_gold"],
  },
  {
    key: "baseball",
    label: "Baseball",
    shortLabel: "Baseball",
    routeLabel: "Baseball Game",
    defaultTitle: "Baseball Game Day",
    defaultDetails: "Lineup notes, first pitch, field location, ticket info, and weather updates.",
    opponentPlaceholder: "vs Northside",
    leaguePlaceholder: "Little League / Varsity",
    venuePlaceholder: "Field 3",
    themeIds: ["championship_gold", "victory_blue", "forest_strong"],
  },
  {
    key: "softball",
    label: "Softball",
    shortLabel: "Softball",
    routeLabel: "Softball Game",
    defaultTitle: "Softball Game Day",
    defaultDetails: "Share field details, arrival time, opponent, concessions, and updates.",
    opponentPlaceholder: "vs East Ridge",
    leaguePlaceholder: "Tournament bracket",
    venuePlaceholder: "Softball Complex",
    themeIds: ["sunset_court", "championship_gold", "sapphire_sky"],
  },
  {
    key: "basketball",
    label: "Basketball",
    shortLabel: "Basketball",
    routeLabel: "Basketball Game",
    defaultTitle: "Basketball Game Night",
    defaultDetails: "Tipoff, gym entrance, ticket link, livestream, and fan notes.",
    opponentPlaceholder: "vs West Valley",
    leaguePlaceholder: "District game",
    venuePlaceholder: "Main Gym",
    themeIds: ["sunset_court", "midnight_elite", "champion_red"],
  },
  {
    key: "soccer",
    label: "Soccer",
    shortLabel: "Soccer",
    routeLabel: "Soccer Match",
    defaultTitle: "Soccer Match Day",
    defaultDetails: "Kickoff, field map, arrival notes, opponent, and weather updates.",
    opponentPlaceholder: "vs United FC",
    leaguePlaceholder: "Club / school match",
    venuePlaceholder: "Pitch 2",
    themeIds: ["electric_field", "energy_green", "victory_blue"],
  },
  {
    key: "volleyball",
    label: "Volleyball",
    shortLabel: "Volleyball",
    routeLabel: "Volleyball Match",
    defaultTitle: "Volleyball Match Day",
    defaultDetails: "Court location, match schedule, team notes, admissions, and livestream.",
    opponentPlaceholder: "vs Lakeside",
    leaguePlaceholder: "Tournament pool play",
    venuePlaceholder: "Court A",
    themeIds: ["elite_purple", "sunset_court", "victory_blue"],
  },
  {
    key: "hockey",
    label: "Hockey",
    shortLabel: "Hockey",
    routeLabel: "Hockey Game",
    defaultTitle: "Hockey Game Night",
    defaultDetails: "Puck drop, rink address, parking, tickets, and team arrival notes.",
    opponentPlaceholder: "vs Ice Hawks",
    leaguePlaceholder: "Travel / school game",
    venuePlaceholder: "Rink 1",
    themeIds: ["trophy_silver", "victory_blue", "midnight_elite"],
  },
  {
    key: "tennis",
    label: "Tennis",
    shortLabel: "Tennis",
    routeLabel: "Tennis Match",
    defaultTitle: "Tennis Match Day",
    defaultDetails: "Court assignments, start time, bracket notes, parking, and weather updates.",
    opponentPlaceholder: "vs Oak Park",
    leaguePlaceholder: "Singles / doubles match",
    venuePlaceholder: "Court 4",
    themeIds: ["electric_field", "teal_tenacity", "championship_gold"],
  },
  {
    key: "track-field",
    label: "Track & Field",
    shortLabel: "Track",
    routeLabel: "Track Meet",
    defaultTitle: "Track Meet",
    defaultDetails: "Meet schedule, heat sheets, venue map, parking, concessions, and awards notes.",
    opponentPlaceholder: "Invitational",
    leaguePlaceholder: "Track meet / relay event",
    venuePlaceholder: "Track Stadium",
    themeIds: ["dynamic_orange", "championship_gold", "stadium_nights"],
  },
  {
    key: "swimming",
    label: "Swimming",
    shortLabel: "Swim",
    routeLabel: "Swim Meet",
    defaultTitle: "Swim Meet",
    defaultDetails: "Warm-up times, meet schedule, pool location, admission, and results links.",
    opponentPlaceholder: "Dual meet",
    leaguePlaceholder: "Swim meet",
    venuePlaceholder: "Aquatic Center",
    themeIds: ["ocean_depth", "sapphire_sky", "teal_tenacity"],
  },
  {
    key: "wrestling",
    label: "Wrestling",
    shortLabel: "Wrestling",
    routeLabel: "Wrestling Meet",
    defaultTitle: "Wrestling Meet",
    defaultDetails: "Weigh-in notes, mat assignments, start time, tickets, and results information.",
    opponentPlaceholder: "vs South County",
    leaguePlaceholder: "Dual / tournament",
    venuePlaceholder: "Fieldhouse",
    themeIds: ["crimson_power", "midnight_elite", "trophy_silver"],
  },
  {
    key: "lacrosse",
    label: "Lacrosse",
    shortLabel: "Lacrosse",
    routeLabel: "Lacrosse Game",
    defaultTitle: "Lacrosse Game Day",
    defaultDetails: "Faceoff time, field location, opponent, ticket info, and team updates.",
    opponentPlaceholder: "vs River City",
    leaguePlaceholder: "Club / school game",
    venuePlaceholder: "Turf Field",
    themeIds: ["energy_green", "royal_navy", "championship_gold"],
  },
  {
    key: "cheerleading",
    label: "Cheerleading",
    shortLabel: "Cheer",
    routeLabel: "Cheer Event",
    defaultTitle: "Cheer Showcase",
    defaultDetails: "Performance times, arrival notes, venue details, tickets, and awards information.",
    opponentPlaceholder: "Showcase / competition",
    leaguePlaceholder: "Cheer competition",
    venuePlaceholder: "Convention Center",
    themeIds: ["elite_purple", "championship_gold", "champion_red"],
  },
  {
    key: "dance",
    label: "Dance",
    shortLabel: "Dance",
    routeLabel: "Dance Event",
    defaultTitle: "Dance Showcase",
    defaultDetails: "Performance schedule, arrival notes, venue details, tickets, and awards information.",
    opponentPlaceholder: "Showcase / competition",
    leaguePlaceholder: "Dance competition",
    venuePlaceholder: "Performing Arts Center",
    themeIds: ["violet_velocity", "sunset_court", "championship_gold"],
  },
];

export const DEFAULT_SPORT_EVENT_PRESET = SPORT_EVENT_PRESETS[0];

export function normalizeSportEventKey(value: unknown): string | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  return SPORT_EVENT_PRESETS.some((preset) => preset.key === normalized) ? normalized : null;
}

export function getSportEventPreset(value: unknown): SportEventPreset {
  const key = normalizeSportEventKey(value);
  return SPORT_EVENT_PRESETS.find((preset) => preset.key === key) || DEFAULT_SPORT_EVENT_PRESET;
}

export function buildSportEventCustomizeHref(sport: unknown, style?: string | null): string {
  const preset = getSportEventPreset(sport);
  const params = new URLSearchParams({ sport: preset.key });
  if (style) params.set("style", style);
  return `/event/sport-events/customize?${params.toString()}`;
}

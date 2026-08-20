import type { SportActivityProfile, SportEventArchetype } from "./types";

const profile = (value: SportActivityProfile) => value;

export const SPORT_ACTIVITY_PROFILES: SportActivityProfile[] = [
  profile({
    key: "gymnastics",
    label: "Gymnastics",
    aliases: ["gymnastics", "gym", "usag", "aaun gymnastics"],
    keywords: ["gymnastics", "rotation", "warm-up", "session", "level", "xcel", "vault"],
    parserFamily: "meet",
    defaultArchetype: "meet_competition",
    supportedArchetypes: ["meet_competition"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["sessions", "admission", "parking", "hotels", "results"],
  }),
  profile({
    key: "dance",
    label: "Dance",
    aliases: ["dance", "dance competition", "dance recital"],
    keywords: ["dance", "recital", "routine", "performance", "studio", "solo", "duet"],
    parserFamily: "meet",
    defaultArchetype: "showcase_clinic",
    supportedArchetypes: ["meet_competition", "showcase_clinic"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["performances", "divisions", "awards", "admission", "parking"],
  }),
  profile({
    key: "cheerleading",
    label: "Cheerleading",
    aliases: ["cheer", "cheerleading", "cheer competition"],
    keywords: ["cheer", "cheerleading", "performance order", "division", "warm-up mat"],
    parserFamily: "meet",
    defaultArchetype: "meet_competition",
    supportedArchetypes: ["meet_competition", "showcase_clinic"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["performances", "divisions", "awards", "admission", "parking"],
  }),
  profile({
    key: "football",
    label: "Football",
    aliases: ["football", "gridiron"],
    keywords: ["football", "kickoff", "touchdown", "quarterback", "varsity", "stadium"],
    parserFamily: "game",
    defaultArchetype: "game_match",
    supportedArchetypes: ["game_match", "season_schedule", "tournament"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["games", "roster", "practice", "tickets", "parking"],
  }),
  profile({
    key: "basketball",
    label: "Basketball",
    aliases: ["basketball", "hoops"],
    keywords: ["basketball", "tipoff", "tip-off", "gymnasium", "court", "varsity"],
    parserFamily: "game",
    defaultArchetype: "game_match",
    supportedArchetypes: ["game_match", "season_schedule", "tournament"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["games", "roster", "tickets", "parking", "livestream"],
  }),
  profile({
    key: "baseball",
    label: "Baseball",
    aliases: ["baseball"],
    keywords: ["baseball", "first pitch", "diamond", "ballpark", "doubleheader", "innings"],
    parserFamily: "game",
    defaultArchetype: "season_schedule",
    supportedArchetypes: ["game_match", "season_schedule", "tournament"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["games", "fields", "pools", "bracket", "parking"],
  }),
  profile({
    key: "softball",
    label: "Softball",
    aliases: ["softball", "fastpitch"],
    keywords: ["softball", "fastpitch", "first pitch", "diamond", "doubleheader", "pool play"],
    parserFamily: "game",
    defaultArchetype: "season_schedule",
    supportedArchetypes: ["game_match", "season_schedule", "tournament"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["games", "fields", "pools", "bracket", "parking"],
  }),
  profile({
    key: "soccer",
    label: "Soccer",
    aliases: ["soccer", "football club", "futbol"],
    keywords: ["soccer", "kickoff", "pitch", "fc", "pool play", "matchday"],
    parserFamily: "game",
    defaultArchetype: "game_match",
    supportedArchetypes: ["game_match", "season_schedule", "tournament"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["games", "fields", "pools", "bracket", "parking"],
  }),
  profile({
    key: "volleyball",
    label: "Volleyball",
    aliases: ["volleyball"],
    keywords: ["volleyball", "court", "pool play", "match", "sets", "libero"],
    parserFamily: "game",
    defaultArchetype: "tournament",
    supportedArchetypes: ["game_match", "season_schedule", "tournament"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["matches", "courts", "pools", "bracket", "admission"],
  }),
  profile({
    key: "hockey",
    label: "Hockey",
    aliases: ["hockey", "ice hockey"],
    keywords: ["hockey", "puck drop", "rink", "ice arena", "period", "faceoff"],
    parserFamily: "game",
    defaultArchetype: "game_match",
    supportedArchetypes: ["game_match", "season_schedule", "tournament"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["games", "roster", "tickets", "parking"],
  }),
  profile({
    key: "lacrosse",
    label: "Lacrosse",
    aliases: ["lacrosse", "lax"],
    keywords: ["lacrosse", "faceoff", "turf", "attack", "midfield", "goalie"],
    parserFamily: "game",
    defaultArchetype: "game_match",
    supportedArchetypes: ["game_match", "season_schedule", "tournament"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["games", "roster", "tickets", "parking"],
  }),
  profile({
    key: "tennis",
    label: "Tennis",
    aliases: ["tennis"],
    keywords: ["tennis", "singles", "doubles", "court assignment", "draw", "seed"],
    parserFamily: "game",
    defaultArchetype: "tournament",
    supportedArchetypes: ["game_match", "season_schedule", "tournament"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["matches", "courts", "draw", "results", "parking"],
  }),
  profile({
    key: "track-field",
    label: "Track & Field",
    aliases: ["track", "track and field", "track & field"],
    keywords: ["track", "field events", "heat sheet", "relay", "lane", "starting blocks"],
    parserFamily: "meet",
    defaultArchetype: "meet_competition",
    supportedArchetypes: ["meet_competition"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["events", "heats", "admission", "parking", "results"],
  }),
  profile({
    key: "swimming",
    label: "Swimming",
    aliases: ["swim", "swimming"],
    keywords: ["swim", "swimming", "warm-up", "heat sheet", "lane", "aquatic center"],
    parserFamily: "meet",
    defaultArchetype: "meet_competition",
    supportedArchetypes: ["meet_competition"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["events", "heats", "admission", "parking", "results"],
  }),
  profile({
    key: "wrestling",
    label: "Wrestling",
    aliases: ["wrestling"],
    keywords: ["wrestling", "weigh-in", "mat assignment", "weight class", "dual meet"],
    parserFamily: "meet",
    defaultArchetype: "meet_competition",
    supportedArchetypes: ["meet_competition", "tournament"],
    requiredFields: ["title", "startAt", "venue"],
    optionalSections: ["matches", "mats", "weigh-ins", "bracket", "results"],
  }),
];

const PROFILE_BY_KEY = new Map(SPORT_ACTIVITY_PROFILES.map((item) => [item.key, item]));

export function normalizeSportActivityKey(value: unknown): string | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  if (!normalized || normalized === "auto") return null;
  const direct = PROFILE_BY_KEY.get(normalized);
  if (direct) return direct.key;
  return (
    SPORT_ACTIVITY_PROFILES.find((item) =>
      item.aliases.some((alias) => alias.toLowerCase() === normalized),
    )?.key || null
  );
}

export function getSportActivityProfile(value: unknown): SportActivityProfile | null {
  const key = normalizeSportActivityKey(value);
  return key ? PROFILE_BY_KEY.get(key) || null : null;
}

export function normalizeSportEventArchetype(value: unknown): SportEventArchetype | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const allowed: SportEventArchetype[] = [
    "meet_competition",
    "game_match",
    "season_schedule",
    "tournament",
    "showcase_clinic",
  ];
  return allowed.includes(normalized as SportEventArchetype)
    ? (normalized as SportEventArchetype)
    : null;
}

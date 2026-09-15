export type SportScheduleItems = "Games" | "Meets" | "Matches";

export type SportsScheduleSummary = {
  sport: string;
  itemsLabel: SportScheduleItems;
  itemCount: number;
  season: string;
};

const SPORTS = [
  { sport: "Football", itemsLabel: "Games", pattern: /\b(?:football|gridiron)\b/i },
  { sport: "Basketball", itemsLabel: "Games", pattern: /\b(?:basketball|hoops)\b/i },
  { sport: "Baseball", itemsLabel: "Games", pattern: /\bbaseball\b/i },
  { sport: "Gymnastics", itemsLabel: "Meets", pattern: /\bgymnastics\b/i },
  { sport: "Swimming", itemsLabel: "Meets", pattern: /\bswim(?:ming)?\b/i },
  { sport: "Track & Field", itemsLabel: "Meets", pattern: /\btrack\b/i },
  { sport: "Soccer", itemsLabel: "Matches", pattern: /\b(?:soccer|futbol|football club)\b/i },
  { sport: "Tennis", itemsLabel: "Matches", pattern: /\btennis\b/i },
  { sport: "Volleyball", itemsLabel: "Matches", pattern: /\bvolleyball\b/i },
] satisfies Array<{ sport: string; itemsLabel: SportScheduleItems; pattern: RegExp }>;

const SPORT_PATHS = [
  "activityProfile",
  "sport",
  "extra.sport",
  "customFields.sport",
  "event.sport",
  "templateEditor.category",
  "category",
  "templateId",
  "createdVia",
];
const SEASON_PATHS = [
  "extra.season",
  "customFields.season",
  "schedule.season",
  "season",
  "scanSchedule.timeframe",
];
const ARCHETYPE_PATHS = [
  "eventArchetype",
  "archetype",
  "discoverySource.eventArchetype",
  "discoverySource.parseResult.eventArchetype",
];
const ENTRY_PATHS = [
  "advancedSections.games.games",
  "customFields.advancedSections.games.games",
  "discoverySource.parseResult.games",
  "schedule.games",
  "schedule.meets",
  "schedule.matches",
  "games",
  "meets",
  "matches",
  "scanSchedule.items",
  "schedule.items",
];

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function atPath(data: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => record(value)[key], data);
}

function firstText(data: Record<string, unknown>, paths: string[]): string {
  return paths.map((path) => text(atPath(data, path))).find(Boolean) || "";
}

/** Works with both full save responses and the small sidebar history projection. */
export function getSportsScheduleSummary(value: unknown, title = ""): SportsScheduleSummary | null {
  const data = record(value);
  const projected = record(data.sidebarSports);
  const hints = Array.isArray(projected.sportHints)
    ? projected.sportHints
    : SPORT_PATHS.map((path) => atPath(data, path));
  let profile: (typeof SPORTS)[number] | undefined;
  for (const hint of [...hints, title]) {
    const normalized = text(hint).replace(/[_-]/g, " ");
    // "Football club" is a soccer alias, even though it contains football.
    profile = /\bfootball club\b/i.test(normalized)
      ? SPORTS.find((sport) => sport.sport === "Soccer")
      : SPORTS.find((sport) => sport.pattern.test(normalized));
    if (profile) break;
  }
  if (!profile) return null;

  const entries = Array.isArray(projected.entries)
    ? projected.entries
    : ENTRY_PATHS.map((path) => atPath(data, path)).find(
        (items) => Array.isArray(items) && items.length,
      ) || [];
  const fixtures = (Array.isArray(entries) ? entries : []).filter((value) => {
    const entry = record(value);
    const name = text(entry.opponent) || text(entry.title) || text(entry.name);
    return (
      name &&
      !/^(?:practice|training)$/i.test(text(entry.type)) &&
      !/^(?:open(?: week)?|bye(?: week)?|off(?: week)?|no games?(?: scheduled)?|idle)$/i.test(name)
    );
  });
  const archetype = text(projected.archetype) || firstText(data, ARCHETYPE_PATHS);
  const isSeason =
    archetype === "season_schedule" ||
    /\bseason\b/i.test(title) ||
    (fixtures.length > 0 && /\b(?:schedule|fixtures)\b/i.test(title));
  // A single meet's sessions and a standalone game are ordinary events.
  if (fixtures.length < 2 && !isSeason) return null;
  return {
    sport: profile.sport,
    itemsLabel: profile.itemsLabel,
    itemCount: fixtures.length,
    season: text(projected.season) || firstText(data, SEASON_PATHS),
  };
}

export function formatSportsScheduleSummary(summary: SportsScheduleSummary): string {
  const label = summary.itemsLabel.toLowerCase();
  const singular = { Games: "game", Meets: "meet", Matches: "match" }[summary.itemsLabel];
  const count = `${summary.itemCount} ${summary.itemCount === 1 ? singular : label}`;
  return [summary.sport, summary.season, count].filter(Boolean).join(" · ");
}

/** Project only classification/count inputs, excluding media, rosters and editor snapshots. */
export function buildSidebarSportsProjectionSql(dataSql: string): string {
  const pathSql = (path: string) => `${dataSql}#>'{${path.replaceAll(".", ",")}}'`;
  const firstTextSql = (paths: string[]) =>
    `coalesce(${paths.map((path) => `nullif(${dataSql}#>>'{${path.replaceAll(".", ",")}}', '')`).join(", ")})`;
  const entriesSql = `coalesce(${ENTRY_PATHS.map((path) => `case when jsonb_typeof(${pathSql(path)}) = 'array' then nullif(${pathSql(path)}, '[]'::jsonb) end`).join(", ")}, '[]'::jsonb)`;
  return `jsonb_build_object(
    'sportHints', jsonb_build_array(${SPORT_PATHS.map(pathSql).join(", ")}),
    'season', ${firstTextSql(SEASON_PATHS)},
    'archetype', ${firstTextSql(ARCHETYPE_PATHS)},
    'entries', (select coalesce(jsonb_agg(jsonb_build_object(
      'title', fixture->'title', 'name', fixture->'name',
      'opponent', fixture->'opponent', 'type', fixture->'type'
    )), '[]'::jsonb) from jsonb_array_elements(${entriesSql}) as fixture)
  )`;
}

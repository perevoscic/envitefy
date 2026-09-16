import { resolveWaltonFootballProgram } from "./football-walton-program.ts";

const compact = (value?: string | null) => (value || "").replace(/\s+/g, " ").trim();
const withoutSchoolSuffix = (value: string) => compact(value.replace(/\bhigh school\b/gi, ""));
const withoutFootballTitleSuffix = (value: string) => value.replace(/\s+football(?:\s+(?:season\s+)?['’]?\d{2,4}(?:\s*[-–—/]\s*['’]?\d{2,4})?)?(?:\s+schedule)?$/i, "");
// Confirmed school identity, including the user's September 12 mascot correction.
const confirmedTeams = [
  { school: "South Walton", mascot: "Seahawks" },
  { school: "Fort Walton Beach", mascot: "Vikings" },
  // NFHS Network's Gulf Breeze school profile identifies the Dolphins.
  { school: "Gulf Breeze", mascot: "Dolphins" },
];

const confirmedIdentity = (name: string) => {
  const normalized = withoutSchoolSuffix(name.replace(/\s+football$/i, "")).toLowerCase();
  return confirmedTeams.find(({ school, mascot }) =>
    normalized === school.toLowerCase() || normalized === `${school} ${mascot}`.toLowerCase(),
  );
};

/** Short matchup label, using only a supplied or confirmed mascot. */
export function footballTeamLabel(teamName?: string | null, mascot?: string | null, contextTeamName = "") {
  return compact(mascot) || resolveWaltonFootballProgram(compact(teamName), contextTeamName)?.mascot || confirmedIdentity(compact(teamName))?.mascot || compact(teamName);
}

/** Use confirmed names or a mascot already present in the same team's headline. */
export function resolveFootballTeamName(teamName?: string | null, title?: string | null) {
  const team = compact(teamName);
  const school = withoutSchoolSuffix(team.replace(/\s+football$/i, ""));
  const confirmedTeam = confirmedIdentity(team);
  if (confirmedTeam) return `${confirmedTeam.school} ${confirmedTeam.mascot}`;
  const heading = compact(title);
  const candidate = withoutSchoolSuffix(withoutFootballTitleSuffix(heading));
  if (
    school &&
    candidate !== heading &&
    candidate.toLowerCase().startsWith(`${school.toLowerCase()} `)
  ) {
    const mascot = candidate.slice(school.length).trim();
    if (
      mascot.split(" ").length <= 3 &&
      !/\d|\b(?:athletics|schedule|season|matchups|results|roster|varsity|junior|game|games|homecoming|fundraiser|camp)\b/i.test(mascot)
    ) return candidate;
  }
  return team;
}

type FootballTitleContext = { season?: string | null; gameCount?: number; isSchedule?: boolean };

/** A school-year schedule label; the title does not change any supplied game dates. */
export function footballSeasonTitleLabel(season?: string | null) {
  const value = compact(season);
  const years = value.match(/\b((?:19|20)\d{2})(?:\s*[-–—/]\s*['’]?((?:19|20)?\d{2}))?\b/);
  if (years) {
    const first = Number(years[1]);
    const last = years[2] || String(first + 1);
    return `'${String(first).slice(-2)}-'${last.slice(-2)}`;
  }
  const shortYears = value.match(/['’]?(\d{2})\s*[-–—/]\s*['’]?(\d{2})/);
  return shortYears ? `'${shortYears[1]}-'${shortYears[2]}` : "";
}

/** Team and season already appear in the hero caption; keep the saved title intact. */
export function resolveFootballHeroTitle(title: string, teamName?: string | null) {
  const heading = compact(title);
  const team = resolveFootballTeamName(teamName, heading);
  const scheduleTeam = withoutSchoolSuffix(withoutFootballTitleSuffix(heading));
  return team && /\bfootball\b.*\bschedule$/i.test(heading) &&
    scheduleTeam.toLowerCase() === withoutSchoolSuffix(team).toLowerCase()
    ? "Football Schedule"
    : heading;
}

export function resolveFootballTitle(title?: string | null, teamName?: string | null, context: FootballTitleContext = {}) {
  const heading = compact(title);
  const school = withoutSchoolSuffix(compact(teamName).replace(/\s+football$/i, ""));
  const headingSchool = withoutSchoolSuffix(heading.replace(/\s+football$/i, ""));
  const resolvedTeam = resolveFootballTeamName(teamName, title);
  const normalizedTitle = resolvedTeam && /\s+football$/i.test(heading) && school.toLowerCase() === headingSchool.toLowerCase()
    ? `${resolvedTeam} Football`
    : heading;
  const seasonLabel = footballSeasonTitleLabel(context.season);
  const isSchedule = context.isSchedule || (context.gameCount || 0) > 1;
  const isGenericTitle = resolvedTeam && (
    normalizedTitle.replace(/\s+schedule$/i, "").toLowerCase() === `${resolvedTeam} Football`.toLowerCase() ||
    /^(?:football(?: season)?|football schedule)$/i.test(normalizedTitle)
  );
  return isSchedule && seasonLabel && isGenericTitle
    ? `${resolvedTeam} Football ${seasonLabel} Schedule`
    : normalizedTitle;
}

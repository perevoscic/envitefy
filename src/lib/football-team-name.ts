const compact = (value?: string | null) => (value || "").replace(/\s+/g, " ").trim();
const withoutSchoolSuffix = (value: string) => compact(value.replace(/\bhigh school\b/gi, ""));
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
export function footballTeamLabel(teamName?: string | null, mascot?: string | null) {
  return compact(mascot) || confirmedIdentity(compact(teamName))?.mascot || compact(teamName);
}

/** Use confirmed names or a mascot already present in the same team's headline. */
export function resolveFootballTeamName(teamName?: string | null, title?: string | null) {
  const team = compact(teamName);
  const school = withoutSchoolSuffix(team.replace(/\s+football$/i, ""));
  const confirmedTeam = confirmedIdentity(team);
  if (confirmedTeam) return `${confirmedTeam.school} ${confirmedTeam.mascot}`;
  const heading = compact(title);
  const candidate = withoutSchoolSuffix(heading.replace(/\s+football(?:\s+(?:season\s+)?\d{4})?$/i, ""));
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

export function resolveFootballTitle(title?: string | null, teamName?: string | null) {
  const heading = compact(title);
  const school = withoutSchoolSuffix(compact(teamName).replace(/\s+football$/i, ""));
  const headingSchool = withoutSchoolSuffix(heading.replace(/\s+football$/i, ""));
  const resolvedTeam = resolveFootballTeamName(teamName, title);
  return resolvedTeam && /\s+football$/i.test(heading) && school.toLowerCase() === headingSchool.toLowerCase()
    ? `${resolvedTeam} Football`
    : heading;
}

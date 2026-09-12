export const FOOTBALL_SECTION_LABELS = {
  details: "Details",
  games: "Game Schedule",
  scores: "Live scores",
  roster: "Team Roster",
  practice: "Practice Schedule",
  logistics: "Travel & Logistics",
  gear: "Equipment Checklist",
  volunteers: "Parent Volunteers",
  announcements: "Announcements",
  rsvp: "Attendance",
} as const;

export type FootballSectionId = keyof typeof FOOTBALL_SECTION_LABELS;

/** Only recognized optional sections can be hidden; event contents remain intact. */
export function normalizeFootballHiddenSections(value: unknown): FootballSectionId[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (id): id is FootballSectionId =>
          typeof id === "string" && Object.hasOwn(FOOTBALL_SECTION_LABELS, id),
      ),
    ),
  ];
}

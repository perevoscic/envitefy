import type {
  GymMeetScheduleColorLegendEntry,
  GymMeetScheduleColorRef,
  GymMeetScheduleInfo,
} from "./types";

const safeString = (value: unknown): string =>
  typeof value === "string"
    ? value.trim()
    : value == null
    ? ""
    : String(value).trim();

export const normalizeScheduleColorHex = (value: unknown): string | null => {
  const raw = safeString(value).toLowerCase();
  const match = raw.match(/^#?([0-9a-f]{6})$/i);
  return match ? `#${match[1].toLowerCase()}` : null;
};

export const resolveScheduleTextColor = (
  color: GymMeetScheduleColorRef | null | undefined
): string | null => normalizeScheduleColorHex(color?.textColorHex);

const slugifyScheduleLegendPart = (value: unknown): string =>
  safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const buildScheduleLegendEntryKey = (
  entry: Partial<GymMeetScheduleColorLegendEntry> | null | undefined,
  index?: number
): string => {
  const target = safeString(entry?.target || "club") || "club";
  const colorHex = normalizeScheduleColorHex(entry?.colorHex) || "";
  const colorLabel = slugifyScheduleLegendPart(entry?.colorLabel);
  const meaning = slugifyScheduleLegendPart(entry?.meaning);
  const sourceText = slugifyScheduleLegendPart(entry?.sourceText);
  const teamAwardEligible =
    typeof entry?.teamAwardEligible === "boolean" ? String(entry.teamAwardEligible) : "";
  const explicitId = slugifyScheduleLegendPart(entry?.id);
  const base =
    explicitId ||
    [target, colorHex.replace("#", ""), colorLabel, meaning, sourceText, teamAwardEligible]
      .filter(Boolean)
      .join("-");
  if (typeof index === "number") {
    return `${base || "schedule-legend"}-${index + 1}`;
  }
  return base || "schedule-legend";
};

const dedupeScheduleLegendEntries = (
  entries: GymMeetScheduleColorLegendEntry[]
): GymMeetScheduleColorLegendEntry[] => {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = buildScheduleLegendEntryKey({
      target: entry.target || "club",
      colorHex: normalizeScheduleColorHex(entry.colorHex),
      colorLabel: safeString(entry.colorLabel) || undefined,
      meaning: safeString(entry.meaning),
      sourceText: safeString(entry.sourceText) || undefined,
      teamAwardEligible:
        typeof entry.teamAwardEligible === "boolean" ? entry.teamAwardEligible : null,
    });
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const resolveScheduleLegendEntries = (
  schedule: GymMeetScheduleInfo,
  hasTeamAwardTrue: boolean,
  hasTeamAwardFalse: boolean
): GymMeetScheduleColorLegendEntry[] => {
  const explicitColorLegend = Array.isArray(schedule.colorLegend) ? schedule.colorLegend : [];
  if (explicitColorLegend.length > 0) {
    return dedupeScheduleLegendEntries(
      explicitColorLegend.filter(
        (entry) =>
          safeString(entry.meaning) ||
          normalizeScheduleColorHex(entry.colorHex) ||
          safeString(entry.colorLabel) ||
          typeof entry.teamAwardEligible === "boolean"
      )
    );
  }

  const explicitAwardLegend = Array.isArray(schedule.awardLegend) ? schedule.awardLegend : [];
  if (explicitAwardLegend.length > 0) {
    return dedupeScheduleLegendEntries(
      explicitAwardLegend
        .filter(
          (entry) => safeString(entry.meaning) || typeof entry.teamAwardEligible === "boolean"
        )
        .map((entry, index) => ({
          id: `award-legend-${index + 1}`,
          target: "club" as const,
          colorHex: normalizeScheduleColorHex(entry.colorHex),
          colorLabel: safeString(entry.colorLabel) || undefined,
          meaning: entry.meaning,
          sourceText: undefined,
          teamAwardEligible:
            typeof entry.teamAwardEligible === "boolean" ? entry.teamAwardEligible : null,
        }))
    );
  }

  const fallbackEntries: GymMeetScheduleColorLegendEntry[] = [];
  if (hasTeamAwardTrue) {
    fallbackEntries.push({
      id: "team-awards",
      target: "club",
      colorHex: null,
      meaning: "Individual & Team Awards",
      teamAwardEligible: true,
    });
  }
  if (hasTeamAwardFalse) {
    fallbackEntries.push({
      id: "individual-only",
      target: "club",
      colorHex: null,
      meaning: "Individual Only",
      teamAwardEligible: false,
    });
  }
  return dedupeScheduleLegendEntries(fallbackEntries);
};

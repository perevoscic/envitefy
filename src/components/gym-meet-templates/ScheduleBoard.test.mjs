import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("schedule board supports grid, timeline, and compact table views", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");

  assert.match(source, /type ScheduleViewMode = "grid" \| "timeline" \| "compact";/);
  assert.match(source, /useState<ScheduleViewMode>\("grid"\)/);
  assert.match(source, /label: "Grid"/);
  assert.match(source, /label: "Timeline"/);
  assert.match(source, /label: "Table"/);
  assert.match(source, /aria-label=\{mode\.label\}/);
  assert.match(source, /viewMode === "grid"/);
  assert.match(source, /viewMode === "timeline"/);
  assert.match(source, /viewMode === "compact"/);
});

test("schedule board uses the two-column desktop grid and removes the team dropdown", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");

  assert.match(source, /grid grid-cols-1 gap-6 lg:grid-cols-2/);
  assert.doesNotMatch(source, /xl:grid-cols-3/);
  assert.doesNotMatch(source, /aria-label="Filter schedule by club"/);
  assert.doesNotMatch(source, /ChevronsUpDown/);
  assert.match(source, /placeholder="Search clubs"/);
  assert.match(source, /xl:max-w-\[240px\]/);
});

test("schedule board keeps the header focused on schedule controls and compact table headings", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");

  assert.doesNotMatch(source, /rotationSheetsUrl\?: string;/);
  assert.doesNotMatch(source, /Rotation Sheets/);
  assert.match(source, /Participating Gym Clubs/);
  assert.match(source, /Competitive Group/);
  assert.doesNotMatch(source, /Download/);
  assert.doesNotMatch(source, /Share2/);
  assert.doesNotMatch(source, /\{mode\.label\}<\/span>/);
  assert.match(source, /const hasVisibleClubs = useMemo/);
  assert.match(source, /xl:flex-row xl:items-center xl:justify-between/);
});

test("schedule board groups clubs by divisionLabel when schedule sessions contain nested subcolumns", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");

  assert.match(source, /const groupSessionClubsByDivision =/);
  assert.match(source, /const hasDivisionGrouping = clubs\.some\(\(club\) => safeString\(club\.divisionLabel\)\)/);
  assert.match(source, /safeString\(club\.divisionLabel\) \|\| "Other"/);
  assert.match(source, /if \(!grouped\.hasDivisionGrouping\)/);
  assert.match(source, /grouped\.groups\.map\(\(group\) =>/);
});

test("schedule board keeps flat rendering for unlabeled clubs and preserves counts and award markers inside grouped sections", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");

  assert.match(source, /formatClubName\(club, \{ includeDivisionLabel \}\)/);
  assert.match(source, /formatClubName\(club, \{ includeDivisionLabel: false \}\)/);
  assert.match(source, /club\.teamAwardEligible === true \? <Trophy size=\{11\} \/> : null/);
  assert.match(source, /resolveScheduleTextColor\(club\.color\)/);
  assert.doesNotMatch(source, /border-\[#f472b6\]\/40 bg-\[#f472b6\]\/10 text-\[#f472b6\]/);
});

test("schedule board resolves dynamic color legends instead of relying on award-only pink styling", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");
  const colorSource = readSource("src/components/gym-meet-templates/scheduleColors.ts");

  assert.match(source, /resolveScheduleLegendEntries\(normalizedSchedule, hasTeamAwardTrue, hasTeamAwardFalse\)/);
  assert.match(source, /buildScheduleLegendEntryKey\(entry, entryIndex\)/);
  assert.match(source, /\(\["session", "club"\] as const\)\.map/);
  assert.match(source, /Session Colors/);
  assert.match(source, /Club Colors/);
  assert.match(source, /entry\.colorHex \?/);
  assert.match(colorSource, /export const buildScheduleLegendEntryKey =/);
  assert.match(colorSource, /const dedupeScheduleLegendEntries =/);
  assert.match(colorSource, /return dedupeScheduleLegendEntries\(/);
});

test("schedule board formats nav day labels without the year and does not render blank date text", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");

  assert.match(source, /const formatScheduleDayLabel =/);
  assert.match(source, /weekday: "short"/);
  assert.match(source, /month: "short"/);
  assert.match(source, /day: "numeric"/);
  assert.match(source, /\.toUpperCase\(\)/);
  assert.match(source, /formatScheduleDayLabel\(day\)/);
  assert.doesNotMatch(source, /<span>\{day\.shortDate \|\| day\.date\}<\/span>/);
});

test("schedule board keeps schedule timing separate from notes and renders stretch warm-up labels", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");

  assert.match(source, /const buildSessionTimingRows =/);
  assert.match(source, /label: "Stretch"/);
  assert.match(source, /Warm-up/);
  assert.doesNotMatch(source, /"Schedule time"/);
  assert.match(source, /timingRow\.label/);
  assert.match(source, /sm:flex-row sm:items-start sm:justify-between/);
  assert.match(source, /sm:text-right/);
});

test("schedule board hides club labels and columns when no session clubs are present", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");

  assert.match(source, /const showSessionClubs = session\.clubs\.length > 0;/);
  assert.match(source, /\{showSessionClubs \? \(/);
  assert.match(source, /\{hasVisibleClubs \? <th className="px-4 py-4">Participating Gym Clubs<\/th> : null\}/);
});

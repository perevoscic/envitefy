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
});

test("schedule board keeps the header focused on schedule controls and compact table headings", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");

  assert.doesNotMatch(source, /rotationSheetsUrl\?: string;/);
  assert.doesNotMatch(source, /Rotation Sheets/);
  assert.match(source, /Participating Gym Clubs/);
  assert.match(source, /Competitive Group/);
  assert.doesNotMatch(source, /Download/);
  assert.doesNotMatch(source, /Share2/);
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
  assert.match(source, /club\.teamAwardEligible === true\s*\? "border-\[#f472b6\]\/40 bg-\[#f472b6\]\/10 text-\[#f472b6\]"/);
});

test("schedule board formats nav day labels without the year and does not render blank date text", () => {
  const source = readSource("src/components/gym-meet-templates/ScheduleBoard.tsx");

  assert.match(source, /const formatScheduleDayLabel =/);
  assert.match(source, /weekday: "long"/);
  assert.match(source, /month: "short"/);
  assert.match(source, /day: "numeric"/);
  assert.match(source, /formatScheduleDayLabel\(day\)/);
  assert.doesNotMatch(source, /<span>\{day\.shortDate \|\| day\.date\}<\/span>/);
});

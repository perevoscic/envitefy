import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("football builder menu keeps attendance first-class and announcements in section order", () => {
  const templateSource = readSource(
    "src/components/event-templates/FootballSeasonTemplate.tsx"
  );
  const customizeSource = readSource(
    "src/app/event/football-season/customize/page.tsx"
  );

  assert.match(templateSource, /menuTitle:\s*"Attendance"/);
  assert.match(templateSource, /menuDesc:\s*"Track attendance and commitments\."/);
  assert.match(templateSource, /menuTitle:\s*"Announcements"/);
  assert.match(
    templateSource,
    /advancedSections:\s*\[\s*gameScheduleSection,\s*rosterSection,\s*practiceSection,\s*logisticsSection,\s*gearSection,\s*volunteersSection,\s*announcementsSection,\s*\]/s,
    "football advanced sections should end with announcements"
  );
  assert.match(templateSource, /export \{[\s\S]*announcementsSection/);

  assert.ok(customizeSource.includes('title="Upload & Prefill"'));
  assert.match(customizeSource, /title=\{rsvpCopy\.menuTitle\}/);
  assert.ok(customizeSource.includes("config.advancedSections?.map"));
});

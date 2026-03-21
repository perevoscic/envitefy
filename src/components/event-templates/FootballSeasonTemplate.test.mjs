import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("football builder shell uses the gym template selector pipeline and keeps section routing intact", () => {
  const templateSource = readSource(
    "src/components/event-templates/FootballSeasonTemplate.tsx"
  );
  const customizeSource = readSource(
    "src/app/event/football-season/customize/page.tsx"
  );
  const themeAdapterSource = readSource(
    "src/app/event/football-season/customize/footballSeasonTemplateTheme.ts"
  );
  const registrySource = readSource("src/components/gym-meet-templates/registry.ts");

  assert.match(templateSource, /menuTitle:\s*"Attendance"/);
  assert.match(templateSource, /menuDesc:\s*"Track attendance and commitments\."/);
  assert.match(templateSource, /menuTitle:\s*"Announcements"/);
  assert.match(
    templateSource,
    /advancedSections:\s*\[\s*gameScheduleSection,\s*rosterSection,\s*practiceSection,\s*logisticsSection,\s*gearSection,\s*volunteersSection,\s*announcementsSection,\s*\]/s,
    "football advanced sections should end with announcements"
  );
  assert.match(templateSource, /export \{[\s\S]*announcementsSection/);

  assert.ok(customizeSource.includes("TemplateSelector"));
  assert.ok(customizeSource.includes("DEFAULT_GYM_MEET_TEMPLATE_ID"));
  assert.ok(customizeSource.includes("getGymMeetTemplateMeta"));
  assert.ok(customizeSource.includes("isGymMeetTemplateId"));
  assert.ok(customizeSource.includes("resolveFootballSeasonTemplateChrome"));
  assert.match(customizeSource, /FootballSeasonSectionNav/);
  assert.match(customizeSource, /FootballSeasonHeader/);
  assert.match(customizeSource, /FootballSeasonPreviewFrame/);
  assert.match(customizeSource, /FootballSeasonPreviewSection/);
  assert.match(customizeSource, /FootballSeasonSectionCard/);
  assert.match(customizeSource, /FootballSeasonMutedBadge/);
  assert.match(customizeSource, /titleTypographyClassName/);
  assert.match(customizeSource, /advancedSectionPreviews/);
  assert.match(customizeSource, /previewNode == null/);
  assert.match(customizeSource, /Build your football page/);
  assert.match(customizeSource, /Edit your football page/);
  assert.match(customizeSource, /pageTemplateId/);
  assert.match(customizeSource, /themeId:\s*pageTemplateId/);
  assert.match(customizeSource, /sectionHeadingFontStyle/);
  assert.match(customizeSource, /heroHeadingFontStyle/);
  assert.match(customizeSource, /navItems:\s*Array<\{ id: string; label: string \}>/);
  assert.match(customizeSource, /router\.push\(`\/event\/football\/customize\?edit=\$\{eventId\}`\)/);
  assert.match(customizeSource, /config\.advancedSections\?\.map/);
  assert.doesNotMatch(customizeSource, /rivalry_red|victory_blue|championship_crimson/);
  assert.doesNotMatch(customizeSource, /FootballSeasonThemeRail/);
  assert.doesNotMatch(customizeSource, /gymnasticsThemeConfig/);
  assert.doesNotMatch(customizeSource, /FOOTBALL_FONTS|selectedFont|FOOTBALL_GOOGLE_FONTS_URL/);

  assert.match(themeAdapterSource, /resolveFootballSeasonTemplateTypography/);
  assert.match(themeAdapterSource, /getGymMeetTitleTypography\(templateId\)/);
  assert.match(themeAdapterSource, /titleTypography,/);
  assert.match(themeAdapterSource, /stripTitleFontFamilyClasses/);
  assert.match(themeAdapterSource, /launchpad-editorial/);
  assert.match(themeAdapterSource, /elite-athlete/);
  assert.match(themeAdapterSource, /vault-grid/);
  assert.match(themeAdapterSource, /resolveFootballSeasonTemplateChrome/);
  assert.match(themeAdapterSource, /navShellClass/);
  assert.match(themeAdapterSource, /sectionMutedClass/);
  assert.match(themeAdapterSource, /sectionCardClass/);

  assert.match(registrySource, /id:\s*"launchpad-editorial"[\s\S]*titleTypographyId:\s*"playfair"/);
  assert.match(registrySource, /id:\s*"elite-athlete"[\s\S]*titleTypographyId:\s*"anton"/);
  assert.match(registrySource, /id:\s*"vault-grid"[\s\S]*titleTypographyId:\s*"league-spartan"/);
  assert.match(registrySource, /id:\s*"club-classic"[\s\S]*titleTypographyId:\s*"barlow-condensed"/);
});

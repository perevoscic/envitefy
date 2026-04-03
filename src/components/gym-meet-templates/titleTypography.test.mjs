import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("gym meet title typography maps key templates to explicit Google fonts", () => {
  const source = readSource(
    "src/components/gym-meet-templates/registry.ts"
  );

  assert.match(source, /id: "meet-app-shell"[\s\S]*titleTypographyId: "manrope"/);
  assert.match(source, /id: "session-companion"[\s\S]*titleTypographyId: "sora"/);
  assert.match(source, /id: "toxic-kinetic"[\s\S]*titleTypographyId: "kanit"/);
  assert.match(source, /id: "luxe-magazine"[\s\S]*titleTypographyId: "cormorant"/);
  assert.match(source, /id: "chalk-strike"[\s\S]*titleTypographyId: "space-mono"/);
  assert.match(source, /id: "podium-lights"[\s\S]*titleTypographyId: "oswald"/);
});

test("shared title typography helper is used by selector and live gym renderers", () => {
  const files = [
    "src/components/gym-meet-templates/TemplateSelector.tsx",
    "src/components/gym-meet-templates/renderers/BaseGymMeetTemplate.tsx",
    "src/components/gym-meet-templates/renderers/SessionCompanionTemplate.tsx",
    "src/components/gym-meet-templates/renderers/ShowcaseGymMeetTemplate.tsx",
    "src/components/gym-meet-templates/renderers/EditorialGymMeetTemplate.tsx",
    "src/components/gym-meet-templates/renderers/DashboardGymMeetTemplate.tsx",
  ];

  for (const file of files) {
    const source = readSource(file);
    assert.match(
      source,
      /getGymMeetTitleTypography/,
      `${file} does not use the shared title typography helper`
    );
  }
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("normalizeGymMeetEventData maps long packet text to detailsText instead of hero copy", () => {
  const source = readSource(
    "src/components/gym-meet-templates/normalizeGymMeetEventData.ts"
  );

  assert.match(
    source,
    /const detailsText = safeString\(eventData\?\.description \|\| eventData\?\.details\);/
  );
  assert.match(source, /buildGymMeetDiscoveryContent\(\{[\s\S]*detailsText,/);
  assert.match(source, /detailsText,\s*\n\s*heroSummary: undefined,/);
  assert.doesNotMatch(
    source,
    /\n\s*description:\s*safeString\(eventData\?\.description \|\| eventData\?\.details\),/
  );
});

test("gym meet renderer sources do not reference model.description", () => {
  const files = [
    "src/components/gym-meet-templates/GymMeetDiscoveryContent.tsx",
    "src/components/gym-meet-templates/ShowcaseDiscoveryContent.tsx",
    "src/components/gym-meet-templates/renderers/EditorialGymMeetTemplate.tsx",
    "src/components/gym-meet-templates/renderers/DashboardGymMeetTemplate.tsx",
    "src/components/gym-meet-templates/renderers/ShowcaseGymMeetTemplate.tsx",
  ];

  for (const file of files) {
    const source = readSource(file);
    assert.equal(
      source.includes("model.description"),
      false,
      `${file} still references model.description`
    );
  }
});

test("discovery nav renderers use overflow chips instead of equal-width desktop grids", () => {
  const files = [
    "src/components/gym-meet-templates/GymMeetDiscoveryContent.tsx",
    "src/components/gym-meet-templates/renderers/ShowcaseGymMeetTemplate.tsx",
  ];

  for (const file of files) {
    const source = readSource(file);
    assert.equal(
      source.includes("repeat(${"),
      false,
      `${file} still computes equal-width discovery grid columns`
    );
    assert.equal(
      source.includes("md:grid md:overflow-visible"),
      false,
      `${file} still switches the discovery rail to a desktop grid`
    );
  }
});

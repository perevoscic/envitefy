import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("normalizeGymMeetEventData maps long packet text to detailsText instead of hero copy", () => {
  const source = readSource("src/components/gym-meet-templates/normalizeGymMeetEventData.ts");

  assert.match(
    source,
    /const rawDiscoveryDetails = safeString\(eventData\?\.details \|\| eventData\?\.description\);[\s\S]*stripDiscoveryGeneratedDetails\(rawDiscoveryDetails\)/,
  );
  assert.match(
    source,
    /detailsTextForDiscovery: isDiscoveryEvent \? rawDiscoveryDetails : undefined/,
  );
  assert.match(source, /buildGymMeetDiscoveryContent\(\{[\s\S]*detailsText,/);
  assert.match(source, /detailsText,\s*\n\s*heroSummary: undefined,/);
  assert.doesNotMatch(
    source,
    /\n\s*description:\s*safeString\(eventData\?\.(?:description|details)[\s\S]*,/,
  );
});

test("gym meet renderer sources do not reference model.description", () => {
  const files = [
    "src/components/gym-meet-templates/GymMeetDiscoveryContent.tsx",
    "src/components/gym-meet-templates/ShowcaseDiscoveryContent.tsx",
    "src/components/gym-meet-templates/GymnasticsScene.tsx",
    "src/components/gym-meet-templates/renderers/MeetPageContent.tsx",
  ];

  for (const file of files) {
    const source = readSource(file);
    assert.equal(
      source.includes("model.description"),
      false,
      `${file} still references model.description`,
    );
  }
});

test("discovery nav renderers use overflow chips instead of equal-width desktop grids", () => {
  const source = readSource("src/components/gym-meet-templates/GymMeetDiscoveryContent.tsx");

  assert.equal(
    source.includes("repeat(${"),
    false,
    "GymMeetDiscoveryContent still computes equal-width discovery grid columns",
  );
  assert.equal(
    source.includes("md:grid md:overflow-visible"),
    false,
    "GymMeetDiscoveryContent still switches the discovery rail to a desktop grid",
  );
});

test("discovery nav keeps safe-edge padding and avoids naive center scrolling", () => {
  const source = readSource("src/components/gym-meet-templates/GymMeetDiscoveryContent.tsx");

  assert.equal(
    source.includes('inline: "center"'),
    false,
    "GymMeetDiscoveryContent still relies on scrollIntoView center alignment",
  );
  assert.match(
    source,
    /const navRailClass = `\$\{baseNavRailClass\} pr-12 md:pr-1`;/,
    "GymMeetDiscoveryContent is missing mobile-safe end padding on the nav rail",
  );
  assert.match(
    source,
    /const safeEdgeInset = isDesktop \? DESKTOP_NAV_SAFE_EDGE_PX : MOBILE_NAV_SAFE_EDGE_PX;/,
    "GymMeetDiscoveryContent no longer scrolls tabs into a safe visible region",
  );
});

test("gymnastics renderers omit the redundant Quick Access section", () => {
  const files = [
    "src/components/gym-meet-templates/GymnasticsScene.tsx",
    "src/components/gym-meet-templates/renderers/MeetPageContent.tsx",
  ];

  for (const file of files) {
    const source = readSource(file);
    assert.equal(
      source.includes('title="Quick Access"'),
      false,
      `${file} still renders the Quick Access section`,
    );
    assert.equal(
      source.includes('resourcesHref={hasQuickAccessSection ? "#quick-access" : undefined}'),
      false,
      `${file} still links the action strip to Quick Access`,
    );
  }
});

test("both discovery renderers use the structured hotel card presentation", () => {
  const files = [
    "src/components/gym-meet-templates/GymMeetDiscoveryContent.tsx",
    "src/components/gym-meet-templates/ShowcaseDiscoveryContent.tsx",
  ];

  for (const file of files) {
    const source = readSource(file);
    assert.match(source, /card\.presentation === "hotel"/);
    assert.match(source, /Host hotel/);
    assert.match(source, /card\.highlights/);
    assert.match(source, /card\.details/);
  }
});

test("gymnastics renderers do not repeat header facts in a Meet Snapshot section", () => {
  const files = [
    "src/components/gym-meet-templates/GymnasticsScene.tsx",
    "src/components/gym-meet-templates/renderers/MeetPageContent.tsx",
  ];

  for (const file of files) {
    const source = readSource(file);
    assert.equal(source.includes('title="Meet Snapshot"'), false);
  }
});

test("hero address rendering falls back to parsed and map addresses when eventData.address is blank", () => {
  const normalizeSource = readSource(
    "src/components/gym-meet-templates/normalizeGymMeetEventData.ts",
  );

  assert.match(
    normalizeSource,
    /const resolvedAddress = collapseRepeatedDisplayText\(\s*eventData\?\.address \|\| parseResult\?\.address \|\| mapAddress\s*\);/,
    "normalizeGymMeetEventData no longer falls back to parseResult.address/mapAddress",
  );

  const sceneSource = readSource("src/components/gym-meet-templates/GymnasticsScene.tsx");
  assert.match(
    sceneSource,
    /model\.address \|\| model\.mapAddress \|\| model\.headerLocation/,
    "GymnasticsScene no longer falls back to mapAddress in the hero address line",
  );
});

test("gym meet defaults use the 2026 collection for legacy and new drafts", () => {
  const registrySource = readSource("src/components/gym-meet-templates/registry.ts");
  const selectorSource = readSource("src/components/gym-meet-templates/TemplateSelector.tsx");

  assert.match(
    registrySource,
    /DEFAULT_GYM_MEET_TEMPLATE_ID:\s*GymMeetTemplateId\s*=\s*"airborne-atlas"/,
    "registry.ts changed the legacy gym meet fallback unexpectedly",
  );
  assert.match(
    registrySource,
    /DEFAULT_NEW_GYM_MEET_TEMPLATE_ID:\s*GymMeetTemplateId\s*=\s*"airborne-atlas"/,
    "registry.ts should pin new meet drafts to airborne atlas",
  );
  assert.match(selectorSource, /GYM_MEET_TEMPLATE_LIBRARY\.filter/);
  assert.match(selectorSource, /<GymnasticsPreview design=\{design\}/);
});

test("shared gym renderer no longer imports retired per-design template files", () => {
  const source = readSource("src/components/gym-meet-templates/GymMeetTemplateRenderer.tsx");

  assert.match(source, /GymnasticsScene/);
  assert.match(source, /MeetPageContent/);
  assert.doesNotMatch(source, /ArchitectCleanTemplate/);
  assert.doesNotMatch(source, /EliteAthleteTemplate/);
});

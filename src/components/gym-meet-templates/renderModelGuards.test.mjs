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
    /const rawDiscoveryDetails = safeString\(eventData\?\.details \|\| eventData\?\.description\);[\s\S]*stripDiscoveryGeneratedDetails\(rawDiscoveryDetails\)/
  );
  assert.match(source, /detailsTextForDiscovery: isDiscoveryEvent \? rawDiscoveryDetails : undefined/);
  assert.match(source, /buildGymMeetDiscoveryContent\(\{[\s\S]*detailsText,/);
  assert.match(source, /detailsText,\s*\n\s*heroSummary: undefined,/);
  assert.doesNotMatch(
    source,
    /\n\s*description:\s*safeString\(eventData\?\.(?:description|details)[\s\S]*,/
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

test("discovery nav keeps safe-edge padding and avoids naive center scrolling", () => {
  const source = readSource(
    "src/components/gym-meet-templates/GymMeetDiscoveryContent.tsx"
  );
  const showcaseSource = readSource(
    "src/components/gym-meet-templates/renderers/ShowcaseGymMeetTemplate.tsx"
  );

  assert.equal(
    source.includes('inline: "center"'),
    false,
    "GymMeetDiscoveryContent still relies on scrollIntoView center alignment"
  );
  assert.match(
    source,
    /const navRailClass = `\$\{baseNavRailClass\} pr-12 md:pr-1`;/,
    "GymMeetDiscoveryContent is missing mobile-safe end padding on the nav rail"
  );
  assert.match(
    source,
    /const safeEdgeInset = isDesktop \? DESKTOP_NAV_SAFE_EDGE_PX : MOBILE_NAV_SAFE_EDGE_PX;/,
    "GymMeetDiscoveryContent no longer scrolls tabs into a safe visible region"
  );
  assert.match(
    showcaseSource,
    /className="no-scrollbar flex gap-2 overflow-x-auto px-1 py-1 pr-12 md:pr-1"/,
    "ShowcaseGymMeetTemplate is missing mobile-safe end padding on the tab rail"
  );
  assert.match(
    showcaseSource,
    /const safeEdgeInset = isDesktop \? DESKTOP_TAB_SAFE_EDGE_PX : MOBILE_TAB_SAFE_EDGE_PX;/,
    "ShowcaseGymMeetTemplate no longer scrolls tabs into a safe visible region"
  );
});

test("quick access renderers keep coach metadata out of link-only actions", () => {
  const files = [
    "src/components/gym-meet-templates/renderers/BaseGymMeetTemplate.tsx",
    "src/components/gym-meet-templates/renderers/DashboardGymMeetTemplate.tsx",
    "src/components/gym-meet-templates/renderers/EditorialGymMeetTemplate.tsx",
    "src/components/gym-meet-templates/renderers/ShowcaseGymMeetTemplate.tsx",
  ];

  for (const file of files) {
    const source = readSource(file);
    assert.equal(
      source.includes("model.quickLinks.length > 0 || Boolean(model.coachPhone"),
      false,
      `${file} still treats coach phone as quick access content`
    );
    assert.equal(
      source.includes("Contact Coach"),
      false,
      `${file} still renders Contact Coach in Quick Access`
    );
  }

  const editorialSource = readSource(
    "src/components/gym-meet-templates/renderers/EditorialGymMeetTemplate.tsx"
  );
  assert.equal(
    editorialSource.includes("Assistant Coach"),
    false,
    "EditorialGymMeetTemplate still renders coach cards in Quick Access"
  );
});

test("hero address rendering falls back to parsed and map addresses when eventData.address is blank", () => {
  const normalizeSource = readSource(
    "src/components/gym-meet-templates/normalizeGymMeetEventData.ts"
  );

  assert.match(
    normalizeSource,
    /const resolvedAddress = collapseRepeatedDisplayText\(\s*eventData\?\.address \|\| parseResult\?\.address \|\| mapAddress\s*\);/,
    "normalizeGymMeetEventData no longer falls back to parseResult.address/mapAddress"
  );

  const rendererFiles = [
    "src/components/gym-meet-templates/renderers/EditorialGymMeetTemplate.tsx",
    "src/components/gym-meet-templates/renderers/DashboardGymMeetTemplate.tsx",
    "src/components/gym-meet-templates/renderers/ShowcaseGymMeetTemplate.tsx",
  ];

  for (const file of rendererFiles) {
    const source = readSource(file);
    assert.match(
      source,
      /model\.address \|\| model\.mapAddress \|\| model\.headerLocation/,
      `${file} no longer falls back to mapAddress in the hero address line`
    );
  }
});

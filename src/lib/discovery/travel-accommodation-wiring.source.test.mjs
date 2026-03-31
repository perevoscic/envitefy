import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("discovery v2 enrich runs travel accommodation enrichment", () => {
  const source = readSource("src/lib/discovery/enrich.ts");
  assert.match(source, /enrichTravelAccommodation/);
  assert.match(source, /buildTravelAccommodationState/);
  assert.match(source, /travelAccommodation:\s*buildTravelAccommodationState/);
});

test("discovery v2 compose-public prefers enriched travel accommodation state", () => {
  const source = readSource("src/lib/discovery/compose-public.ts");
  assert.match(source, /travelAccommodationState/);
  assert.match(source, /discovery\.enrichment/);
  assert.match(source, /discoverySource:\s*\{[\s\S]*travelAccommodation/);
  assert.match(source, /travel:\s*\"Hotels\s*&\s*Travel\"/);
});

test("discovery v2 pipeline persists travel accommodation into app-facing discoverySource", () => {
  const source = readSource("src/lib/discovery/run.ts");
  assert.match(source, /updateEventHistoryDataMerge/);
  assert.match(source, /discoverySource:\s*\{[\s\S]*travelAccommodation/);
});

test("playwright travel provider uses direct playwright extraction (not generic crawler)", () => {
  const source = readSource("src/lib/travel-accommodation-providers/playwright.ts");
  assert.doesNotMatch(source, /collectDiscoveryBrowserData/);
  assert.match(source, /import\(\"playwright\"\)/);
  assert.match(source, /locator\(/);
});

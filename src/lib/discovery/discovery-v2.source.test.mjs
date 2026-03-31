import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("discovery v2 adds the new API route surface", () => {
  const intakeSource = readSource("src/app/api/discovery/intake/route.ts");
  const runSource = readSource("src/app/api/discovery/[eventId]/run/route.ts");
  const statusSource = readSource("src/app/api/discovery/[eventId]/status/route.ts");

  assert.match(intakeSource, /export async function POST/);
  assert.match(runSource, /export async function POST/);
  assert.match(statusSource, /export async function GET/);
  assert.match(runSource, /dispatchDiscoveryPipeline/);
  assert.match(statusSource, /buildDiscoveryStatusResponse/);
});

test("discovery v2 persists event_discoveries and app-facing builder artifacts", () => {
  const dbSource = readSource("src/lib/db.ts");
  const persistSource = readSource("src/lib/discovery/persist.ts");

  assert.match(dbSource, /create table if not exists event_discoveries/i);
  assert.match(dbSource, /export async function insertEventDiscovery/);
  assert.match(dbSource, /export async function getEventDiscoveryByEventId/);
  assert.match(dbSource, /export async function tryAcquireEventDiscoveryLease/);
  assert.match(persistSource, /builderDraft:/);
  assert.match(persistSource, /publicArtifacts:/);
  assert.match(persistSource, /pipelineSummary:/);
});

test("discovery v2 threads travelAccommodation through enrich, compose, and snapshot persistence", () => {
  const enrichSource = readSource("src/lib/discovery/enrich.ts");
  const composeSource = readSource("src/lib/discovery/compose-public.ts");
  const eventDataSource = readSource("src/lib/discovery/event-data.ts");
  const persistSource = readSource("src/lib/discovery/persist.ts");
  const runSource = readSource("src/lib/discovery/run.ts");

  assert.match(enrichSource, /enrichTravelAccommodation/);
  assert.match(enrichSource, /travelAccommodation,/);
  assert.match(composeSource, /discoverySourceWithTravel/);
  assert.match(composeSource, /eventDataPatch:/);
  assert.match(eventDataSource, /\.\.\.persistedDiscoverySource/);
  assert.match(eventDataSource, /parseResult: persistedDiscoverySource\.parseResult \|\| null/);
  assert.match(persistSource, /eventDataPatch\?: Record<string, unknown>/);
  assert.match(persistSource, /\.\.\.\(params\.eventDataPatch \|\| \{\}\)/);
  assert.match(runSource, /eventDataPatch: composed\.eventDataPatch/);
});

test("gymnastics discovery clients use the v2 intake run status flow", () => {
  const launcherSource = readSource("src/components/event-create/GymnasticsLauncher.tsx");
  const customizeSource = readSource("src/app/event/gymnastics/customize/page.tsx");

  assert.match(launcherSource, /\/api\/discovery\/intake/);
  assert.match(launcherSource, /\/api\/discovery\/\$\{eventId\}\/run/);
  assert.match(launcherSource, /\/api\/discovery\/\$\{eventId\}\/status/);
  assert.match(customizeSource, /\/api\/discovery\/intake/);
  assert.match(customizeSource, /\/api\/discovery\/\$\{eventId\}\/run/);
  assert.match(customizeSource, /\/api\/discovery\/\$\{eventId\}\/status/);
});

test("football discovery clients no longer use legacy ingest or parse routes", () => {
  const launcherSource = readSource("src/components/event-create/FootballLauncher.tsx");
  const customizeSource = readSource("src/app/event/football-season/customize/page.tsx");

  assert.match(launcherSource, /\/api\/discovery\/intake/);
  assert.match(launcherSource, /\/api\/discovery\/\$\{eventId\}\/run/);
  assert.match(launcherSource, /\/api\/discovery\/\$\{eventId\}\/status/);
  assert.doesNotMatch(launcherSource, /\/api\/parse\/\$\{eventId\}/);
  assert.doesNotMatch(launcherSource, /\/api\/ingest\?mode=football_discovery/);

  assert.match(customizeSource, /\/api\/discovery\/intake/);
  assert.match(customizeSource, /\/api\/discovery\/\$\{eventId\}\/run/);
  assert.match(customizeSource, /\/api\/discovery\/\$\{eventId\}\/status/);
  assert.doesNotMatch(customizeSource, /\/api\/parse\/\$\{eventId\}/);
  assert.doesNotMatch(customizeSource, /\/api\/ingest\?mode=football_discovery/);
});

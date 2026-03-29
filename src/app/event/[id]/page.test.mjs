import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("event route branches football discovery/template events into the football renderer", () => {
  const source = readSource("src/app/event/[id]/page.tsx");

  assert.match(
    source,
    /const FootballDiscoveryContent = nextDynamic\(\s*\(\) => import\("@\/components\/football-discovery\/FootballDiscoveryContent"\),/m,
    "FootballDiscoveryContent should be dynamically imported"
  );
  assert.match(source, /isGymMeetTemplateId/);
  assert.match(source, /resolveFootballSeasonTemplateChrome/);
  assert.match(source, /const footballPageTemplateId =/);
  assert.match(source, /const footballPublicChrome =/);
  assert.match(source, /pageTemplateId/);
  assert.match(source, /chrome=\{footballPublicChrome\}/);
  assert.match(source, /pageTemplateId=\{footballPageTemplateId\}/);
  assert.match(source, /hideOwnerActions=\{Boolean\(discoveryEditConfig\)\}/);
  assert.ok(
    source.includes("const shouldRenderFootballPage ="),
    "football renderer gate is missing"
  );
  assert.ok(
    source.indexOf("if (shouldRenderFootballPage)") <
      source.indexOf("if (isSimpleTemplate)"),
    "football renderer branch should run before the generic SimpleTemplateView branch"
  );
  assert.ok(
    source.indexOf("const footballEventView = (") <
      source.indexOf("if (discoveryEditConfig) {"),
    "football edit URLs should remain wrapped in DiscoveryEventEditLayout"
  );
  assert.match(source, /isOcrBirthdayRenderer/);
  assert.match(source, /const isBirthdayRendererEvent =/);
  assert.match(source, /createdVia === "birthday-renderer" \|\| isOcrBirthdayRenderer\(createdVia\)/);
  assert.match(source, /selectBirthdayOcrThemeId/);
  assert.match(source, /calendarLinks=\{calendarLinks\}/);
  assert.match(source, /const hideHostDashboard =/);
  assert.match(source, /const showHostDashboard = canManageCreatedEvent && !hideHostDashboard/);
  assert.match(source, /showHostDashboard=\{showHostDashboard\}/);
});

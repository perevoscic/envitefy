import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("event route branches football discovery/template events into the football renderer", () => {
  const source = readSource("src/app/event/[id]/page.tsx");

  assert.ok(
    source.includes(
      'const FootballDiscoveryContent = nextDynamic(\n  () => import("@/components/football-discovery/FootballDiscoveryContent"),'
    ),
    "FootballDiscoveryContent should be dynamically imported"
  );
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
});

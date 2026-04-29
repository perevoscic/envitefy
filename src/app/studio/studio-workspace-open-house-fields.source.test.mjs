import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("open house uses property and realtor fields without the shared address field", () => {
  const formSource = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const fieldConfigSource = readSource("src/app/studio/studio-workspace-field-config.ts");
  const workspaceSource = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(fieldConfigSource, /label: "Property Address"[\s\S]*key: "eventTitle"/);
  assert.match(fieldConfigSource, /label: "Realtor Company Name"[\s\S]*key: "brokerageName"/);
  assert.match(fieldConfigSource, /label: "Agent Contact"[\s\S]*key: "rsvpContact"/);
  assert.match(
    fieldConfigSource,
    /pickCategoryFields\("Open House", \[[\s\S]*"realtorName"[\s\S]*"brokerageName"[\s\S]*"parkingInfo"[\s\S]*\]\)/,
  );
  assert.match(formSource, /const isOpenHouse = details\.category === "Open House";/);
  assert.match(
    formSource,
    /isOpenHouse\s*\?\s*\["eventDate", "startTime"\]\s*:\s*\["eventDate", "startTime", "location"\]/,
  );
  assert.match(formSource, />\s*Listing\s*</);
  assert.match(formSource, />\s*Open House Time\s*</);
  assert.match(formSource, />\s*Property Facts\s*</);
  assert.match(formSource, />\s*Agent\s*</);
  assert.match(
    formSource,
    /const openHouseAgentFields = \[[\s\S]*"realtorName", "brokerageName"[\s\S]*openHouseAgentContactField/s,
  );
  assert.match(
    workspaceSource,
    /if \(details\.category === "Open House" && field\.key === "location"\) return false;/,
  );
});

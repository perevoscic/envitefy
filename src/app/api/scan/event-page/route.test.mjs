import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

test("scan event page route enriches missing venue addresses through provider lookup", () => {
  const source = fs.readFileSync(
    path.join(repoRoot, "src/app/api/scan/event-page/route.ts"),
    "utf8",
  );

  assert.match(source, /enrichOcrVenueAddress/);
  assert.match(source, /locationEnrichment/);
  assert.match(source, /buildOcrLocationContext/);
  assert.match(source, /buildScanEventPageHistoryPayload\(\{[\s\S]*locationEnrichment/);
  assert.doesNotMatch(source, /Gateway Academy/i);
  assert.doesNotMatch(source, /Poinciana/i);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("football discovery content renders attendance before generic cards", () => {
  const source = readSource(
    "src/components/football-discovery/FootballDiscoveryContent.tsx"
  );

  const attendanceIndex = source.indexOf('section.id === "attendance"');
  const cardsIndex = source.indexOf("section.cards && section.cards.length > 0");

  assert.ok(attendanceIndex >= 0, "attendance branch should exist");
  assert.ok(cardsIndex >= 0, "generic cards branch should exist");
  assert.ok(
    attendanceIndex < cardsIndex,
    "attendance branch must be evaluated before the generic cards branch"
  );
});

test("football public renderer uses saved template chrome and keeps the legacy fallback", () => {
  const source = readSource(
    "src/components/football-discovery/FootballDiscoveryContent.tsx"
  );

  assert.match(source, /templateChrome\.titleTypography\.heroClassName/);
  assert.match(source, /templateChrome\.navShellClass/);
  assert.match(source, /templateChrome\.sectionClass/);
  assert.match(source, /data-page-template-id/);
  assert.match(source, /EventActions/);
  assert.match(source, /EventDeleteModal/);
  assert.match(source, /buildEditLink/);
  assert.match(source, /Football discovery/);
  assert.match(source, /min-h-screen bg-\[radial-gradient\(circle_at_top_left/);
});

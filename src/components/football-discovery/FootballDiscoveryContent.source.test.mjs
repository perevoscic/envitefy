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

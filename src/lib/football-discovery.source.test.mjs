import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("football discovery mapping preserves announcements and ready status", () => {
  const source = readSource("src/lib/football-discovery.ts");

  assert.ok(
    source.includes("parseResult.communications.announcements"),
    "football discovery should keep parseResult communications announcements"
  );
  assert.ok(
    source.includes("items: mergedAnnouncements"),
    "football discovery should continue writing merged announcements into advancedSections"
  );
  assert.ok(
    source.includes(
      "Array.isArray(adv?.announcements?.items) && adv.announcements.items.length > 0"
    ),
    "football builder statuses should mark announcements ready when items exist"
  );
});

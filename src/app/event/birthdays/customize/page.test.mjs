import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("birthday publish payload clears draft status", () => {
  const source = readSource("src/app/event/birthdays/customize/page.tsx");

  assert.match(
    source,
    /category: "Birthdays",\s+createdVia: "birthday-renderer",\s+status: "published",\s+draftStatus: "published",/,
  );
});

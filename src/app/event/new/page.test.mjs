import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("/event/new redirects to the gymnastics builder", () => {
  const source = readSource("src/app/event/new/page.tsx");

  assert.match(source, /import \{ redirect \} from "next\/navigation";/);
  assert.match(source, /redirect\("\/event\/gymnastics"\);/);
});

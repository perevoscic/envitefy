import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio api failure responses use the resolved provider", () => {
  const source = readSource("src/app/api/studio/generate/route.ts");

  assert.match(source, /import \{ resolveStudioProvider \} from "@\/lib\/studio\/provider";/);
  assert.match(source, /const provider = resolveStudioProvider\(\);/);
  assert.match(source, /provider,/);
  assert.doesNotMatch(source, /provider: "gemini"/);
});

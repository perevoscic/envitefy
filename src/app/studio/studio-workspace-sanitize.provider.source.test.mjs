import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio sanitize preserves provider on generation errors instead of forcing gemini", () => {
  const source = readSource("src/app/studio/studio-workspace-sanitize.ts");

  assert.match(source, /const provider = readString\(value\.provider\);/);
  assert.match(source, /provider: provider === "openai" \? "openai" : "gemini"/);
});

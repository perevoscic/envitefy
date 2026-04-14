import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio gemini image prep accepts same-origin relative asset urls for edits", () => {
  const source = readSource("src/lib/studio/gemini.ts");

  assert.match(source, /import \{ absoluteUrl \} from "@\/lib\/absolute-url";/);
  assert.match(
    source,
    /const resolvedUrl = trimmed\.startsWith\("\/"\) \? await absoluteUrl\(trimmed\) : trimmed;/,
  );
  assert.ok(source.includes('if (!/^https?:\\/\\//i.test(resolvedUrl)) return null;'));
  assert.match(source, /const response = await fetch\(resolvedUrl\);/);
});

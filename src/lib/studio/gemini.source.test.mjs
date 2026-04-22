import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio gemini image prep accepts same-origin relative asset urls for edits", () => {
  const source = readSource("src/lib/studio/gemini.ts");

  assert.match(
    source,
    /import \{\s*resolveStudioSourceImage,\s*type StudioResolvedSourceImage,\s*\} from "@\/lib\/studio\/source-image";/s,
  );
  assert.match(source, /const sourceImage = sourceImageDataUrl\s*\?\s*await geminiStudioDeps\.resolveStudioSourceImage\(sourceImageDataUrl\)\s*:\s*null;/s);
  assert.doesNotMatch(source, /absoluteUrl/);
  assert.doesNotMatch(source, /resolveInlineImageSource/);
});

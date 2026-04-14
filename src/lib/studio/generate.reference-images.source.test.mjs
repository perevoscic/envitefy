import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio generation fails image creation when any attached reference photo cannot be resolved", () => {
  const source = readSource("src/lib/studio/generate.ts");

  assert.match(
    source,
    /const requestedRefCount = request\.event\.referenceImageUrls\?\.length \?\? 0;/,
  );
  assert.match(
    source,
    /const referenceImages = await resolveStudioReferenceImages\(request\.event\.referenceImageUrls\);/,
  );
  assert.match(
    source,
    /if \(requestedRefCount > 0 && referenceImages\.length !== requestedRefCount\) \{/,
  );
  assert.match(source, /code: "reference_images_unavailable"/);
  assert.match(
    source,
    /The invite was not generated because attached reference photos could not be used\./,
  );
  assert.doesNotMatch(source, /The artwork was created without them\./);
});

test("poster-first live-card image generation passes posterTextInImage for birthday and wedding page cards", () => {
  const source = readSource("src/lib/studio/generate.ts");

  assert.match(source, /posterTextInImage:/);
  assert.match(source, /mode === "both"/);
  assert.match(source, /surface === "image"/);
  assert.match(source, /isPosterFirstBirthdayOrWedding\(request\.event\.category\)/);
});

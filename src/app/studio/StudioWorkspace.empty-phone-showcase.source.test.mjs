import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio phone empty state renders one category-driven showcase live card", () => {
  const phonePane = readSource("src/app/studio/workspace/StudioPhonePreviewPane.tsx");
  const showcasePreviews = readSource("src/lib/studio/showcase-previews.ts");

  assert.match(phonePane, /const showcasePreview = getStudioCategoryShowcasePreview\(details\.category\);/);
  assert.match(phonePane, /<StudioShowcaseLiveCard/);
  assert.match(phonePane, /buttonChromeSize="compact"/);
  assert.doesNotMatch(phonePane, /showcaseCards\.slice\(0,\s*2\)/);
  assert.doesNotMatch(phonePane, /Studio Assistant/);
  assert.doesNotMatch(phonePane, /Live card examples \(/);

  assert.match(showcasePreviews, /Birthday:\s*requireLandingShowcasePreview\("lara-s-7th-dino-quest"\)/);
  assert.match(showcasePreviews, /Wedding:\s*requireLandingShowcasePreview\("garden-vows"\)/);
  assert.match(
    showcasePreviews,
    /Anniversary:\s*anniversaryFallbackPreview/,
  );
});

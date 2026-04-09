import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

/** Lucide `Sparkles` was omitted or tree-shaken in some bundles, causing ReferenceError at runtime. */
test("studio workspace sources do not reference lucide Sparkles icon (use WandSparkles)", () => {
  const files = [
    "src/app/studio/StudioWorkspace.tsx",
    "src/app/studio/workspace/StudioFormStep.tsx",
    "src/app/studio/studio-workspace-field-config.ts",
    "src/app/studio/error.tsx",
    "src/app/studio/StudioMarketingPage.tsx",
  ];
  const jsxSparkles = /<Sparkles\b/;
  for (const rel of files) {
    const src = readSource(rel);
    assert.match(src, /WandSparkles|lucide-react/, `${rel} should import lucide icons`);
    assert.doesNotMatch(src, jsxSparkles, `${rel} must not use <Sparkles (use <WandSparkles)`);
    if (rel.includes("StudioFormStep") || rel.includes("StudioWorkspace")) {
      assert.doesNotMatch(
        src,
        /from "lucide-react"[\s\S]*\bSparkles\b/m,
        `${rel} must not import Sparkles from lucide-react`,
      );
    }
  }
});

test("signed-in shell sidebar passes WandSparkles into createSidebarIconLookup", () => {
  const src = readSource("src/app/left-sidebar.tsx");
  assert.match(src, /WandSparkles/);
  assert.doesNotMatch(src, /<Sparkles\b/);
  assert.doesNotMatch(src, /\|\|\s*Sparkles\b/);
  assert.doesNotMatch(src, /icon:\s*Sparkles\b/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio step uses a single category-specific idea panel instead of presets", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const editorStep = readSource("src/app/studio/workspace/StudioEditorStep.tsx");

  assert.match(workspace, /const studioIdeaLabel = getStudioIdeaLabel\(details\.category\);/);
  assert.match(
    workspace,
    /const studioIdeaPlaceholder = getStudioIdeaPlaceholder\(details\.category\);/,
  );
  assert.match(editorStep, /<label[\s\S]*\{studioIdeaLabel\}[\s\S]*<\/label>/);
  assert.match(editorStep, /placeholder=\{studioIdeaPlaceholder\}/);
  assert.match(editorStep, /value=\{details\.theme\}/);
  assert.match(
    editorStep,
    /setDetails\(\(prev\) => \(\{ \.\.\.prev, theme: event\.target\.value \}\)\)/,
  );
  assert.doesNotMatch(editorStep, /\bPresets\b/);
  assert.doesNotMatch(editorStep, /Custom Visual Idea/);
  assert.doesNotMatch(editorStep, /No presets for this category yet/);
});

test("studio idea copy uses cleaned category-specific wording", () => {
  const builders = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(builders, /"Field Trip\/Day": "Field Trip"/);
  assert.match(builders, /"Game Day": "Game Day"/);
  assert.match(builders, /"Custom Invite": "Custom Invite"/);
  assert.match(builders, /return `Enter Your \$\{STUDIO_IDEA_CATEGORY_LABELS\[category\]\} Idea`;/);
  assert.match(
    builders,
    /return `e\.g\. A \$\{label\.toLowerCase\(\)\} design with the colors, mood, and details you want\.\.\.`;/,
  );
});

test("studio fallback thumbnails no longer depend on preset matching", () => {
  const builders = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(
    builders,
    /export function getFallbackThumbnail\(details: EventDetails\) \{\s*return svgThumbnail\(getDisplayTitle\(details\), "#111827", "#7c3aed"\);\s*\}/s,
  );
  assert.doesNotMatch(builders, /getPresetsForDetails\(/);
});

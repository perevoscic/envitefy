import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio details step keeps the combined idea panel and adds image finish presets", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const formStep = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const presetSource = readSource("src/lib/studio/image-finish-presets.ts");

  assert.match(workspace, /const studioIdeaLabel = getStudioIdeaLabel\(details\.category\);/);
  assert.match(
    workspace,
    /const studioIdeaPlaceholder = getStudioIdeaPlaceholder\(details\.category\);/,
  );
  assert.match(formStep, /Invitation Idea & Details/);
  assert.match(formStep, /placeholder=\{studioIdeaPlaceholder\}/);
  assert.match(formStep, /value=\{ideaValue\}/);
  assert.match(
    formStep,
    /import \{\s*getStudioImageFinishPresets,\s*resolveStudioImageFinishPreset,\s*\} from "@\/lib\/studio\/image-finish-presets";/,
  );
  assert.match(formStep, /const imageFinishPresets = getStudioImageFinishPresets\(details\.category\);/);
  assert.match(formStep, /Image Finish/);
  assert.match(formStep, /imageFinishPreset: active \? "" : preset\.label,/);
  assert.match(formStep, /selectedImageFinishPreset\.description/);
  assert.match(
    formStep,
    /theme: value,\s*detailsDescription: value,/,
  );
  assert.doesNotMatch(formStep, /Custom Visual Idea/);
  assert.doesNotMatch(formStep, /No presets for this category yet/);
  assert.match(presetSource, /Birthday:/);
  assert.match(presetSource, /"Game Day":/);
  assert.match(presetSource, /Wedding:/);
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

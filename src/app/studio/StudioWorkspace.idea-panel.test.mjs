import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio details step splits Event Details and Design Idea while keeping image finish presets", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const formStep = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const presetSource = readSource("src/lib/studio/image-finish-presets.ts");

  assert.match(
    workspace,
    /const studioDesignIdeaPlaceholder = getStudioDesignIdeaPlaceholder\(details\.category\);/,
  );
  assert.match(
    workspace,
    /const studioEventDetailsPlaceholder = getStudioEventDetailsPlaceholder\(details\.category\);/,
  );
  assert.match(formStep, /Event Details/);
  assert.match(formStep, /Design Idea/);
  assert.match(formStep, /placeholder=\{studioEventDetailsPlaceholder\}/);
  assert.match(formStep, /placeholder=\{studioDesignIdeaPlaceholder\}/);
  assert.match(formStep, /value=\{details\.detailsDescription\}/);
  assert.match(formStep, /value=\{details\.theme\}/);
  assert.match(formStep, /updateEventDetailsText/);
  assert.match(formStep, /updateDesignIdeaText/);
  assert.match(
    formStep,
    /import \{\s*getStudioImageFinishPresets,\s*resolveStudioImageFinishPreset,\s*\} from "@\/lib\/studio\/image-finish-presets";/,
  );
  assert.match(formStep, /const imageFinishPresets = getStudioImageFinishPresets\(details\.category\);/);
  assert.match(formStep, /Visual Style/);
  assert.match(formStep, /imageFinishPreset: prev\.imageFinishPreset === label \? "" : label,/);
  assert.match(formStep, /selectedImageFinishPreset\?\.label/);
  assert.doesNotMatch(formStep, /Invitation Idea & Details/);
  assert.doesNotMatch(
    formStep,
    /theme: value,\s*detailsDescription: value,/,
  );
  assert.doesNotMatch(formStep, /Custom Visual Idea/);
  assert.doesNotMatch(formStep, /No presets for this category yet/);
  assert.match(presetSource, /Birthday:/);
  assert.match(presetSource, /"Game Day":/);
  assert.match(presetSource, /Wedding:/);
});

test("studio details copy uses separate placeholders for Event Details and Design Idea", () => {
  const builders = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(
    builders,
    /"e\.g\. A bold superhero-and-dino party with comic-book energy, bright primaries, and playful lighting\."/,
  );
  assert.match(
    builders,
    /"e\.g\. Join us for pizza, cake, arcade games, and birthday fun after the structured details above\."/,
  );
  assert.match(builders, /"Field Trip\/Day": "Field Trip"/);
  assert.match(builders, /"Game Day": "Game Day"/);
  assert.match(builders, /"Custom Invite": "Custom Invite"/);
  assert.match(
    builders,
    /return `e\.g\. A \$\{label\.toLowerCase\(\)\} invite with the colors, mood, texture, and visual direction you want\.\.\.`;/,
  );
  assert.match(
    builders,
    /return "e\.g\. Add anything guests should know beyond the structured fields above\.";/,
  );
});

test("studio validation requires both text inputs in manual mode but preserves flyer bypass", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(
    workspace,
    /if \(details\.sourceMediaMode === "flyer" && clean\(details\.sourceFlyerUrl\)\) \{\s*return true;\s*\}/s,
  );
  assert.match(
    workspace,
    /if \(!clean\(details\.detailsDescription\) \|\| !clean\(details\.theme\)\) \{\s*return false;\s*\}/s,
  );
  assert.match(
    workspace,
    /detailsDescription:\s*clean\(\s*typeof guessed\?\.description === "string" \? guessed\.description : "",\s*\)/s,
  );
  assert.doesNotMatch(
    workspace,
    /theme:\s*clean\(\s*typeof guessed\?\.description === "string" \? guessed\.description : "",\s*\)/s,
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

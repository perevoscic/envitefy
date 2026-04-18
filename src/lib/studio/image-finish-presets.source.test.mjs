import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio image finish preset registry covers every category with five premium presets", () => {
  const source = readSource("src/lib/studio/image-finish-presets.ts");

  assert.match(source, /export const STUDIO_IMAGE_FINISH_PRESETS:/);
  assert.match(source, /Birthday:\s*\[/);
  assert.match(source, /"Game Day":\s*\[/);
  assert.match(source, /Wedding:\s*\[/);
  assert.match(source, /"Bridal Shower":\s*\[/);
  assert.match(source, /"Baby Shower":\s*\[/);
  assert.match(source, /"Field Trip\/Day":\s*\[/);
  assert.match(source, /Anniversary:\s*\[/);
  assert.match(source, /Housewarming:\s*\[/);
  assert.match(source, /"Custom Invite":\s*\[/);
  assert.match(source, /label: "Playful Pastels", description: "soft, colorful, cheerful"/);
  assert.match(source, /label: "Electric Arena", description: "vibrant, modern sports poster feel"/);
  assert.match(source, /label: "Soft Ivory", description: "airy, refined, minimal luxury"/);
  assert.match(source, /label: "Parisian Tea", description: "chic, delicate, elegant"/);
  assert.match(source, /label: "Bundle of Joy", description: "bright, happy, welcoming"/);
  assert.match(source, /label: "Clean Academic", description: "simple, organized, school-friendly"/);
  assert.match(source, /label: "Classic Gold", description: "timeless and celebratory"/);
  assert.match(source, /label: "Urban Nest", description: "stylish, contemporary, upbeat"/);
  assert.match(source, /label: "Vibrant Celebration", description: "colorful, lively, adaptable"/);
  assert.match(source, /export function getStudioImageFinishPresets\(/);
  assert.match(source, /export function resolveStudioImageFinishPreset\(/);
});

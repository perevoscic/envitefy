import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readBuildersSource() {
  return fs.readFileSync(path.join(process.cwd(), "src/app/studio/studio-workspace-builders.ts"), "utf8");
}

test("studio builders frame birthday themes as birthday-party concepts", () => {
  const source = readBuildersSource();

  assert.match(source, /Interpret the user's theme words as a birthday-party version of that idea/);
  assert.match(source, /Jurassic Park birthday party/);
  assert.match(source, /balloons, cake, candles, wrapped gifts, themed desserts/);
  assert.match(
    source,
    /Treat the user's words as the theme of the invitation, while still expressing the selected category clearly\./,
  );
});

test("studio builders keep custom invites celebration-oriented instead of literal scenery", () => {
  const source = readBuildersSource();

  assert.match(source, /invitation-worthy celebration or hosted-event version of that idea/);
  assert.match(source, /You may add generic category-appropriate celebration decor and styling cues/);
  assert.match(source, /Never fabricate names, phone numbers, addresses, schedules, or event copy/);
});

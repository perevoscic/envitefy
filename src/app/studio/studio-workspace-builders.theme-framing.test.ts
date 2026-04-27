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
    /Apply the Design Idea to artwork, palette, composition, mood, and themeStyle while still expressing the selected category clearly\./,
  );
  assert.match(
    source,
    /Use Event Details as the source for guest-facing specificity, invitation copy, and factual grounding\. Do not let Design Idea-only nouns become visible copy\./,
  );
});

test("studio builders keep custom invites celebration-oriented instead of literal scenery", () => {
  const source = readBuildersSource();

  assert.match(source, /invitation-worthy celebration or hosted-event version of that idea/);
  assert.match(source, /You may add generic category-appropriate celebration decor and styling cues/);
  assert.match(source, /Never fabricate names, phone numbers, addresses, schedules, or event copy/);
});

test("studio builders frame game day themes as sports invitation concepts", () => {
  const source = readBuildersSource();

  assert.match(
    source,
    /Interpret the user's theme words as a real game-day invitation version of that idea/,
  );
  assert.match(source, /Generate a game day invitation image\./);
  assert.match(
    source,
    /Do not hallucinate team logos, mascots, scoreboard text, jersey numbers, sponsor marks, branded venue signage, or specific players\./,
  );
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/GenderRevealTemplateView.tsx"),
  "utf8",
);

test("gender reveal live page keeps the hero image and posts Team Pink/Blue with RSVP", () => {
  assert.match(source, /\/templates\/hero-images\/gender reveal-hero\.jpeg/);
  assert.match(source, /Team Pink or Team Blue\?/);
  assert.match(source, /fetch\(`\/api\/events\/\$\{eventId\}\/rsvp`/);
  assert.match(source, /answersJson/);
  assert.match(source, /genderGuess/);
  assert.match(source, /coming/);
  assert.match(source, /pending/);
  assert.match(source, /guesses/);
  assert.match(source, /Reveal girl/);
  assert.match(source, /Add to calendar/);
});

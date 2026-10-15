import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { FEATURES_OCT26_SUBJECT, renderFeaturesEmail } from "./features-oct26.ts";

test("renderFeaturesEmail resolves every hosted URL to a public origin", () => {
  const html = renderFeaturesEmail({ baseUrl: "http://localhost:3000" });
  assert.doesNotMatch(html, /localhost|\{\{ORIGIN\}\}/);
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /\{\{greeting\}\}/);
  assert.ok(FEATURES_OCT26_SUBJECT.length > 0);
});

test("features email images exist as generated WebP assets", () => {
  const html = renderFeaturesEmail({ baseUrl: "https://envitefy.com" });
  const images = [
    ...html.matchAll(/https:\/\/envitefy\.com(\/email\/features-oct26\/[a-z-]+\.webp)/g),
  ].map((m) => m[1]);
  assert.equal(new Set(images).size, 6);
  for (const path of images) {
    assert.ok(fs.existsSync(new URL(`../../../public${path}`, import.meta.url)), path);
  }
});

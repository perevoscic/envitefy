import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pageSource = fs.readFileSync("src/app/baby-showers/page.tsx", "utf8");
const viewSource = fs.readFileSync("src/app/baby-showers/BabyShowersLandingView.tsx", "utf8");
const stylesSource = fs.readFileSync(
  "src/app/baby-showers/BabyShowersLandingView.module.css",
  "utf8",
);

test("baby showers uses its dedicated invitation and registry landing experience", () => {
  assert.match(pageSource, /BabyShowersLandingView/);
  assert.doesNotMatch(pageSource, /<UseCaseCategoryPage/);
  assert.match(viewSource, /SignedOutPageChrome/);
  assert.match(viewSource, /<MarketingPage/);
  assert.match(viewSource, /<MarketingHero/);
  assert.match(viewSource, /<CelebrationPreview/);
  assert.match(viewSource, /Invitations · RSVP · registries/);
  assert.match(viewSource, /Registry & wishlist links/);
  assert.match(viewSource, /without downloading an app/);
  assert.match(viewSource, /\/templates\/baby-showers\/peach-patisserie\.webp/);
  assert.match(viewSource, /ld-baby-showers-faq/);
  assert.match(stylesSource, /--baby-orange/);
  assert.match(stylesSource, /font-playfair/);
  assert.match(stylesSource, /radial-gradient/);
  assert.doesNotMatch(stylesSource, /heroPattern::before|heroPattern::after/);
  assert.match(stylesSource, /min-height: 100svh/);
});

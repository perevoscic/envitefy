import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pageSource = fs.readFileSync("src/app/baby-showers/page.tsx", "utf8");
const viewSource = fs.readFileSync(
  "src/app/baby-showers/BabyShowersLandingView.tsx",
  "utf8",
);
const stylesSource = fs.readFileSync(
  "src/app/baby-showers/BabyShowersLandingView.module.css",
  "utf8",
);

test("baby showers uses its dedicated invitation and registry landing experience", () => {
  assert.match(pageSource, /BabyShowersLandingView/);
  assert.doesNotMatch(pageSource, /<UseCaseCategoryPage/);
  assert.match(viewSource, /SignedOutPageChrome/);
  assert.match(viewSource, /topNavVariant="transparent-dark"/);
  assert.match(viewSource, /<LandingHeroMedia/);
  assert.match(viewSource, /landingHeroGalleries\["baby-showers"\]/);
  assert.match(viewSource, /Invitations · RSVP · registries/);
  assert.match(viewSource, /Registry & wishlist links/);
  assert.match(viewSource, /No guest app needed/);
  assert.match(viewSource, /\/templates\/baby-showers\/terracotta-bloom\.webp/);
  assert.match(viewSource, /ld-baby-showers-faq/);
  assert.match(stylesSource, /--baby-orange/);
  assert.match(stylesSource, /font-playfair/);
  assert.match(stylesSource, /radial-gradient/);
  assert.doesNotMatch(stylesSource, /heroPattern::before|heroPattern::after/);
  assert.match(stylesSource, /min-height: 100svh/);
});

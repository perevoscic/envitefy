import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pageSource = fs.readFileSync("src/app/bridal-showers/page.tsx", "utf8");
const viewSource = fs.readFileSync(
  "src/app/bridal-showers/BridalShowersLandingView.tsx",
  "utf8",
);
const stylesSource = fs.readFileSync(
  "src/app/bridal-showers/BridalShowersLandingView.module.css",
  "utf8",
);

test("bridal showers uses its dedicated luxury landing experience", () => {
  assert.match(pageSource, /BridalShowersLandingView/);
  assert.doesNotMatch(pageSource, /<UseCaseCategoryPage/);
  assert.match(viewSource, /SignedOutPageChrome/);
  assert.match(viewSource, /topNavVariant="transparent-dark"/);
  assert.match(viewSource, /<LandingHeroMedia/);
  assert.match(viewSource, /landingHeroGalleries\["bridal-showers"\]/);
  assert.match(viewSource, /A beautiful beginning/);
  assert.match(viewSource, /The bespoke studio/);
  assert.match(viewSource, /Curated design suites/);
  assert.match(stylesSource, /--bridal-champagne/);
  assert.match(stylesSource, /Cormorant Garamond/);
  assert.match(stylesSource, /Great Vibes/);
  assert.doesNotMatch(viewSource, /heroVeil|heroFade/);
  assert.match(stylesSource, /\.heroTitle\s*\{[\s\S]*color: #fff;/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pageSource = fs.readFileSync("src/app/bridal-showers/page.tsx", "utf8");
const viewSource = fs.readFileSync("src/app/bridal-showers/BridalShowersLandingView.tsx", "utf8");
const stylesSource = fs.readFileSync(
  "src/app/bridal-showers/BridalShowersLandingView.module.css",
  "utf8",
);

test("bridal showers uses its dedicated luxury landing experience", () => {
  assert.match(pageSource, /BridalShowersLandingView/);
  assert.doesNotMatch(pageSource, /<UseCaseCategoryPage/);
  assert.match(viewSource, /SignedOutPageChrome/);
  assert.match(viewSource, /<MarketingPage/);
  assert.match(viewSource, /<MarketingHero/);
  assert.match(viewSource, /<CelebrationPreview/);
  assert.match(viewSource, /A beautiful beginning/);
  assert.match(viewSource, /Your invitation preview/);
  assert.match(viewSource, /Curated design suites/);
  assert.match(stylesSource, /--bridal-champagne/);
  assert.match(stylesSource, /font-playfair/);
  assert.match(viewSource, /data-appearance-scope="authored"/);
  assert.doesNotMatch(viewSource, /heroVeil|heroFade/);
  assert.match(stylesSource, /min-height: 44px/);
});

test("bridal studio controls follow appearance while invitation paper keeps its authored palette", () => {
  const styleBlock = (selector) => {
    const start = stylesSource.indexOf(`${selector} {`);
    assert.ok(start >= 0, `Missing ${selector}`);
    return stylesSource.slice(start, stylesSource.indexOf("}", start));
  };

  for (const selector of [".studioForm", ".studioForm input", ".themePicker button"]) {
    const block = styleBlock(selector);
    assert.match(block, /background: var\(--marketing-(surface|paper)\)/);
    assert.match(block, /color: var\(--marketing-ink\)/);
  }
  assert.match(styleBlock(".formHeading"), /color: var\(--marketing-ink\)/);
  assert.match(styleBlock(".guestFlow"), /background: var\(--marketing-surface\)/);
  assert.match(styleBlock(".testimonials"), /background: var\(--marketing-soft\)/);
  assert.match(styleBlock(".previewStage"), /var\(--bridal-preview-soft\)/);
  assert.match(styleBlock(".invitationCard"), /color: var\(--bridal-preview-ink\)/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("studio marketing page uses the shared guest hero nav ordering", () => {
  const studioMarketingPage = readSource("src/app/studio/StudioMarketingPage.tsx");
  const showcaseLiveCard = readSource("src/components/studio/StudioShowcaseLiveCard.tsx");

  assert.match(studioMarketingPage, /<HeroTopNav/);
  assert.match(studioMarketingPage, /publicUseCasePrimaryNavLinks/);
  assert.match(studioMarketingPage, /signedOutMobileMenuLinks/);
  assert.match(studioMarketingPage, /navLinks=\{\[...publicUseCasePrimaryNavLinks\]\}/);
  assert.match(studioMarketingPage, /mobileNavLinks=\{\[...signedOutMobileMenuLinks\]\}/);
  assert.match(studioMarketingPage, /variant="transparent-light"/);
  assert.match(studioMarketingPage, /primaryCtaLabel="Let's create"/);
  assert.doesNotMatch(studioMarketingPage, /buildMarketingHeroNav/);
  assert.match(showcaseLiveCard, /interactive = true,/);
  assert.match(showcaseLiveCard, /interactive \? "pointer-events-auto" : "pointer-events-none"/);
  assert.match(studioMarketingPage, /interactive=\{activeIndex === index\}/);
  assert.match(
    studioMarketingPage,
    /if \(index !== activeIndex\) \{\s*event\?\.preventDefault\(\);\s*event\?\.stopPropagation\(\);\s*scrollToShowcaseIndex\(index\);\s*return;\s*\}\s*\n\s*const target = event\?\.target;/,
  );
});

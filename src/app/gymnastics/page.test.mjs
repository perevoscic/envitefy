import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("/gymnastics renders the shared hero nav without duplicating the current page", () => {
  const page = readSource("src/app/gymnastics/page.tsx");
  const gymnasticsLanding = readSource("src/components/gymnastics-landing/GymnasticsLanding.tsx");
  const gymnasticsFaq = readSource("src/components/gymnastics-landing/GymnasticsLandingFaq.tsx");

  assert.match(page, /<GymnasticsLanding \/>/);
  assert.match(gymnasticsLanding, /<ScenicBackground/);
  assert.match(gymnasticsLanding, /useActiveScene\(GYMNASTICS_SCENE_ORDER, "hero"\)/);
  assert.match(gymnasticsLanding, /<HeroTopNav/);
  assert.match(gymnasticsLanding, /publicUseCasePrimaryNavLinks/);
  assert.match(gymnasticsLanding, /signedOutMobileMenuLinks/);
  assert.match(gymnasticsLanding, /navLinks=\{\[...publicUseCasePrimaryNavLinks\]\}/);
  assert.match(gymnasticsLanding, /mobileNavLinks=\{\[...signedOutMobileMenuLinks\]\}/);
  assert.match(gymnasticsLanding, /variant="transparent-dark"/);
  assert.match(gymnasticsLanding, /primaryCtaLabel="Let's create"/);
  assert.match(gymnasticsLanding, /brandHref="\/"/);
  assert.doesNotMatch(gymnasticsLanding, /buildMarketingHeroNav/);
  assert.doesNotMatch(gymnasticsLanding, /variant="glass-dark"/);
  assert.match(gymnasticsLanding, /id="hero"/);
  assert.match(gymnasticsLanding, /id="features"/);
  assert.match(gymnasticsLanding, /id="how-it-works"/);
  assert.match(gymnasticsLanding, /id="preview"/);
  assert.match(gymnasticsLanding, /id="use-cases"/);
  assert.match(gymnasticsFaq, /id="faq"/);
  assert.match(gymnasticsLanding, /<GymnasticsLandingFaq/);
  assert.match(
    gymnasticsLanding,
    /const gymnasticsSectionSpacingClass =\s*"hash-anchor-below-fixed-nav px-4 py-6 sm:px-6 lg:px-8";/,
  );
  assert.match(
    gymnasticsFaq,
    /const gymnasticsSectionSpacingClass =\s*"hash-anchor-below-fixed-nav px-4 py-6 sm:px-6 lg:px-8";/,
  );
  assert.match(gymnasticsLanding, /theme-glass-surface/);
  assert.match(gymnasticsFaq, /theme-glass-surface/);
  assert.match(gymnasticsLanding, /id="why-envitefy"/);
});

test("/gymnastics keeps gymnastics signup and launch wiring", () => {
  const gymnasticsLanding = readSource("src/components/gymnastics-landing/GymnasticsLanding.tsx");

  assert.match(gymnasticsLanding, /onGuestLoginAction=\{\(\) => openAuth\("login"\)\}/);
  assert.match(gymnasticsLanding, /onGuestPrimaryAction=\{\(\) => openAuth\("signup"\)\}/);
  assert.match(gymnasticsLanding, /const searchParams = useSearchParams\(\)/);
  assert.match(gymnasticsLanding, /const auth = searchParams\?\.get\("auth"\)/);
  assert.match(gymnasticsLanding, /auth === "signup" \|\| auth === "login"/);
  assert.match(gymnasticsLanding, /signupSource="gymnastics"/);
  assert.match(
    gymnasticsLanding,
    /successRedirectUrl=\{authMode === "signup" \? "\/event\/gymnastics" : "\/"\}/,
  );
  assert.doesNotMatch(gymnasticsLanding, /allowSignupSwitch=\{false\}/);
  assert.match(gymnasticsLanding, /href=\{isAuthenticated \? "\/event\/gymnastics" : undefined\}/);
  assert.match(
    gymnasticsLanding,
    /onClick=\{isAuthenticated \? undefined : \(\) => openAuth\("signup"\)\}/,
  );
  assert.match(gymnasticsLanding, /Let's create/);
});

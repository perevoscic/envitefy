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
  assert.match(gymnasticsLanding, /variant="glass-dark"/);
  assert.match(gymnasticsLanding, /label: "Snap", href: "\/snap"/);
  assert.match(gymnasticsLanding, /label: "Features", href: "#features"/);
  assert.match(gymnasticsLanding, /label: "How it works", href: "#how-it-works"/);
  assert.match(gymnasticsLanding, /label: "Preview", href: "#preview"/);
  assert.match(gymnasticsLanding, /label: "Use cases", href: "#use-cases"/);
  assert.match(gymnasticsLanding, /label: "Why Envitefy", href: "#why-envitefy"/);
  assert.match(gymnasticsLanding, /label: "FAQ", href: "#faq"/);
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
  assert.match(gymnasticsLanding, /signupSource="gymnastics"/);
  assert.match(gymnasticsLanding, /successRedirectUrl="\/event\/gymnastics"/);
  assert.match(gymnasticsLanding, /allowSignupSwitch=\{false\}/);
  assert.match(gymnasticsLanding, /href=\{isAuthenticated \? "\/event\/gymnastics" : undefined\}/);
  assert.match(
    gymnasticsLanding,
    /onClick=\{isAuthenticated \? undefined : \(\) => openAuth\("signup"\)\}/,
  );
  assert.match(gymnasticsLanding, /Start Your Meet Page/);
});

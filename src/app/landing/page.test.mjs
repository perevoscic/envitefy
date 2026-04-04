import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("landing page renders the new dedicated landing experience component", () => {
  const page = readSource("src/app/landing/page.tsx");
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const landingFaq = readSource("src/app/landing/sections/LandingFaq.tsx");
  const gymnasticsIndex = landingExperience.indexOf('id="gymnastics"');
  const snapIndex = landingExperience.indexOf('id="snap"');
  const snapTransformIndex = landingExperience.indexOf('id="what-you-can-snap"');

  assert.match(page, /<LandingExperience \/>/);
  assert.match(landingExperience, /id="landing-hero"/);
  assert.match(landingExperience, /id="snap"/);
  assert.match(landingExperience, /id="gymnastics"/);
  assert.match(landingExperience, /id="what-you-can-snap"/);
  assert.match(landingExperience, /id="how-it-works"/);
  assert.match(landingExperience, /id="use-cases"/);
  assert.match(landingExperience, /id="rsvp-calendar"/);
  assert.match(landingExperience, /<LandingFaq/);
  assert.match(landingFaq, /id="faq"/);
  assert.notStrictEqual(snapIndex, -1);
  assert.notStrictEqual(gymnasticsIndex, -1);
  assert.notStrictEqual(snapTransformIndex, -1);
  assert.ok(
    gymnasticsIndex < snapTransformIndex,
    'expected `id="gymnastics"` to appear before `id="what-you-can-snap"`',
  );
});

test("landing preserves auth-aware nav behavior and snap-first CTA wiring", () => {
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const heroTopNav = readSource("src/components/navigation/HeroTopNav.tsx");
  const conditionalFooter = readSource("src/components/ConditionalFooter.tsx");

  assert.match(landingExperience, /<HeroTopNav/);
  assert.match(landingExperience, /openAuth\("login"\)/);
  assert.match(landingExperience, /openAuth\("signup"\)/);
  assert.match(landingExperience, /mode=\{authMode\}/);
  assert.match(landingExperience, /onModeChange=\{setAuthMode\}/);
  assert.match(landingExperience, /signupSource="snap"/);
  assert.match(landingExperience, /successRedirectUrl="\/event"/);
  assert.match(landingExperience, /allowSignupSwitch=\{false\}/);
  assert.match(landingExperience, /label: "Snap", href: "#snap"/);
  assert.match(landingExperience, /label: "FAQ", href: "#faq"/);
  assert.match(landingExperience, /href="\/snap"/);
  assert.match(landingExperience, /href="\/gymnastics"/);
  assert.doesNotMatch(landingExperience, /Start with Gymnastics/);
  assert.doesNotMatch(landingExperience, /Explore Snap/);
  assert.match(heroTopNav, /const \{ status \} = useSession\(\)/);
  assert.match(heroTopNav, /status === "authenticated"/);
  assert.match(heroTopNav, /primaryCtaLabel = "Get Started"/);
  assert.match(conditionalFooter, /pathname === "\/landing"/);
  assert.match(conditionalFooter, /How it works/);
  assert.match(conditionalFooter, /Who it&apos;s for/);
  assert.match(conditionalFooter, /Start with Gymnastics/);
  assert.match(conditionalFooter, /Explore Snap/);
  assert.match(conditionalFooter, /href="\/privacy"/);
  assert.match(conditionalFooter, /href="\/terms"/);
  assert.match(conditionalFooter, /href="\/contact"/);
});

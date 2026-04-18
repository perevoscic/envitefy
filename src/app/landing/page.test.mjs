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
  const landingShowcase = readSource("src/components/landing/LandingLiveCardShowcase.tsx");
  const landingSnapshots = readSource("src/components/landing/landing-live-card-snapshots.ts");
  const landingStyles = readSource("src/app/landing/LandingExperience.module.css");
  const landingFaq = readSource("src/app/landing/sections/LandingFaq.tsx");
  const gymnasticsIndex = landingExperience.indexOf('id="gymnastics"');
  const snapIndex = landingExperience.indexOf('id="snap"');
  const snapTransformIndex = landingExperience.indexOf('id="what-you-can-snap"');

  assert.match(page, /<LandingExperience \/>/);
  assert.match(landingExperience, /id="landing-hero"/);
  assert.match(landingExperience, /id="snap"/);
  assert.match(landingExperience, /<LandingLiveCardShowcase \/>/);
  assert.match(landingExperience, /id="gymnastics"/);
  assert.match(landingExperience, /id="what-you-can-snap"/);
  assert.match(landingExperience, /id="how-it-works"/);
  assert.match(landingExperience, /id="use-cases"/);
  assert.match(landingExperience, /id="rsvp-calendar"/);
  assert.match(landingExperience, /useReducedMotion/);
  assert.match(landingExperience, /styles\.gymnasticsSportsPdfCard/);
  assert.match(landingExperience, /styles\.gymnasticsSportsScanBeam/);
  assert.match(landingExperience, /styles\.gymnasticsSportsConnector/);
  assert.match(landingExperience, /styles\.gymnasticsSportsPhoneShell/);
  assert.match(landingShowcase, /id="showcase"/);
  assert.match(landingShowcase, /Live Card Showcase/);
  assert.match(landingShowcase, /Open live card/);
  assert.match(
    landingShowcase,
    /import \{ landingLiveCardSnapshots \} from "@\/components\/landing\/landing-live-card-snapshots";/,
  );
  assert.match(
    landingShowcase,
    /const showcaseCards: ShowcaseCardItem\[] = landingLiveCardSnapshots\.map\(\(snapshot\) => \(\{/,
  );
  assert.match(landingShowcase, /positions=\{preview\.positions\}/);
  assert.match(landingShowcase, /interactive \? "pointer-events-auto" : "pointer-events-none"/);
  assert.match(landingShowcase, /interactive=\{activeIndex === index\}/);
  assert.match(landingShowcase, /import \{ resolveNativeShareData \} from "@\/utils\/native-share";/);
  assert.match(landingShowcase, /const nativeShareData = resolveNativeShareData\(sharePayload\);/);
  assert.doesNotMatch(landingShowcase, /for \(const candidate of shareCandidates\)/);
  assert.doesNotMatch(landingShowcase, /await navigator\.share\(candidate\);/);
  assert.doesNotMatch(landingShowcase, /createMarketingInvitationData/);
  assert.doesNotMatch(landingShowcase, /Mila Turns 8/);
  assert.doesNotMatch(landingShowcase, /\/api\/blob\/event-media\//);
  assert.doesNotMatch(landingSnapshots, /\/api\/blob\/event-media\//);
  assert.match(landingSnapshots, /\/images\/landing\/live-cards\//);
  assert.equal((landingSnapshots.match(/"id": "/g) || []).length, 13);
  assert.match(landingStyles, /\.gymnasticsSportsPdfCard\s*\{/);
  assert.match(landingStyles, /\.gymnasticsSportsScanBeam\s*\{/);
  assert.match(landingStyles, /\.gymnasticsSportsConnectorPulse\s*\{/);
  assert.match(landingStyles, /\.gymnasticsSportsPhoneShell\s*\{/);
  assert.match(landingExperience, /<LandingFaq/);
  assert.match(landingFaq, /id="faq"/);
  assert.match(
    landingExperience,
    /const landingSectionSpacingClass = "px-4 py-6 sm:px-6 lg:px-8";/,
  );
  assert.match(
    landingExperience,
    /id="cta"\s+className=\{`hash-anchor-below-fixed-nav \$\{landingSectionSpacingClass\}`\}/,
  );
  assert.match(landingFaq, /hash-anchor-below-fixed-nav/);
  assert.match(landingFaq, /px-4 py-6 sm:px-6 lg:px-8/);
  assert.notStrictEqual(snapIndex, -1);
  assert.notStrictEqual(gymnasticsIndex, -1);
  assert.notStrictEqual(snapTransformIndex, -1);
  assert.ok(
    snapTransformIndex < gymnasticsIndex,
    'expected `id="gymnastics"` to appear after `id="what-you-can-snap"`',
  );
});

test("landing preserves auth-aware nav behavior and snap-first CTA wiring", () => {
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const navHelper = readSource("src/components/navigation/marketing-hero-nav.mjs");
  const heroTopNav = readSource("src/components/navigation/HeroTopNav.tsx");
  const conditionalFooter = readSource("src/components/ConditionalFooter.tsx");

  assert.match(landingExperience, /<HeroTopNav/);
  assert.match(landingExperience, /buildMarketingHeroNav\("landing", \[/);
  assert.match(landingExperience, /openAuth\("login"\)/);
  assert.match(landingExperience, /openAuth\("signup"\)/);
  assert.match(landingExperience, /mode=\{authMode\}/);
  assert.match(landingExperience, /onModeChange=\{setAuthMode\}/);
  assert.match(landingExperience, /signupSource="snap"/);
  assert.match(landingExperience, /successRedirectUrl="\/event"/);
  assert.match(landingExperience, /allowSignupSwitch=\{false\}/);
  assert.match(navHelper, /label: "Studio", href: "\/studio"/);
  assert.match(navHelper, /label: "Snap", href: "\/snap"/);
  assert.match(navHelper, /label: "Gymnastics", href: "\/gymnastics"/);
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

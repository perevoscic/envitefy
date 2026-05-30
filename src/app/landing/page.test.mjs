import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("landing page is hosted-event-led and premium", () => {
  const page = readSource("src/app/landing/page.tsx");
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const landingFaqData = readSource("src/app/landing/faq-data.ts");
  const landingFaq = readSource("src/app/landing/sections/LandingFaq.tsx");

  assert.match(page, /<LandingExperience \/>/);
  assert.match(page, /Beautiful Hosted Event Pages, RSVP & Invitations/);
  assert.match(page, /polished hosted event page/);
  assert.doesNotMatch(page, /message, upload, snap, flyer, invite, PDF, schedule, or design idea/);

  assert.match(landingExperience, /id="landing-hero"/);
  assert.match(landingExperience, /Beautiful hosted events, from invite to RSVP/);
  assert.match(landingExperience, /Create an event page/);
  assert.match(landingExperience, /View live examples/);
  assert.match(landingExperience, /PremiumLandingHero/);
  assert.match(landingExperience, /GuestActionSuite/);
  assert.match(landingExperience, /TemplateGallery/);
  assert.match(landingExperience, /CreationPaths/);
  assert.match(landingExperience, /TrustProof/);
  assert.match(landingExperience, /FinalPremiumCta/);
  assert.match(landingExperience, /templateProofTiles/);
  assert.match(landingExperience, /templateProofTiles\.map/);
  for (const proofTitle of [
    "Nova's Space Safari",
    "BrightWorks Museum Day",
    "Maple Loft Open House",
    "Mentor Toast Night",
    "Rose Garden Bridal Brunch",
    "Sunny Sprout Baby Shower",
  ]) {
    assert.ok(landingExperience.includes(proofTitle));
  }
  for (const proofAsset of [
    "/images/landing/template-proof/nova-space-safari.webp",
    "/images/landing/template-proof/brightworks-museum-day.webp",
    "/images/landing/template-proof/maple-loft-open-house.webp",
    "/images/landing/template-proof/mentor-toast-night.webp",
    "/images/landing/template-proof/rose-garden-bridal-brunch.webp",
    "/images/landing/template-proof/sunny-sprout-baby-shower.webp",
  ]) {
    assert.ok(landingExperience.includes(proofAsset));
    assert.ok(fs.existsSync(path.join(repoRoot, "public", proofAsset.slice(1))));
  }
  assert.doesNotMatch(landingExperience, /landingLiveCardSnapshots/);
  assert.doesNotMatch(landingExperience, /SIGNUP_TEMPLATES/);
  assert.doesNotMatch(landingExperience, /templates\/weddings\/index\.json/);
  assert.doesNotMatch(landingExperience, /Wedding template proof/);
  assert.doesNotMatch(landingExperience, /Volunteer Sign-Up/);
  assert.doesNotMatch(landingExperience, /Soccer Game/);
  assert.doesNotMatch(landingExperience, /Blush Brunch Shower/);
  assert.doesNotMatch(landingExperience, /June Bug Baby Shower/);
  assert.doesNotMatch(landingExperience, /Lara's? (7th )?Dino[- ]Quest/);
  assert.doesNotMatch(landingExperience, /Lincoln Memorial Discovery Day/);
  assert.doesNotMatch(landingExperience, /The Carter Housewarming/);
  assert.doesNotMatch(landingExperience, /Founder Appreciation Night/);
  assert.doesNotMatch(landingExperience, /template-proof\/[^"]+\.svg/);
  assert.match(landingExperience, /heroProductSlides/);
  assert.match(landingExperience, /HeroProductCarousel/);
  assert.match(landingExperience, /AnimatePresence/);
  assert.match(landingExperience, /desktopImage/);
  assert.match(landingExperience, /\/images\/landing\/hero\/garden-brunch-desktop\.webp/);
  assert.match(landingExperience, /\/images\/landing\/hero\/birthday-dino-desktop\.webp/);
  assert.match(landingExperience, /\/images\/landing\/hero\/baby-shower-desktop\.webp/);
  assert.match(landingExperience, /\/images\/landing\/hero\/open-house-desktop\.webp/);
  for (const mobileHeroAsset of [
    "/images/landing/hero/garden-brunch-mobile.webp",
    "/images/landing/hero/garden-vows-mobile.webp",
    "/images/landing/hero/lincoln-discovery-mobile.webp",
    "/images/landing/hero/friday-night-lights-mobile.webp",
    "/images/landing/hero/birthday-dino-mobile.webp",
    "/images/landing/hero/baby-shower-mobile.webp",
    "/images/landing/hero/open-house-mobile.webp",
  ]) {
    assert.ok(landingExperience.includes(mobileHeroAsset));
    assert.ok(fs.existsSync(path.join(repoRoot, "public", mobileHeroAsset.slice(1))));
  }
  assert.match(landingExperience, /A party link guests can use/);
  assert.match(landingExperience, /Sweet details, beautifully organized/);
  assert.match(landingExperience, /A warm welcome in one link/);
  assert.doesNotMatch(landingExperience, /\/images\/landing\/hero\/[^"]+\.png/);
  assert.match(landingExperience, /6600/);
  assert.match(landingExperience, /min-h-\[100svh\]/);
  assert.match(landingExperience, /justify-end/);
  assert.match(landingExperience, /fill/);
  assert.match(landingExperience, /object-cover object-center/);
  assert.match(landingExperience, /variant="transparent-dark"/);
  assert.match(landingExperience, /capacity-aware claims/);
  assert.doesNotMatch(landingExperience, /PublicEventPagePanel/);
  assert.doesNotMatch(landingExperience, /Hosted page/);
  assert.doesNotMatch(landingExperience, /HeroPhonePreview/);
  assert.doesNotMatch(landingExperience, /Registry moment/);
  assert.doesNotMatch(landingExperience, /Sign-up slots/);
  assert.match(landingExperience, /#fcfbf7/);
  assert.match(landingExperience, /#201a23/);
  assert.match(landingExperience, /#43273f/);
  assert.match(landingExperience, /#d7c5a5/);
  assert.match(landingExperience, /#7a8f76/);
  assert.match(landingExperience, /id="event-pages"/);
  assert.match(landingExperience, /id="rsvp-tracking"/);
  assert.match(landingExperience, /id="upload"/);
  assert.match(landingExperience, /id="concierge"/);
  assert.match(landingExperience, /id="examples"/);
  assert.match(landingExperience, /id="creation-paths"/);
  assert.match(landingExperience, /<LandingFaq/);
  assert.match(landingExperience, /landingFlowSectionClass/);
  assert.match(landingExperience, /landingFlowContentClass/);
  assert.match(landingExperience, /landingFlowInnerClass/);
  assert.match(landingExperience, /const landingFlowSectionClass = ""/);
  assert.match(landingExperience, /px-4 py-16 sm:px-8 lg:px-10 lg:py-20/);
  assert.doesNotMatch(landingExperience, /min-h-full w-full max-w-7xl/);
  assert.doesNotMatch(landingExperience, /overflow-y-auto overscroll-contain/);
  assert.doesNotMatch(landingExperience, /landingFullViewportSectionClass/);
  assert.doesNotMatch(landingExperience, /landingFullViewportContentClass/);
  assert.doesNotMatch(landingExperience, /landingFullViewportInnerClass/);
  assert.match(landingExperience, /id="cta"/);
  assert.doesNotMatch(landingExperience, /style=\{\{ scrollMarginTop: 0 \}\}/);

  assert.match(landingFaqData, /What does Envitefy create/);
  assert.match(landingFaqData, /Can I start from an invite, flyer, schedule, or PDF/);
  assert.match(landingFaqData, /What happens when I upload someone else's invite/);
  assert.match(landingFaqData, /Can I track RSVPs/);
  assert.match(landingFaqData, /Can I create volunteer or supply sign-ups/);
  assert.match(landingFaqData, /Are wedding templates part of the product/);
  assert.match(landingFaqData, /templates, manual event creation, and upload-based creation/);
  assert.match(landingFaq, /RSVP tracking, smart sign-ups/);
  assert.match(landingFaq, /#fffafd/);
  assert.match(landingFaq, /#eadcf5/);
  assert.match(landingFaq, /hash-anchor-below-fixed-nav/);
  assert.match(landingFaq, /mx-auto max-w-5xl/);
  assert.doesNotMatch(landingFaq, /h-\[100svh\] min-h-\[100svh\] overflow-hidden/);
  assert.doesNotMatch(landingFaq, /min-h-full w-full max-w-5xl/);
  assert.doesNotMatch(landingFaq, /style=\{\{ scrollMarginTop: 0 \}\}/);
  assert.doesNotMatch(landingFaq, /overflow-y-auto overscroll-contain/);

  assert.doesNotMatch(landingExperience, /Product stack/);
  assert.doesNotMatch(landingExperience, /Upload \/ Snap imports/);
  assert.doesNotMatch(landingExperience, /Upload or snap an invite/);
  assert.doesNotMatch(
    landingExperience,
    /message, upload, snap, flyer, invite, PDF, schedule, or design idea/,
  );
  assert.doesNotMatch(landingExperience, /Create\. Snap/);
  assert.doesNotMatch(landingExperience, /Try Snap Upload/);
  assert.doesNotMatch(landingExperience, /Open Studio/);
  assert.doesNotMatch(landingExperience, /One Studio/);
  assert.doesNotMatch(landingExperience, /Start with Gymnastics/);
  assert.doesNotMatch(landingExperience, /ENVITEFY \/ STUDIO \/ SNAP \/ MEET/);
  assert.doesNotMatch(landingExperience, /id="snap"/);
  assert.doesNotMatch(landingExperience, /id="gymnastics"/);
  assert.doesNotMatch(landingExperience, /id="what-you-can-snap"/);
  assert.doesNotMatch(landingExperience, /#986548/);
  assert.doesNotMatch(landingExperience, /#f5efe7/);
  assert.doesNotMatch(landingExperience, /#d9d1c6/);
  assert.doesNotMatch(landingExperience, /#e0d8ce/);
});

test("landing keeps auth-aware nav and the live card gallery", () => {
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const landingShowcase = readSource("src/components/landing/LandingLiveCardShowcase.tsx");
  const landingSnapshots = readSource("src/components/landing/landing-live-card-snapshots.ts");
  const heroTopNav = readSource("src/components/navigation/HeroTopNav.tsx");
  const conditionalFooter = readSource("src/components/ConditionalFooter.tsx");

  assert.match(landingExperience, /<HeroTopNav/);
  assert.match(landingExperience, /primaryCtaLabel="Create an event page"/);
  assert.match(landingExperience, /authenticatedPrimaryHref="\/chat"/);
  assert.match(heroTopNav, /transparent-dark/);
  assert.match(heroTopNav, /isTransparentDark/);
  assert.match(heroTopNav, /hasScrolledPastHero/);
  assert.match(heroTopNav, /isTransparentOverHero/);
  assert.match(heroTopNav, /data-scrolled-past-hero/);
  assert.match(heroTopNav, /Math\.max\(120, window\.innerHeight \* 0\.82\)/);
  assert.match(heroTopNav, /max-w-none/);
  assert.match(heroTopNav, /grid-cols-\[minmax\(0,1fr\)_auto_minmax\(0,1fr\)\]/);
  assert.match(landingExperience, /openAuth\("login"\)/);
  assert.match(landingExperience, /openAuth\("signup"\)/);
  assert.match(landingExperience, /mode=\{authMode\}/);
  assert.match(landingExperience, /onModeChange=\{setAuthMode\}/);
  assert.match(landingExperience, /successRedirectUrl="\/"/);
  assert.doesNotMatch(landingExperience, /allowSignupSwitch=\{false\}/);
  assert.doesNotMatch(landingExperience, /signupSource=/);
  assert.doesNotMatch(landingExperience, /buildMarketingHeroNav/);

  assert.match(landingExperience, /<LandingLiveCardShowcase/);
  assert.match(landingExperience, /eyebrow="Interactive proof"/);
  assert.match(landingExperience, /Live cards connected to real event details/);
  assert.match(landingExperience, /tone="luxury"/);
  assert.match(landingShowcase, /type LandingLiveCardShowcaseProps/);
  assert.match(landingShowcase, /id="showcase"/);
  assert.match(landingShowcase, /const INITIAL_SHOWCASE_INDEX = 3/);
  assert.match(landingShowcase, /centerInitialShowcaseCard/);
  assert.match(landingShowcase, /node\.scrollLeft = targetLeft/);
  assert.match(landingShowcase, /id="showcase"\s+className="hash-anchor-below-fixed-nav overflow-x-hidden/);
  assert.match(landingShowcase, /left-1\/2 mt-12 w-screen -translate-x-1\/2 px-4 py-4/);
  assert.match(landingShowcase, /revealIn/);
  assert.doesNotMatch(landingShowcase, /h-\[100svh\] min-h-\[100svh\] overflow-hidden/);
  assert.doesNotMatch(landingShowcase, /style=\{\{ scrollMarginTop: 0 \}\}/);
  assert.doesNotMatch(landingShowcase, /fullPanelRevealIn/);
  assert.match(landingShowcase, /Open live card/);
  assert.match(
    landingShowcase,
    /import StudioShowcaseLiveCard from "@\/components\/studio\/StudioShowcaseLiveCard";/,
  );
  assert.match(
    landingShowcase,
    /const showcaseCards: ShowcaseCardItem\[] = landingShowcasePreviews\.map\(\(preview\) => \(\{/,
  );
  assert.match(landingShowcase, /const showcaseSwipeStateRef = useRef<\{/);
  assert.match(landingShowcase, /const fullscreenSwipeStateRef = useRef<\{/);
  assert.match(
    landingShowcase,
    /data-showcase-active=\{activeIndex === index \? "true" : "false"\}/,
  );
  assert.match(
    landingShowcase,
    /<StudioShowcaseLiveCard\s+preview=\{item\.preview\}\s+compactChrome\s+showcaseMode\s+interactive=\{activeIndex === index\}\s+imageLoading=\{index <= 2 \|\| activeIndex === index \? "eager" : "lazy"\}\s+imageFetchPriority=\{activeIndex === index \? "high" : "auto"\}\s+showcaseOverlay=/,
  );
  assert.doesNotMatch(landingShowcase, /createMarketingInvitationData/);
  assert.doesNotMatch(landingShowcase, /\/api\/blob\/event-media\//);
  assert.doesNotMatch(landingSnapshots, /\/api\/blob\/event-media\//);
  assert.match(landingSnapshots, /\/images\/landing\/live-cards\//);

  assert.match(conditionalFooter, /pathname === "\/landing"/);
  assert.match(conditionalFooter, /Concierge/);
  assert.match(conditionalFooter, /Live cards/);
  assert.match(conditionalFooter, /RSVP pages/);
  assert.match(conditionalFooter, /RSVP state/);
  assert.match(conditionalFooter, /Templates/);
  assert.match(conditionalFooter, /Invites/);
  assert.match(conditionalFooter, /Sign-ups/);
  assert.match(conditionalFooter, /href="\/privacy"/);
  assert.match(conditionalFooter, /href="\/terms"/);
  assert.match(conditionalFooter, /href="\/contact"/);
  assert.doesNotMatch(conditionalFooter, /Start with Gymnastics/);
  assert.doesNotMatch(conditionalFooter, /Explore Snap/);
  assert.doesNotMatch(conditionalFooter, /Upload or Snap/);
});

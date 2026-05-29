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
  assert.match(landingExperience, /landingLiveCardSnapshots/);
  assert.match(landingExperience, /templates\/weddings\/index\.json/);
  assert.match(landingExperience, /SIGNUP_TEMPLATES/);
  assert.match(landingExperience, /Wedding template proof/);
  assert.match(landingExperience, /heroProductSlides/);
  assert.match(landingExperience, /HeroProductCarousel/);
  assert.match(landingExperience, /AnimatePresence/);
  assert.match(landingExperience, /desktopImage/);
  assert.match(landingExperience, /\/images\/landing\/hero\/garden-brunch-desktop\.png/);
  assert.match(landingExperience, /6600/);
  assert.match(landingExperience, /min-h-\[100svh\]/);
  assert.match(landingExperience, /fill/);
  assert.match(landingExperience, /object-cover object-center/);
  assert.match(landingExperience, /variant="glass-dark"/);
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
  assert.match(
    landingExperience,
    /id="cta"\s+className=\{`hash-anchor-below-fixed-nav \$\{landingSectionSpacingClass\}`\}/,
  );

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
  const conditionalFooter = readSource("src/components/ConditionalFooter.tsx");

  assert.match(landingExperience, /<HeroTopNav/);
  assert.match(landingExperience, /primaryCtaLabel="Create an event page"/);
  assert.match(landingExperience, /authenticatedPrimaryHref="\/chat"/);
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

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("landing page is hosted-event-led and premium", () => {
  const page = readSource("src/app/landing/page.tsx");
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const designTestimonial = readSource("src/components/ui/design-testimonial.tsx");

  assert.match(page, /<LandingExperience \/>/);
  assert.match(page, /Beautiful Hosted Event Pages, RSVP & Invitations/);
  assert.match(page, /polished hosted event page/);
  assert.doesNotMatch(page, /message, upload, snap, flyer, invite, PDF, schedule, or design idea/);
  assert.doesNotMatch(page, /ld-landing-faq/);
  assert.doesNotMatch(page, /FAQPage/);

  assert.match(landingExperience, /id="landing-hero"/);
  assert.match(landingExperience, /Beautiful hosted events, from invite to RSVP/);
  assert.match(landingExperience, /Let's create/);
  assert.match(landingExperience, /View live examples/);
  assert.match(landingExperience, /mobilePrimaryCtaLabel: "Create invite"/);
  assert.match(landingExperience, /mobilePrimaryCtaLabel: "Create wedding"/);
  assert.match(landingExperience, /View examples/);
  assert.match(landingExperience, /PremiumLandingHero/);
  assert.match(landingExperience, /GuestActionSuite/);
  assert.match(landingExperience, /<AnimatePresence initial=\{false\} mode="sync">/);
  assert.match(landingExperience, /const preloadedImage = new window\.Image\(\)/);
  assert.match(landingExperience, /transition=\{\{ duration: 0\.32, ease: "easeOut" \}\}/);
  assert.match(landingExperience, /unoptimized/);
  assert.match(landingExperience, /className="pointer-events-none absolute inset-0 z-0"/);
  assert.match(landingExperience, /absolute inset-0 z-\[1\] bg-\[linear-gradient/);
  assert.match(landingExperience, /TemplateGallery/);
  assert.match(landingExperience, /CreationPaths/);
  assert.match(landingExperience, /TestimonialsProof/);
  assert.match(landingExperience, /DesignTestimonial/);
  assert.match(designTestimonial, /useMotionValue/);
  assert.match(designTestimonial, /useSpring/);
  assert.match(designTestimonial, /useTransform/);
  assert.match(designTestimonial, /AnimatePresence/);
  assert.match(designTestimonial, /ChevronLeft/);
  assert.match(designTestimonial, /ChevronRight/);
  assert.match(designTestimonial, /aria-label="Show previous testimonial"/);
  assert.match(designTestimonial, /aria-label="Show next testimonial"/);
  assert.doesNotMatch(designTestimonial, /<svg/);
  assert.match(landingExperience, /guestTestimonials/);
  assert.match(landingExperience, /hostTestimonials/);
  assert.match(landingExperience, /landingTestimonials/);
  assert.match(landingExperience, /function interleaveTestimonials/);
  assert.match(
    landingExperience,
    /const landingTestimonials: TestimonialItem\[] = interleaveTestimonials\(/,
  );
  const testimonialSource = landingExperience.slice(
    landingExperience.indexOf("const guestTestimonials"),
    landingExperience.indexOf("const creationPaths"),
  );
  const guestTestimonialsSource = landingExperience.slice(
    landingExperience.indexOf("const guestTestimonials"),
    landingExperience.indexOf("const hostTestimonials"),
  );
  const hostTestimonialsSource = landingExperience.slice(
    landingExperience.indexOf("const hostTestimonials"),
    landingExperience.indexOf("function interleaveTestimonials"),
  );
  assert.equal((testimonialSource.match(/quote:/g) ?? []).length, 24);
  assert.equal((guestTestimonialsSource.match(/quote:/g) ?? []).length, 12);
  assert.equal((hostTestimonialsSource.match(/quote:/g) ?? []).length, 12);
  assert.match(landingExperience, /What Guests and Hosts Are Saying/);
  assert.doesNotMatch(landingExperience, /What Our Guests Are Saying/);
  assert.doesNotMatch(landingExperience, /What Hosts Are Saying/);
  assert.doesNotMatch(landingExperience, /direction="right"/);
  assert.match(landingExperience, /id="testimonials"/);
  assert.match(landingExperience, /label: "Testimonials", href: "#testimonials"/);
  assert.match(landingExperience, /label: "About us", href: "\/about"/);
  assert.match(
    landingExperience,
    /min-h-\[100svh\] scroll-mt-0 overflow-hidden border-b border-\[#ded2bd\] bg-\[#fcfbf7\]/,
  );
  assert.match(
    landingExperience,
    /flex min-h-\[100svh\] w-full flex-col justify-center pb-12 pt-\[calc\(8\.5rem\+env\(safe-area-inset-top\)\)\]/,
  );
  assert.doesNotMatch(landingExperience, /TrustProof/);
  assert.doesNotMatch(landingExperience, /trustProofItems/);
  assert.doesNotMatch(landingExperience, /eyebrow="Trust"/);
  assert.doesNotMatch(landingExperience, /A polished link guests can act on/);
  assert.doesNotMatch(landingExperience, /FinalPremiumCta/);
  assert.match(landingExperience, /templateProofTiles/);
  assert.match(landingExperience, /templateProofTiles\.map/);
  assert.doesNotMatch(
    landingExperience,
    /Premium enough for showers\. Practical enough for schools, teams, and community plans\./,
  );
  assert.doesNotMatch(
    landingExperience,
    /Use fresh live-card and smart sign-up concepts as starting points for the event page guests will actually use\./,
  );
  for (const proofTitle of [
    "Wedding",
    "Football Night",
    "Field Trip",
    "Graduation Party",
    "Engagement Party",
    "Gender Reveal",
    "Housewarming",
    "Retirement Party",
    "Anniversary Party",
    "Pool Party",
    "Movie Night",
    "Playdate",
    "Kids Sleepover",
  ]) {
    assert.ok(landingExperience.includes(proofTitle));
  }
  for (const proofAsset of [
    "/images/landing/template-proof/generated/wedding.webp",
    "/images/landing/template-proof/generated/football-night.webp",
    "/images/landing/template-proof/generated/field-trip.webp",
    "/images/landing/template-proof/generated/graduation-party.webp",
    "/images/landing/template-proof/generated/engagement-party.webp",
    "/images/landing/template-proof/generated/gender-reveal.webp",
    "/images/landing/template-proof/generated/housewarming.webp",
    "/images/landing/template-proof/generated/retirement-party.webp",
    "/images/landing/template-proof/generated/anniversary-party.webp",
    "/images/landing/template-proof/generated/pool-party.webp",
    "/images/landing/template-proof/generated/movie-night.webp",
    "/images/landing/template-proof/generated/playdate.webp",
    "/images/landing/template-proof/generated/kids-sleepover.webp",
  ]) {
    assert.ok(landingExperience.includes(proofAsset));
    assert.ok(fs.existsSync(path.join(repoRoot, "public", proofAsset.slice(1))));
  }
  for (const testimonialImage of [
    "photo-1494790108377-be9c29b29330",
    "photo-1519085360753-af0119f7cbe7",
  ]) {
    assert.ok(landingExperience.includes(testimonialImage));
  }
  assert.match(landingExperience, /min-h-\[100svh\]/);
  assert.match(landingExperience, /pt-\[calc\(8rem\+env\(safe-area-inset-top\)\)\]/);
  assert.match(landingExperience, /112rem/);
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
  assert.match(landingExperience, /capacity state/);
  assert.match(landingExperience, /Turn every event page into the place guests actually act/);
  assert.match(landingExperience, /guestActionPreviewConfigs/);
  assert.match(landingExperience, /Guest action carousel/);
  assert.match(landingExperience, /justify-start px-4 pb-16/);
  assert.match(landingExperience, /aspect-\[9\/19\.5\]/);
  assert.match(landingExperience, /max-w-\[21\.5rem\]/);
  assert.match(landingExperience, /rounded-\[2\.15rem\]/);
  assert.match(landingExperience, /data-guest-flow-panel="guest"/);
  assert.match(landingExperience, /data-guest-flow-panel="host"/);
  assert.doesNotMatch(landingExperience, /Show previous guest action/);
  assert.doesNotMatch(landingExperience, /\{currentAction\.label\} state/);
  assert.match(landingExperience, /\/images\/landing\/guest-flow\/rsvp-table-placeholder\.webp/);
  assert.ok(
    fs.existsSync(
      path.join(repoRoot, "public/images/landing/guest-flow/rsvp-table-placeholder.webp"),
    ),
  );
  assert.match(landingExperience, /Sunny Sprout Baby Shower/);
  assert.match(landingExperience, /7200/);
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
  assert.match(landingExperience, /href: "#guest-flow"/);
  assert.match(landingExperience, /label: "Start", href: "#creation-paths"/);
  assert.match(
    landingExperience,
    /label: "Templates", href: "#examples"[\s\S]*label: "Start", href: "#creation-paths"/,
  );
  assert.doesNotMatch(landingExperience, /label: "FAQ", href: "#faq"/);
  assert.doesNotMatch(landingExperience, /href: "#faq"/);
  assert.match(landingExperience, /label: "Concierge", href: "#concierge"/);
  assert.match(landingExperience, /id="guest-flow"/);
  assert.doesNotMatch(landingExperience, /id="faq"/);
  assert.doesNotMatch(landingExperience, /id="rsvp-tracking"/);
  assert.match(landingExperience, /id="upload"/);
  assert.match(landingExperience, /id="examples"/);
  assert.match(landingExperience, /id="creation-paths"/);
  assert.doesNotMatch(landingExperience, /Talk through a live card/);
  assert.doesNotMatch(landingExperience, /ConciergeSimulation/);
  assert.doesNotMatch(landingExperience, /Live card simulator/);
  assert.doesNotMatch(landingExperience, /<LandingFaq/);
  assert.doesNotMatch(landingExperience, /LandingFaq from/);
  assert.match(landingExperience, /landingFlowSectionClass/);
  assert.doesNotMatch(landingExperience, /landingFlowContentClass/);
  assert.match(landingExperience, /landingFlowInnerClass/);
  assert.match(landingExperience, /const landingFlowSectionClass = ""/);
  assert.match(
    landingExperience,
    /const landingViewportSectionClass = "flex min-h-\[100svh\] flex-col justify-center"/,
  );
  assert.match(
    landingExperience,
    /"scroll-mt-0 overflow-hidden border-y border-\[#2e2432\] bg-\[#201a23\] text-white"/,
  );
  assert.match(
    landingExperience,
    /grid min-h-\[100svh\] w-full lg:grid-cols-\[minmax\(22rem,34vw\)_minmax\(0,1fr\)\]/,
  );
  assert.doesNotMatch(landingExperience, /px-4 py-16 sm:px-8 lg:px-10 lg:py-20/);
  assert.doesNotMatch(landingExperience, /min-h-full w-full max-w-7xl/);
  assert.doesNotMatch(landingExperience, /overflow-y-auto overscroll-contain/);
  assert.doesNotMatch(landingExperience, /landingFullViewportSectionClass/);
  assert.doesNotMatch(landingExperience, /landingFullViewportContentClass/);
  assert.doesNotMatch(landingExperience, /landingFullViewportInnerClass/);
  assert.doesNotMatch(landingExperience, /id="cta"/);
  assert.doesNotMatch(landingExperience, /style=\{\{ scrollMarginTop: 0 \}\}/);

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
  assert.match(landingExperience, /primaryCtaLabel="Let's create"/);
  assert.match(landingExperience, /authenticatedPrimaryHref="\/chat"/);
  assert.match(heroTopNav, /transparent-dark/);
  assert.match(heroTopNav, /isTransparentDark/);
  assert.match(heroTopNav, /hasScrolledPastHero/);
  assert.match(heroTopNav, /activeNavHref/);
  assert.match(heroTopNav, /syncActiveNavHref/);
  assert.match(heroTopNav, /Math\.max\(160, window\.innerHeight \* 0\.5\)/);
  assert.match(heroTopNav, /document\.getElementById\("landing-hero"\)/);
  assert.match(heroTopNav, /return null/);
  assert.match(heroTopNav, /let nextActiveHref: string \| null = null/);
  assert.match(heroTopNav, /handleHashLinkClick/);
  assert.match(heroTopNav, /window\.history\.pushState\(null, "", href\)/);
  assert.match(heroTopNav, /window\.scrollTo\(\{/);
  assert.match(heroTopNav, /aria-current/);
  assert.match(heroTopNav, /nav-chrome-pill-active/);
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
  assert.match(
    landingShowcase,
    /id="showcase"\s+className="flex min-h-\[100svh\] flex-col justify-center overflow-x-clip pb-16 pt-32 lg:pb-20 lg:pt-32"/,
  );
  assert.match(landingShowcase, /left-1\/2 mt-12 w-screen -translate-x-1\/2 py-4/);
  assert.match(landingShowcase, /revealIn/);
  assert.doesNotMatch(landingShowcase, /h-\[100svh\] min-h-\[100svh\] overflow-hidden/);
  assert.doesNotMatch(landingShowcase, /hash-anchor-below-fixed-nav/);
  assert.doesNotMatch(landingShowcase, /px-4 py-16 sm:px-6 lg:px-8/);
  assert.doesNotMatch(landingShowcase, /px-4 py-4 sm:px-6 lg:px-8/);
  assert.doesNotMatch(landingShowcase, /overflow-x-hidden/);
  assert.doesNotMatch(landingShowcase, /overflow-y-auto overscroll-contain/);
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

  assert.match(conditionalFooter, /MARKETING_FOOTER_GROUPS/);
  assert.match(conditionalFooter, /"\/landing"/);
  assert.match(conditionalFooter, /Concierge/);
  assert.match(conditionalFooter, /Live cards/);
  assert.match(conditionalFooter, /RSVP event pages/);
  assert.match(conditionalFooter, /Guest action flow/);
  assert.match(conditionalFooter, /Templates/);
  assert.match(conditionalFooter, /Invites/);
  assert.match(conditionalFooter, /Sign-ups/);
  assert.match(conditionalFooter, /Share without an app/);
  assert.match(conditionalFooter, /href: "\/privacy"/);
  assert.match(conditionalFooter, /href: "\/terms"/);
  assert.match(conditionalFooter, /href: "\/contact"/);
  assert.match(conditionalFooter, /href: "\/snap"/);
  assert.match(conditionalFooter, /href: "\/showcase"/);
  assert.match(conditionalFooter, /href: "\/guides\/rsvp-event-page"/);
  assert.match(conditionalFooter, /href: "\/guides\/share-event-page-without-app"/);
  assert.doesNotMatch(conditionalFooter, /\/landing#event-pages/);
  assert.doesNotMatch(conditionalFooter, /\/landing#rsvp-tracking/);
  assert.doesNotMatch(conditionalFooter, /RSVP state/);
  assert.doesNotMatch(conditionalFooter, /Start with Gymnastics/);
  assert.doesNotMatch(conditionalFooter, /Explore Snap/);
  assert.doesNotMatch(conditionalFooter, /Upload or Snap/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("landing page is hosted-event-led and premium", () => {
  const page = readSource("src/app/landing/page.tsx");
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const landingData = readSource("src/app/landing/landing-data.ts");
  const designTestimonial = readSource("src/components/ui/design-testimonial.tsx");

  assert.match(page, /<LandingExperience \/>/);
  assert.match(page, /Beautiful Hosted Event Pages, RSVP & Invitations/);
  assert.match(page, /polished hosted event page/);
  assert.doesNotMatch(page, /message, upload, snap, flyer, invite, PDF, schedule, or design idea/);
  assert.doesNotMatch(page, /ld-landing-faq/);
  assert.doesNotMatch(page, /FAQPage/);

  assert.match(landingExperience, /id="landing-hero"/);
  assert.match(landingData, /Beautiful hosted events, from invite to RSVP/);
  assert.match(landingExperience, /Let's create/);
  assert.match(landingExperience, /View live examples/);
  assert.match(landingData, /mobilePrimaryCtaLabel: "Create invite"/);
  assert.match(landingData, /mobilePrimaryCtaLabel: "Create wedding"/);
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
  assert.match(landingData, /guestTestimonials/);
  assert.match(landingData, /hostTestimonials/);
  assert.match(landingData, /landingTestimonials/);
  assert.match(landingData, /function interleaveTestimonials/);
  assert.match(
    landingData,
    /const landingTestimonials: TestimonialItem\[] = interleaveTestimonials\(/,
  );
  const testimonialSource = landingData.slice(
    landingData.indexOf("const guestTestimonials"),
    landingData.indexOf("export const creationPaths"),
  );
  const guestTestimonialsSource = landingData.slice(
    landingData.indexOf("const guestTestimonials"),
    landingData.indexOf("const hostTestimonials"),
  );
  const hostTestimonialsSource = landingData.slice(
    landingData.indexOf("const hostTestimonials"),
    landingData.indexOf("function interleaveTestimonials"),
  );
  assert.equal((testimonialSource.match(/quote:/g) ?? []).length, 24);
  assert.equal((guestTestimonialsSource.match(/quote:/g) ?? []).length, 12);
  assert.equal((hostTestimonialsSource.match(/quote:/g) ?? []).length, 12);
  assert.match(landingExperience, /What Guests and Hosts Are Saying/);
  assert.doesNotMatch(landingExperience, /What Our Guests Are Saying/);
  assert.doesNotMatch(landingExperience, /What Hosts Are Saying/);
  assert.doesNotMatch(landingExperience, /direction="right"/);
  assert.match(landingExperience, /id="testimonials"/);
  assert.match(landingData, /publicUseCasePrimaryNavLinks/);
  assert.doesNotMatch(landingData, /href: "\/use-cases"/);
  assert.match(landingData, /href: "\/weddings"/);
  assert.match(landingData, /href: "\/baby-showers"/);
  assert.match(landingData, /href: "\/birthdays"/);
  assert.doesNotMatch(landingData, /label: "Testimonials", href: "#testimonials"/);
  assert.doesNotMatch(landingData, /label: "About us", href: "\/about"/);
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
  assert.match(landingData, /templateProofTiles/);
  assert.match(landingData, /templateProofTiles\.map/);
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
    assert.ok(landingData.includes(proofTitle));
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
    assert.ok(landingData.includes(proofAsset));
    assert.ok(fs.existsSync(path.join(repoRoot, "public", proofAsset.slice(1))));
  }
  for (const testimonialImage of [
    "photo-1494790108377-be9c29b29330",
    "photo-1519085360753-af0119f7cbe7",
  ]) {
    assert.ok(landingData.includes(testimonialImage));
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
  assert.match(landingData, /heroProductSlides/);
  assert.match(landingExperience, /heroProductSlides/);
  assert.match(landingExperience, /HeroProductCarousel/);
  assert.match(landingExperience, /AnimatePresence/);
  assert.match(landingData, /desktopImage/);
  assert.match(landingData, /\/images\/landing\/hero\/garden-brunch-desktop\.webp/);
  assert.match(landingData, /\/images\/landing\/hero\/birthday-dino-desktop\.webp/);
  assert.match(landingData, /\/images\/landing\/hero\/baby-shower-desktop\.webp/);
  assert.match(landingData, /\/images\/landing\/hero\/open-house-desktop\.webp/);
  for (const mobileHeroAsset of [
    "/images/landing/hero/garden-brunch-mobile.webp",
    "/images/landing/hero/garden-vows-mobile.webp",
    "/images/landing/hero/lincoln-discovery-mobile.webp",
    "/images/landing/hero/friday-night-lights-mobile.webp",
    "/images/landing/hero/birthday-dino-mobile.webp",
    "/images/landing/hero/baby-shower-mobile.webp",
    "/images/landing/hero/open-house-mobile.webp",
  ]) {
    assert.ok(landingData.includes(mobileHeroAsset));
    assert.ok(fs.existsSync(path.join(repoRoot, "public", mobileHeroAsset.slice(1))));
  }
  assert.match(landingData, /A party link guests can use/);
  assert.match(landingData, /Sweet details, beautifully organized/);
  assert.match(landingData, /A warm welcome in one link/);
  assert.doesNotMatch(landingData, /\/images\/landing\/hero\/[^"]+\.png/);
  assert.match(landingExperience, /6600/);
  assert.match(landingExperience, /min-h-\[100svh\]/);
  assert.match(landingExperience, /justify-end/);
  assert.match(landingExperience, /fill/);
  assert.match(landingExperience, /object-cover object-center/);
  assert.match(landingExperience, /variant="transparent-dark"/);
  assert.match(landingData, /capacity state/);
  assert.match(landingExperience, /Turn every event page into the place guests actually act/);
  assert.match(landingData, /guestActionPreviewConfigs/);
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
  assert.match(landingData, /\/images\/landing\/guest-flow\/rsvp-table-placeholder\.webp/);
  assert.ok(
    fs.existsSync(
      path.join(repoRoot, "public/images/landing/guest-flow/rsvp-table-placeholder.webp"),
    ),
  );
  assert.match(landingData, /Sunny Sprout Baby Shower/);
  assert.match(landingExperience, /7200/);
  assert.doesNotMatch(landingExperience, /PublicEventPagePanel/);
  assert.doesNotMatch(landingExperience, /Hosted page/);
  assert.doesNotMatch(landingExperience, /HeroPhonePreview/);
  assert.doesNotMatch(landingExperience, /Registry moment/);
  assert.doesNotMatch(landingExperience, /Sign-up slots/);
  assert.match(landingExperience, /#fcfbf7/);
  assert.match(landingExperience, /#201a23/);
  assert.match(landingExperience, /#43273f/);
  assert.match(landingData, /#d7c5a5/);
  assert.match(landingExperience, /#7a8f76/);
  assert.doesNotMatch(landingData, /href: "#guest-flow"/);
  assert.match(landingData, /publicUseCasePrimaryNavLinks/);
  assert.doesNotMatch(landingData, /label: "Use Cases", href: "\/use-cases"/);
  assert.match(landingExperience, /href=\{activeSlide\.href \?\? "#showcase"\}/);
  assert.doesNotMatch(landingData, /label: "Start", href: "#creation-paths"/);
  assert.doesNotMatch(landingData, /label: "Templates", href: "#examples"/);
  assert.doesNotMatch(landingExperience, /label: "FAQ", href: "#faq"/);
  assert.doesNotMatch(landingExperience, /href: "#faq"/);
  assert.doesNotMatch(landingData, /label: "Concierge", href: "#concierge"/);
  assert.match(landingExperience, /id="guest-flow"/);
  assert.doesNotMatch(landingExperience, /id="faq"/);
  assert.doesNotMatch(landingExperience, /id="rsvp-tracking"/);
  assert.match(landingExperience, /id="upload"/);
  assert.match(landingExperience, /id="examples"/);
  assert.match(
    landingExperience,
    /justify-start px-4 pb-8 pt-\[calc\(2\.25rem\+env\(safe-area-inset-top\)\)\][\s\S]*lg:justify-center/,
  );
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
  assert.match(landingExperience, /successRedirectUrl=\{authMode === "signup" \? "\/chat" : "\/"\}/);
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
    /id="showcase"\s+className="flex min-h-\[100svh\] flex-col justify-start overflow-x-clip pb-16 pt-\[calc\(2\.25rem\+env\(safe-area-inset-top\)\)\][\s\S]*lg:justify-center lg:pb-20 lg:pt-32"/,
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
  assert.match(conditionalFooter, /Use Cases/);
  assert.match(conditionalFooter, /href: "\/weddings"/);
  assert.match(conditionalFooter, /href: "\/signup-forms"/);
  assert.doesNotMatch(conditionalFooter, /href: "\/use-cases/);
  assert.doesNotMatch(conditionalFooter, /Templates/);
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

test("landing uses scroll-aware signed-out mobile bottom navigation", () => {
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const scrollAwareBottomNav = readSource("src/components/navigation/ScrollAwareBottomNav.tsx");
  const bottomNav = readSource("src/components/navigation/BottomNav.tsx");
  const createActionSheet = readSource("src/components/navigation/CreateActionSheet.tsx");
  const menuBottomSheet = readSource("src/components/navigation/MenuBottomSheet.tsx");
  const conciergeSheet = readSource("src/components/navigation/ConciergeSheet.tsx");
  const signedOutPageChrome = readSource("src/components/navigation/SignedOutPageChrome.tsx");
  const showcasePage = readSource("src/app/showcase/page.tsx");
  const mobileBrandHeader = readSource("src/components/navigation/MobileBrandHeader.tsx");
  const signedOutNav = readSource("src/components/navigation/signed-out-nav.ts");
  const signedOutNavConfig = readSource("src/config/navigation.ts");
  const officialLogoPng = path.join(repoRoot, "public/brand/envitefy-wordmark.png");
  const heroTopNav = readSource("src/components/navigation/HeroTopNav.tsx");
  const aiConciergeSection = readSource("src/app/landing/sections/AIConciergeSection.tsx");

  assert.match(signedOutNav, /from "@\/config\/navigation"/);
  assert.match(signedOutNavConfig, /export const signedOutBottomNav/);
  for (const label of ["Templates", "Examples", "Concierge", "Create", "Menu"]) {
    assert.match(signedOutNavConfig, new RegExp(`label: "${label}"`));
  }
  assert.match(signedOutNavConfig, /href: "#examples"/);
  assert.match(signedOutNavConfig, /href: "#showcase"/);
  assert.match(signedOutNavConfig, /href: "#concierge"/);
  assert.match(signedOutNavConfig, /href: "#creation-paths"/);
  assert.match(signedOutNavConfig, /href: "#menu"/);
  assert.match(signedOutNavConfig, /action: "menu"/);
  assert.match(signedOutNavConfig, /featured: true/);
  assert.doesNotMatch(signedOutNavConfig, /label: "Sign In"/);
  assert.match(signedOutNavConfig, /export const signedOutMobileMenuLinks/);
  assert.match(signedOutNavConfig, /publicUseCaseNavLinks/);
  for (const label of [
    "Weddings",
    "Bridal Showers",
    "Baby Showers",
    "Gymnastics",
    "Sports",
    "Signup Forms",
    "Gender Reveals",
    "Birthdays",
    "Guides",
    "Contact",
    "Privacy",
    "Terms",
  ]) {
    assert.match(signedOutNavConfig, new RegExp(`label: "${label}"`));
  }
  assert.doesNotMatch(signedOutNavConfig, /href: "\/use-cases/);
  assert.doesNotMatch(signedOutNavConfig, /label: "Pricing"/);
  assert.doesNotMatch(signedOutNavConfig, /label: "Help"/);

  assert.match(scrollAwareBottomNav, /document\.querySelector\("#hero, #landing-hero"\)/);
  assert.match(scrollAwareBottomNav, /new IntersectionObserver/);
  assert.match(scrollAwareBottomNav, /!entry\.isIntersecting/);
  assert.match(scrollAwareBottomNav, /threshold: \[0\]/);
  assert.match(scrollAwareBottomNav, /translate-y-full opacity-0 pointer-events-none/);
  assert.match(scrollAwareBottomNav, /translate-y-0 opacity-100 pointer-events-auto/);
  assert.match(scrollAwareBottomNav, /duration-300 ease-out/);
  assert.match(scrollAwareBottomNav, /<BottomNav/);

  assert.match(bottomNav, /aria-label="Signed-out mobile navigation"/);
  assert.match(bottomNav, /initialActiveLabel\?: string/);
  assert.match(bottomNav, /onHashSelect\?: \(href: string\) => void/);
  assert.match(bottomNav, /handleHashSelect\(item\.href\)/);
  assert.match(bottomNav, /bg-white\/95/);
  assert.match(bottomNav, /backdrop-blur-xl/);
  assert.match(bottomNav, /env\(safe-area-inset-bottom\)/);
  assert.match(bottomNav, /initialActiveLabel = "Concierge"/);
  assert.match(bottomNav, /const \[activeLabel, setActiveLabel\] = useState\(initialActiveLabel\)/);
  assert.match(bottomNav, /onHashSelect\?: \(href: string\) => void/);
  assert.match(bottomNav, /const handleHashSelect = \(href: string\) => \{/);
  assert.match(bottomNav, /onMenuSelect\?\.\(\)/);
  assert.match(bottomNav, /drop-shadow-\[0_0_3px_rgba\(139,92,246,0\.5\)\]/);
  assert.match(bottomNav, /shadow-\[0_0_6px_rgba\(139,92,246,1\)\]/);
  assert.match(bottomNav, /bg-gradient-to-tr from-pink-500 via-violet-600 to-indigo-500/);
  assert.match(bottomNav, /logo-colored\.png/);
  assert.match(bottomNav, /bg-white drop-shadow-\[0_0_8px_rgba\(255,255,255,0\.52\)\]/);
  assert.match(bottomNav, /<CreateActionSheet/);
  assert.doesNotMatch(bottomNav, /<MenuBottomSheet/);
  assert.doesNotMatch(bottomNav, /action === "signin"/);
  assert.match(signedOutPageChrome, /<HeroTopNav/);
  assert.match(signedOutPageChrome, /<BottomNav/);
  assert.match(signedOutPageChrome, /<MenuBottomSheet/);
  assert.match(signedOutPageChrome, /<ConciergeSheet/);
  assert.match(signedOutPageChrome, /<AuthModal/);
  assert.match(
    signedOutPageChrome,
    /const successRedirectUrl = authMode === "signup" \? signupSuccessRedirectUrl : loginSuccessRedirectUrl/,
  );
  assert.match(signedOutPageChrome, /const primaryCreateHref = createAction\?\.href \|\| "\/chat"/);
  assert.match(signedOutPageChrome, /const loginSuccessRedirectUrl = createAction\?\.href \|\| "\/"/);
  assert.match(signedOutPageChrome, /const signupSuccessRedirectUrl = createAction\?\.href \|\| "\/chat"/);
  assert.match(signedOutPageChrome, /router\.push\(href\.startsWith\("#"\) \? `\/landing\$\{href\}` : href\)/);
  assert.match(showcasePage, /<SignedOutPageChrome activeBottomNavLabel="Examples" \/>/);
  assert.match(createActionSheet, /Create with AI Concierge/);
  assert.match(createActionSheet, /Start from Template/);
  assert.match(createActionSheet, /href: "#examples"/);
  assert.doesNotMatch(createActionSheet, /href: "\/templates"/);
  assert.doesNotMatch(createActionSheet, /onTemplateSelect/);
  assert.match(createActionSheet, /Upload Flyer \/ Scan Invite/);
  assert.match(createActionSheet, /Create Manually/);
  assert.match(menuBottomSheet, /bg-\[#150c29\]/);
  assert.match(menuBottomSheet, /bottom-0/);
  assert.match(menuBottomSheet, /const sheetHeight = "calc\(100svh - 0\.75rem\)"/);
  assert.match(menuBottomSheet, /height: authActive \? "auto" : sheetHeight/);
  assert.match(menuBottomSheet, /maxHeight: sheetHeight/);
  assert.match(menuBottomSheet, /body\.style\.position = "fixed"/);
  assert.match(menuBottomSheet, /window\.scrollTo\(0, scrollY\)/);
  assert.match(menuBottomSheet, /overflow-y-auto/);
  assert.match(menuBottomSheet, /rounded-t-\[1\.75rem\]/);
  assert.match(menuBottomSheet, /initial=\{\{ y: "100%", opacity: 0 \}\}/);
  assert.match(menuBottomSheet, /\/brand\/envitefy-wordmark\.png/);
  assert.match(menuBottomSheet, /brightness-0 invert/);
  assert.doesNotMatch(menuBottomSheet, /envitefy-wordmark-white\.svg/);
  assert.match(menuBottomSheet, /signedOutMobileMenuLinks\.map/);
  assert.match(menuBottomSheet, /aria-label="Signed-out mobile menu"/);
  assert.match(menuBottomSheet, /Start Creating/);
  assert.match(menuBottomSheet, /Sign In/);
  assert.match(menuBottomSheet, /import LoginForm from "@\/components\/auth\/LoginForm";/);
  assert.match(menuBottomSheet, /import SignupForm from "@\/components\/auth\/SignupForm";/);
  assert.match(menuBottomSheet, /type AuthMode = "login" \| "signup";/);
  assert.match(menuBottomSheet, /const \[authMode, setAuthMode\] = useState<AuthMode \| null>\(null\);/);
  assert.match(menuBottomSheet, /onClick=\{\(\) => setAuthMode\("signup"\)\}/);
  assert.match(menuBottomSheet, /onClick=\{\(\) => setAuthMode\("login"\)\}/);
  assert.match(menuBottomSheet, /initial=\{\{ x: "105%", opacity: 0 \}\}/);
  assert.match(menuBottomSheet, /exit=\{\{ x: "-105%", opacity: 0 \}\}/);
  assert.match(menuBottomSheet, /<LoginForm/);
  assert.match(menuBottomSheet, /<SignupForm/);
  assert.doesNotMatch(menuBottomSheet, /onStartCreatingSelect/);
  assert.doesNotMatch(menuBottomSheet, /onSignInSelect/);
  assert.match(signedOutNavConfig, /label: "Weddings"/);
  assert.doesNotMatch(signedOutNavConfig, /label: "Use Cases"/);
  assert.doesNotMatch(menuBottomSheet, /Secondary/);
  assert.doesNotMatch(menuBottomSheet, /Legal/);
  assert.match(mobileBrandHeader, /const \[isHeroVisible, setIsHeroVisible\] = useState\(true\)/);
  assert.match(mobileBrandHeader, /document\.querySelector\("#landing-hero, #hero"\)/);
  assert.match(mobileBrandHeader, /new IntersectionObserver/);
  assert.match(mobileBrandHeader, /entry\.isIntersecting/);
  assert.match(mobileBrandHeader, /border-none bg-transparent/);
  assert.match(mobileBrandHeader, /shadow-none backdrop-blur-0/);
  assert.match(mobileBrandHeader, /pt-\[calc\(env\(safe-area-inset-top\)\+1rem\)\]/);
  assert.match(mobileBrandHeader, /translate-y-0 opacity-100 pointer-events-auto/);
  assert.match(mobileBrandHeader, /-translate-y-4 opacity-0 pointer-events-none/);
  assert.match(mobileBrandHeader, /data-hero-visible=/);
  assert.match(mobileBrandHeader, /\/brand\/envitefy-wordmark\.png/);
  assert.match(mobileBrandHeader, /h-auto w-\[120px\] brightness-0 invert/);
  assert.match(mobileBrandHeader, /brightness-0 invert/);
  assert.doesNotMatch(mobileBrandHeader, /envitefy-wordmark-white\.svg/);
  assert.match(mobileBrandHeader, /bg-black\/10 text-white shadow-none/);
  assert.doesNotMatch(mobileBrandHeader, /from-\[#7a6f8f\]/);
  assert.doesNotMatch(mobileBrandHeader, /rounded-full px-7/);
  assert.ok(fs.existsSync(officialLogoPng));

  assert.match(landingExperience, /<ScrollAwareBottomNav/);
  assert.match(landingExperience, /<MobileBrandHeader/);
  assert.doesNotMatch(landingExperience, /mode=\{bottomNavVisible \? "compact" : "hero"\}/);
  assert.match(landingExperience, /onMenuClick=\{\(\) => setMobileMenuOpen\(true\)\}/);
  assert.match(landingExperience, /<MenuBottomSheet/);
  assert.match(landingExperience, /<MenuBottomSheet[\s\S]*successRedirectUrl="\/"/);
  assert.match(landingExperience, /<MenuBottomSheet[\s\S]*signupSuccessRedirectUrl="\/chat"/);
  assert.doesNotMatch(landingExperience, /onStartCreatingSelect/);
  assert.doesNotMatch(landingExperience, /onSignInSelect/);
  assert.match(signedOutPageChrome, /<MenuBottomSheet[\s\S]*successRedirectUrl=\{loginSuccessRedirectUrl\}/);
  assert.match(signedOutPageChrome, /<MenuBottomSheet[\s\S]*signupSuccessRedirectUrl=\{signupSuccessRedirectUrl\}/);
  assert.match(signedOutPageChrome, /<MenuBottomSheet[\s\S]*signupSource=\{signupSource\}/);
  assert.match(signedOutPageChrome, /<MenuBottomSheet[\s\S]*signupIntent=\{signupIntent \|\| undefined\}/);
  assert.match(landingExperience, /onMenuSelect=\{\(\) => setMobileMenuOpen\(true\)\}/);
  assert.match(landingExperience, /onVisibilityChange=\{setBottomNavVisible\}/);
  assert.match(landingExperience, /pb-\[calc\(96px\+env\(safe-area-inset-bottom\)\)\] md:pb-0/);
  assert.match(landingExperience, /const \[assistantOpen, setAssistantOpen\] = useState\(false\)/);
  assert.match(landingExperience, /const openConciergeDemo = \(\) => setAssistantOpen\(true\)/);
  assert.match(landingExperience, /<ConciergeSheet/);
  assert.match(landingExperience, /onSignupSelect=\{\(\) => openAuth\("signup"\)\}/);
  assert.doesNotMatch(landingExperience, /mobileLogoOnly=\{bottomNavVisible\}/);
  assert.doesNotMatch(landingExperience, /GuestChatWidget/);
  assert.match(landingExperience, /mobileNavLinks=\{\[...signedOutMobileMenuLinks\]\}/);
  assert.match(landingExperience, /showMobileMenuAuthActions=\{false\}/);
  assert.match(landingExperience, /brandHref="\/"/);
  assert.match(landingExperience, /Try the AI Concierge/);
  assert.match(landingExperience, /openConciergeDemo/);
  assert.match(landingExperience, /<AIConciergeSection \/>/);
  assert.match(aiConciergeSection, /onPrimaryAction\?: \(\) => void/);
  assert.match(conciergeSheet, /Envitefy Concierge/);
  assert.match(conciergeSheet, /Event ideas, RSVP, gifts & setup/);
  assert.match(conciergeSheet, /logo-colored\.png/);
  assert.match(conciergeSheet, /bg-\[#f6d477\]/);
  assert.match(conciergeSheet, /style=\{\{ color: "#f9df94" \}\}/);
  assert.doesNotMatch(conciergeSheet, /<Sparkles/);
  assert.match(conciergeSheet, /Tell me what you’re planning/);
  for (const prompt of [
    "Plan my event with AI",
    "Upload an invite or flyer",
    "See what guests will see",
    "How do RSVPs work?",
    "Add gifts, registry, or notes",
  ]) {
    assert.match(conciergeSheet, new RegExp(prompt.replace(/[?]/g, "\\?")));
  }
  assert.match(conciergeSheet, /signupSuggested/);
  assert.match(conciergeSheet, /Create account/);
  assert.match(conciergeSheet, /h-\[82vh\] max-h-\[85vh\] min-h-\[70vh\]/);
  assert.match(conciergeSheet, /rounded-t-\[1\.75rem\]/);
  assert.match(conciergeSheet, /bg-\[#120b1d\]\/48 backdrop-blur-\[3px\]/);
  assert.match(conciergeSheet, /initial=\{\{ y: "100%", opacity: 0 \}\}/);
  assert.match(conciergeSheet, /pb-\[calc\(0\.85rem\+env\(safe-area-inset-bottom\)\)\]/);
  assert.doesNotMatch(conciergeSheet, /Open Envitefy guest help/);
  assert.match(heroTopNav, /mobileNavLinks\?: HeroTopNavLink\[]/);
  assert.match(heroTopNav, /mobileLogoOnly\?: boolean/);
  assert.match(heroTopNav, /mobileLogoOnly \? "hidden" : "inline-flex"/);
  assert.match(heroTopNav, /showMobileMenuAuthActions\?: boolean/);
  assert.match(heroTopNav, /resolvedMobileNavLinks\.map/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("landing page is Concierge-led and outcome-focused", () => {
  const page = readSource("src/app/landing/page.tsx");
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const landingFaqData = readSource("src/app/landing/faq-data.ts");
  const landingFaq = readSource("src/app/landing/sections/LandingFaq.tsx");

  assert.match(page, /<LandingExperience \/>/);
  assert.match(page, /AI Concierge for Invites, RSVP & Event Pages/);
  assert.match(page, /message, upload, snap, flyer, invite, PDF, schedule, or design idea/);

  assert.match(landingExperience, /id="landing-hero"/);
  assert.match(landingExperience, /Create the invite, RSVP, and event page in one place/);
  assert.match(landingExperience, /Start with Concierge/);
  assert.match(landingExperience, /Upload or snap an invite/);
  assert.match(landingExperience, /id="platform"/);
  assert.match(landingExperience, /Product stack/);
  assert.match(landingExperience, /What Envitefy creates from one starting point/);
  assert.match(landingExperience, /#fcf7fb/);
  assert.match(landingExperience, /#fbf6ff/);
  assert.match(landingExperience, /#fff1f7/);
  assert.match(landingExperience, /#a84f79/);
  assert.match(landingExperience, /#241c2b/);
  assert.match(landingExperience, /#7457a6/);
  assert.doesNotMatch(page, /themeColor: "#fbf6ff"/);
  assert.match(landingExperience, /Public event pages/);
  assert.match(landingExperience, /RSVP tracking/);
  assert.match(landingExperience, /Upload \/ Snap imports/);
  assert.match(landingExperience, /PhoneConciergePreview/);
  assert.match(landingExperience, /variant="signup"/);
  assert.match(landingExperience, /Spring carnival/);
  assert.match(landingExperience, /Ask about sign-ups/);
  assert.match(landingExperience, /id="event-pages"/);
  assert.match(landingExperience, /id="rsvp-tracking"/);
  assert.match(landingExperience, /id="upload"/);
  assert.match(landingExperience, /id="concierge"/);
  assert.match(landingExperience, /id="examples"/);
  assert.match(landingExperience, /id="workflow"/);
  assert.match(landingExperience, /<LandingFaq/);
  assert.match(
    landingExperience,
    /id="cta"\s+className=\{`hash-anchor-below-fixed-nav \$\{landingSectionSpacingClass\}`\}/,
  );

  assert.match(landingFaqData, /What does Envitefy Concierge create/);
  assert.match(landingFaqData, /Can I upload a PDF, flyer, screenshot, or invite/);
  assert.match(landingFaqData, /What happens when I upload someone else's invite/);
  assert.match(landingFaqData, /Can I track RSVPs/);
  assert.match(landingFaqData, /Can I create volunteer or supply sign-ups/);
  assert.match(landingFaqData, /manual event creation and upload-based creation/);
  assert.match(landingFaq, /RSVP tracking, smart sign-ups/);
  assert.match(landingFaq, /#fffafd/);
  assert.match(landingFaq, /#eadcf5/);

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
  assert.match(landingExperience, /primaryCtaLabel="Start with Concierge"/);
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
  assert.match(landingExperience, /eyebrow="Live card gallery"/);
  assert.match(landingExperience, /Live cards guests actually want to open/);
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
  assert.match(conditionalFooter, /AI Concierge/);
  assert.match(conditionalFooter, /Live cards/);
  assert.match(conditionalFooter, /RSVP pages/);
  assert.match(conditionalFooter, /RSVP tracking/);
  assert.match(conditionalFooter, /Upload or Snap/);
  assert.match(conditionalFooter, /Invites/);
  assert.match(conditionalFooter, /Sign-ups/);
  assert.match(conditionalFooter, /href="\/privacy"/);
  assert.match(conditionalFooter, /href="\/terms"/);
  assert.match(conditionalFooter, /href="\/contact"/);
  assert.doesNotMatch(conditionalFooter, /Start with Gymnastics/);
  assert.doesNotMatch(conditionalFooter, /Explore Snap/);
});

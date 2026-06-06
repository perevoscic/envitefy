import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("/snap renders the new landing component with key sections", () => {
  const page = readSource("src/app/snap/page.tsx");
  const snapLanding = readSource("src/components/snap-landing/SnapLanding.tsx");

  assert.match(page, /<SnapLanding \/>/);
  assert.match(page, /getServerSession\(authOptions as any\)/);
  assert.match(page, /AuthenticatedSnapUploadStart/);
  assert.match(page, /<SnapLaunchCards processInPage \/>/);
  assert.match(snapLanding, /publicUseCasePrimaryNavLinks/);
  assert.match(snapLanding, /signedOutMobileMenuLinks/);
  assert.match(snapLanding, /navLinks=\{\[...publicUseCasePrimaryNavLinks\]\}/);
  assert.match(snapLanding, /mobileNavLinks=\{\[...signedOutMobileMenuLinks\]\}/);
  assert.match(snapLanding, /variant="transparent-dark"/);
  assert.match(snapLanding, /primaryCtaLabel="Let's create"/);
  assert.match(snapLanding, /brandHref="\/"/);
  assert.doesNotMatch(snapLanding, /buildMarketingHeroNav/);
  assert.doesNotMatch(snapLanding, /variant="glass-dark"/);
  assert.doesNotMatch(snapLanding, /primaryCtaLabel="Snap Your First Invite"/);
  assert.match(snapLanding, /Stop sharing screenshots\./);
  assert.match(snapLanding, /Start sharing events\./);
  assert.match(snapLanding, /id="snap"/);
  assert.match(snapLanding, /id="how-it-works"/);
  assert.match(snapLanding, /id="use-cases"/);
  assert.match(snapLanding, /id="faq"/);
  assert.match(snapLanding, /snapHashAnchorClass = "hash-anchor-below-fixed-nav"/);
  assert.match(
    snapLanding,
    /src="\/images\/snap-hero-after\.webp"/,
  );
  assert.match(
    snapLanding,
    /alt="Envitefy Snap interface after upload conversion"/,
  );
  assert.match(
    snapLanding,
    /className=\{`\$\{snapHashAnchorClass\} px-4 pb-6 pt-\[calc\(max\(6\.5rem,calc\(env\(safe-area-inset-top\)\+5\.5rem\)\)\+1\.5rem\)\] sm:px-6 lg:px-8`\}/,
  );
  assert.match(
    snapLanding,
    /className="relative mt-2 h-\[60vh\] min-h-\[22rem\] w-full overflow-hidden rounded-\[1\.8rem\] border border-white\/14 bg-\[#090d18\]\/88 shadow-\[0_32px_90px_rgba\(4,1,14,0\.42\)\] sm:h-\[62vh\] xl:mt-0 xl:h-\[58vh\] 2xl:h-\[56vh\] md:rounded-\[2rem\]"/,
  );
  assert.match(
    snapLanding,
    /bg-\[linear-gradient\(180deg,rgba\(7,10,20,0\.1\),rgba\(7,10,20,0\.34\)\)\]/,
  );
  assert.doesNotMatch(snapLanding, /ScrollPushTransition/);
  assert.doesNotMatch(snapLanding, /useScroll\(/);
  assert.doesNotMatch(snapLanding, /useSpring\(/);
  assert.doesNotMatch(snapLanding, /useTransform\(/);
  assert.doesNotMatch(snapLanding, /scroll-push-section/);
  assert.doesNotMatch(snapLanding, /h-\[200vh\]/);
  assert.doesNotMatch(snapLanding, /sticky top-0 flex min-h-screen/);
  assert.doesNotMatch(snapLanding, /heroRef/);
  assert.doesNotMatch(snapLanding, /src="\/images\/snap-hero-before\.webp"/);
});

test("/snap includes the updated social-proof and CTA copy", () => {
  const snapLanding = readSource("src/components/snap-landing/SnapLanding.tsx");

  assert.match(snapLanding, /Trusted by 10,000\+ busy parents & organizers/);
  assert.match(snapLanding, /One tool\. Infinite events\./);
  assert.match(snapLanding, /Ready to clear the/);
  assert.match(snapLanding, /Get Started Free/);
});

test("/snap keeps public auth CTAs but renders direct upload cards for authenticated users", () => {
  const page = readSource("src/app/snap/page.tsx");
  const mainWrapper = readSource("src/components/MainContentWrapper.tsx");
  const snapLanding = readSource("src/components/snap-landing/SnapLanding.tsx");
  const snapSignupLanding = readSource("src/components/snap-landing/SnapSignupLanding.tsx");

  assert.match(page, /isAuthenticated \? \(/);
  assert.match(page, /AuthenticatedSnapUploadStart/);
  assert.match(page, /Snap \/ Upload/);
  assert.match(page, /Snap or upload your/);
  assert.match(page, /min-h-\[100dvh\] bg-transparent/);
  assert.match(page, /isAuthenticated \? "min-h-\[100dvh\] bg-transparent" : ""/);
  assert.match(page, /<Dashboard snapProcessingMode \/>/);
  assert.doesNotMatch(page, /uploadActionHref="\/snap\?action=upload"/);
  assert.match(
    mainWrapper,
    /normalizedPath === "\/snap" && !isAuthenticated/,
  );
  assert.match(snapLanding, /authenticatedPrimaryHref="\/chat"/);
  assert.match(snapLanding, /loginSuccessRedirectUrl="\/"/);
  assert.match(snapLanding, /primaryHref=\{isAuthenticated \? "\/snap" : undefined\}/);
  assert.match(snapLanding, /href=\{isAuthenticated \? "\/snap" : undefined\}/);
  assert.match(snapLanding, /successRedirectUrl=\{authMode === "signup" \? "\/snap" : "\/"\}/);

  assert.match(snapSignupLanding, /authenticatedPrimaryHref="\/"/);
  assert.match(snapSignupLanding, /loginSuccessRedirectUrl="\/"/);
  assert.match(snapSignupLanding, /<PrimaryButton href="\/" light=\{light\}>/);
  assert.match(snapSignupLanding, /successRedirectUrl="\/"/);
});

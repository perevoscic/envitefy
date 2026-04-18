import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildMarketingHeroNav } from "../../components/navigation/marketing-hero-nav.mjs";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("/snap renders the new landing component with key sections", () => {
  const page = readSource("src/app/snap/page.tsx");
  const snapLanding = readSource("src/components/snap-landing/SnapLanding.tsx");
  const navLabels = buildMarketingHeroNav("snap", [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "FAQ", href: "#faq" },
  ]).map((link) => link.label);

  assert.match(page, /<SnapLanding \/>/);
  assert.match(snapLanding, /buildMarketingHeroNav\("snap", \[/);
  assert.deepEqual(navLabels, [
    "Home",
    "Studio",
    "Gymnastics",
    "How It Works",
    "Use Cases",
    "FAQ",
  ]);
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

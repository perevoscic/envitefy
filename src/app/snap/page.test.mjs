import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const readSource = (file) => fs.readFileSync(file, "utf8");

test("signed-out Snap retains its local sections and original product visual", () => {
  const landing = readSource("src/components/snap-landing/SnapLanding.tsx");
  assert.match(landing, /marketingPageNavLinks\("\/snap"\)/);
  assert.match(landing, /<MarketingPage tone="product"/);
  assert.match(landing, /variant="transparent-light"/);
  for (const id of ["snap", "problem-section", "how-it-works", "use-cases", "faq"])
    assert.ok(landing.includes(`id="${id}"`), id);
  assert.match(landing, /src="\/images\/snap-hero-after\.webp"/);
  assert.match(landing, /alt="Envitefy Snap interface after upload conversion"/);
  assert.doesNotMatch(
    landing,
    /ScenicBackground|ScrollPushTransition|Trusted by 10,000|ParentCircle|EventPro|TeamSnap/,
  );
  assert.match(landing, /review|Review/);
  assert.match(landing, /publishing|Publish/);
});

test("Snap keeps signup attribution, query recovery and login continuation", () => {
  const landing = readSource("src/components/snap-landing/SnapLanding.tsx");
  assert.match(landing, /authenticatedPrimaryHref="\/snap"/);
  assert.match(landing, /loginSuccessRedirectUrl="\/"/);
  assert.match(landing, /const auth = searchParams\?\.get\("auth"\)/);
  assert.match(landing, /auth === "signup" \|\| auth === "login"/);
  assert.match(landing, /onGuestLoginAction=\{\(\) => openAuth\("login"\)\}/);
  assert.match(landing, /onGuestPrimaryAction=\{\(\) => openAuth\("signup"\)\}/);
  assert.match(landing, /signupSource="snap"/);
  assert.match(landing, /successRedirectUrl=\{authMode === "signup" \? "\/snap" : "\/"\}/);
  assert.match(landing, /href="\/snap"/);
  assert.doesNotMatch(landing, /fetch\(|method:.*POST/);
});

test("authenticated Snap retains direct uploads and processing instead of the marketing page", () => {
  const page = readSource("src/app/snap/page.tsx");
  const upload = readSource("src/components/snap/SnapUploadStart.tsx");
  assert.match(page, /getServerSession\(authOptions as any\)/);
  assert.match(page, /isAuthenticated \? \(/);
  assert.match(page, /<SnapUploadStart \/>/);
  assert.match(page, /<Dashboard snapProcessingMode \/>/);
  assert.match(page, /<SnapLanding \/>/);
  assert.match(upload, /<SnapLaunchCards processInPage variant="explained" \/>/);
  assert.match(upload, /Snapping means taking a photo/);
  const signup = readSource("src/components/snap-landing/SnapSignupLanding.tsx");
  assert.match(signup, /successRedirectUrl="\/"/);
});

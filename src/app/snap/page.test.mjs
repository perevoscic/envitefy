import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("/snap reuses the shared landing navigation and key anchors", () => {
  const page = readSource("src/app/snap/page.tsx");
  const snapLanding = readSource(
    "src/components/snap-landing/SnapSignupLanding.tsx",
  );

  assert.match(page, /<SnapSignupLanding \/>/);
  assert.match(snapLanding, /<LandingNav gymnasticsHref="\/gymnastics" \/>/);
  assert.match(snapLanding, /id="snap"/);
  assert.match(snapLanding, /id="benefits"/);
  assert.match(snapLanding, /id="how-it-works"/);
  assert.match(snapLanding, /id="faq"/);
});

test("/snap keeps snap-specific auth and CTA wiring", () => {
  const snapLanding = readSource(
    "src/components/snap-landing/SnapSignupLanding.tsx",
  );

  assert.match(snapLanding, /signupSource="snap"/);
  assert.match(snapLanding, /successRedirectUrl="\/event"/);
  assert.match(snapLanding, /href="\/event"/);
  assert.match(snapLanding, /openAuth\("signup"\)/);
});

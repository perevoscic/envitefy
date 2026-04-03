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
  assert.match(snapLanding, /label: "Gymnastics", href: "\/gymnastics"/);
  assert.match(snapLanding, /Stop sharing screenshots\./);
  assert.match(snapLanding, /Start sharing events\./);
  assert.match(snapLanding, /id="snap"/);
  assert.match(snapLanding, /id="how-it-works"/);
  assert.match(snapLanding, /id="use-cases"/);
  assert.match(snapLanding, /id="faq"/);
});

test("/snap includes the updated social-proof and CTA copy", () => {
  const snapLanding = readSource("src/components/snap-landing/SnapLanding.tsx");

  assert.match(snapLanding, /Trusted by 10,000\+ busy parents & organizers/);
  assert.match(snapLanding, /One tool\. Infinite events\./);
  assert.match(snapLanding, /Ready to clear the/);
  assert.match(snapLanding, /Get Started Free/);
});

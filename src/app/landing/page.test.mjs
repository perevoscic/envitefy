import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("landing page renders the new dedicated landing experience component", () => {
  const page = readSource("src/app/landing/page.tsx");
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");

  assert.match(page, /<LandingExperience \/>/);
  assert.match(landingExperience, /id="landing-hero"/);
  assert.match(landingExperience, /id="what-you-can-snap"/);
  assert.match(landingExperience, /id="how-it-works"/);
  assert.match(landingExperience, /id="use-cases"/);
  assert.match(landingExperience, /id="rsvp-calendar"/);
});

test("landing preserves auth-aware nav behavior and snap-first CTA wiring", () => {
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const conditionalFooter = readSource("src/components/ConditionalFooter.tsx");

  assert.match(landingExperience, /const \{ status \} = useSession\(\)/);
  assert.match(landingExperience, /setAuthModalOpen\(true\)/);
  assert.match(landingExperience, /mode="login"/);
  assert.match(landingExperience, /allowSignupSwitch=\{false\}/);
  assert.match(landingExperience, /status === "authenticated"/);
  assert.match(landingExperience, /href="\/snap"/);
  assert.match(landingExperience, /href="\/privacy"/);
  assert.match(landingExperience, /href="\/terms"/);
  assert.match(landingExperience, /href="\/contact"/);
  assert.doesNotMatch(conditionalFooter, /pathname === "\/landing"/);
});

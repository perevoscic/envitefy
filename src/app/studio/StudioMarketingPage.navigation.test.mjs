import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildMarketingHeroNav } from "../../components/navigation/marketing-hero-nav.mjs";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("studio marketing page uses the shared guest hero nav ordering", () => {
  const studioMarketingPage = readSource("src/app/studio/StudioMarketingPage.tsx");
  const navLabels = buildMarketingHeroNav("studio", [
    { label: "Create in Studio", href: "#features" },
    { label: "Built to be Clicked", href: "#actions" },
    { label: "Made for Real Events", href: "#use-cases" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Live Card Showcase", href: "#showcase" },
  ]).map((link) => link.label);

  assert.match(studioMarketingPage, /buildMarketingHeroNav\("studio", \[/);
  assert.match(studioMarketingPage, /<HeroTopNav/);
  assert.deepEqual(navLabels, [
    "Home",
    "Snap",
    "Gymnastics",
    "Create in Studio",
    "Built to be Clicked",
    "Made for Real Events",
    "How It Works",
    "Live Card Showcase",
  ]);
});

import assert from "node:assert/strict";
import test from "node:test";
import { buildMarketingHeroNav } from "./marketing-hero-nav.mjs";

test("buildMarketingHeroNav keeps product switching rules consistent across guest pages", () => {
  const landingLinks = buildMarketingHeroNav("landing", [{ label: "FAQ", href: "#faq" }]);
  const studioLinks = buildMarketingHeroNav("studio", [{ label: "FAQ", href: "#faq" }]);
  const snapLinks = buildMarketingHeroNav("snap", [{ label: "FAQ", href: "#faq" }]);
  const gymnasticsLinks = buildMarketingHeroNav("gymnastics", [{ label: "FAQ", href: "#faq" }]);

  const categoryLabels = [
    "Weddings",
    "Bridal Showers",
    "Baby Showers",
    "Gymnastics",
    "Signup Forms",
    "Gender Reveals",
    "Birthdays",
  ];

  assert.deepEqual(
    landingLinks.map((link) => link.label),
    [...categoryLabels, "FAQ"],
  );
  assert.deepEqual(
    studioLinks.map((link) => link.label),
    ["Home", ...categoryLabels, "FAQ"],
  );
  assert.deepEqual(
    snapLinks.map((link) => link.label),
    ["Home", ...categoryLabels, "FAQ"],
  );
  assert.deepEqual(
    gymnasticsLinks.map((link) => link.label),
    ["Home", ...categoryLabels, "FAQ"],
  );
  assert.equal(studioLinks[0]?.href, "/landing");
  assert.equal(snapLinks[1]?.href, "/weddings");
  assert.equal(gymnasticsLinks[4]?.href, "/gymnastics");
});

import assert from "node:assert/strict";
import test from "node:test";
import { buildMarketingHeroNav } from "./marketing-hero-nav.mjs";

test("buildMarketingHeroNav keeps product switching rules consistent across guest pages", () => {
  const landingLinks = buildMarketingHeroNav("landing", [{ label: "FAQ", href: "#faq" }]);
  const studioLinks = buildMarketingHeroNav("studio", [{ label: "FAQ", href: "#faq" }]);
  const snapLinks = buildMarketingHeroNav("snap", [{ label: "FAQ", href: "#faq" }]);
  const gymnasticsLinks = buildMarketingHeroNav("gymnastics", [{ label: "FAQ", href: "#faq" }]);

  assert.deepEqual(
    landingLinks.map((link) => link.label),
    ["Studio", "Snap", "Gymnastics", "FAQ"],
  );
  assert.deepEqual(
    studioLinks.map((link) => link.label),
    ["Home", "Snap", "Gymnastics", "FAQ"],
  );
  assert.deepEqual(
    snapLinks.map((link) => link.label),
    ["Home", "Studio", "Gymnastics", "FAQ"],
  );
  assert.deepEqual(
    gymnasticsLinks.map((link) => link.label),
    ["Home", "Studio", "Snap", "FAQ"],
  );
  assert.equal(studioLinks[0]?.href, "/landing");
  assert.equal(snapLinks[1]?.href, "/studio");
  assert.equal(gymnasticsLinks[2]?.href, "/snap");
});

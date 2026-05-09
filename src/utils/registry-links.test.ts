import assert from "node:assert/strict";
import test from "node:test";
import {
  AMAZON_BABY_REGISTRY_URL,
  AMAZON_REGISTRY_SEARCH_URL,
  AMAZON_WEDDING_REGISTRY_URL,
  getRegistryBrandByUrl,
  getRegistrySectionCopyForCategory,
  inferRegistryUrlFromTextForContext,
  normalizeRegistryLinks,
  validateRegistryUrl,
} from "./registry-links.ts";

test("validateRegistryUrl accepts arbitrary https registry and gift-list links", () => {
  const result = validateRegistryUrl("https://www.zola.com/registry/example#private");

  assert.equal(result.ok, true);
  assert.equal(result.brand, undefined);
  assert.equal(result.normalizedUrl, "https://www.zola.com/registry/example");
});

test("validateRegistryUrl auto-prefixes bare domains and rejects non-https links", () => {
  const normalized = validateRegistryUrl("wishlist.example.com/family");
  const insecure = validateRegistryUrl("http://wishlist.example.com/family");

  assert.equal(normalized.ok, true);
  assert.equal(normalized.normalizedUrl, "https://wishlist.example.com/family");
  assert.equal(insecure.ok, false);
});

test("normalizeRegistryLinks dedupes and keeps known-brand labels as fallbacks", () => {
  const links = normalizeRegistryLinks([
    { label: "", url: "amazon.com/wedding/share/example" },
    { label: "", url: "https://amazon.com/wedding/share/example" },
    { label: "", url: "https://wishlist.example.com/list" },
  ]);

  assert.deepEqual(links, [
    { label: "Amazon", url: "https://amazon.com/wedding/share/example" },
    { label: "wishlist.example.com", url: "https://wishlist.example.com/list" },
  ]);
  assert.equal(getRegistryBrandByUrl(links[0].url)?.defaultLabel, "Amazon");
  assert.equal(getRegistryBrandByUrl(links[1].url), null);
});

test("normalizeRegistryLinks upgrades Amazon homepage placeholders by event context", () => {
  assert.deepEqual(
    normalizeRegistryLinks([{ label: "", url: "amazon.com" }], {
      category: "Baby Showers",
    }),
    [{ label: "Amazon", url: AMAZON_BABY_REGISTRY_URL }],
  );

  assert.deepEqual(
    normalizeRegistryLinks([{ label: "", url: "https://www.amazon.com/" }], {
      category: "Weddings",
    }),
    [{ label: "Amazon", url: AMAZON_WEDDING_REGISTRY_URL }],
  );

  assert.deepEqual(
    normalizeRegistryLinks([{ label: "", url: "https://www.amazon.com/" }], {
      category: "Graduations",
    }),
    [{ label: "Amazon", url: AMAZON_REGISTRY_SEARCH_URL }],
  );
});

test("normalizeRegistryLinks preserves concrete Amazon registry deep links", () => {
  const url = "https://www.amazon.com/wedding/registry/example-couple";

  assert.deepEqual(normalizeRegistryLinks([{ label: "", url }], { category: "Weddings" }), [
    { label: "Amazon", url },
  ]);
});

test("inferRegistryUrlFromTextForContext detects registered-at-Amazon invite copy", () => {
  assert.equal(
    inferRegistryUrlFromTextForContext("Registered at Amazon", { category: "Baby Shower" }),
    AMAZON_BABY_REGISTRY_URL,
  );
  assert.equal(
    inferRegistryUrlFromTextForContext("Registry with Amazon", { title: "Garden Wedding" }),
    AMAZON_WEDDING_REGISTRY_URL,
  );
  assert.equal(
    inferRegistryUrlFromTextForContext("Shop Amazon for supplies", {
      category: "Baby Shower",
    }),
    null,
  );
});

test("housewarming events allow gift list links", () => {
  const copy = getRegistrySectionCopyForCategory("Housewarming");

  assert.equal(copy.allowsLinks, true);
  assert.equal(copy.sectionLabel, "Gift List");
  assert.equal(copy.linksLabel, "Gift list links");
});

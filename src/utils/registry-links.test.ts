import test from "node:test";
import assert from "node:assert/strict";
import {
  getRegistryBrandByUrl,
  getRegistrySectionCopyForCategory,
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

test("housewarming events allow gift list links", () => {
  const copy = getRegistrySectionCopyForCategory("Housewarming");

  assert.equal(copy.allowsLinks, true);
  assert.equal(copy.sectionLabel, "Gift List");
  assert.equal(copy.linksLabel, "Gift list links");
});

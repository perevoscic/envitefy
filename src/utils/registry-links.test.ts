import assert from "node:assert/strict";
import test from "node:test";
import {
  AMAZON_REGISTRY_SEARCH_URL,
  getRegistryAction,
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

test("normalizeRegistryLinks preserves concrete Amazon registry deep links", () => {
  const url = "https://www.amazon.com/wedding/registry/example-couple";

  assert.deepEqual(normalizeRegistryLinks([{ label: "", url }], { category: "Weddings" }), [
    { label: "Amazon", url },
  ]);
});

test("normalizeRegistryLinks drops Amazon homepage placeholders", () => {
  assert.deepEqual(
    normalizeRegistryLinks([{ label: "Amazon", url: "https://www.amazon.com/" }], {
      category: "Baby Shower",
    }),
    [],
  );
  assert.deepEqual(
    normalizeRegistryLinks([{ label: "Amazon", url: "amazon.com" }], {
      category: "Wedding",
    }),
    [],
  );
});

test("housewarming events allow gift list links", () => {
  const copy = getRegistrySectionCopyForCategory("Housewarming");

  assert.equal(copy.allowsLinks, true);
  assert.equal(copy.sectionLabel, "Gift List");
  assert.equal(copy.linksLabel, "Gift list links");
});

test("getRegistryAction opens direct Amazon baby registry urls exactly", () => {
  const url = "https://www.amazon.com/baby-reg/I1QM8SK28TKM";

  assert.deepEqual(getRegistryAction({ registryProvider: "Amazon", registryUrl: url }), {
    url,
    label: "Open Registry",
    helperText: null,
  });
});

test("getRegistryAction opens direct Target registry urls exactly", () => {
  const url = "https://www.target.com/gift-registry/gift/example";

  assert.deepEqual(getRegistryAction({ registryProvider: "Target", registryUrl: url }), {
    url,
    label: "Open Registry",
    helperText: null,
  });
});

test("getRegistryAction falls back to Amazon search for baby shower missing direct link", () => {
  assert.deepEqual(
    getRegistryAction({
      registryProvider: "Amazon",
      registryUrl: null,
      registryName: "Judith & David",
      eventType: "Baby Shower",
      city: "League City",
      state: "TX",
    }),
    {
      url: AMAZON_REGISTRY_SEARCH_URL,
      label: "Find Registry on Amazon",
      helperText:
        "This invite mentions an Amazon registry, but the direct registry link was not included.\nSearch using:\nJudith & David\nBaby Shower\nLeague City, TX",
    },
  );
});

test("getRegistryAction falls back to Amazon search for wedding missing direct link", () => {
  assert.deepEqual(
    getRegistryAction({
      registryProvider: "amazon",
      registryUrl: "",
      registryName: "Judith & David",
      eventType: "Wedding",
      city: "League City",
      state: "TX",
    }),
    {
      url: AMAZON_REGISTRY_SEARCH_URL,
      label: "Find Registry on Amazon",
      helperText:
        "This invite mentions an Amazon registry, but the direct registry link was not included.\nSearch using:\nJudith & David\nWedding\nLeague City, TX",
    },
  );
});

test("getRegistryAction falls back to Amazon search with minimal helper when details are missing", () => {
  assert.deepEqual(
    getRegistryAction({
      registryProvider: "Amazon",
      registryUrl: null,
      registryName: null,
      eventType: null,
      city: null,
      state: null,
    }),
    {
      url: AMAZON_REGISTRY_SEARCH_URL,
      label: "Find Registry on Amazon",
      helperText:
        "This invite mentions an Amazon registry, but the direct registry link was not included.",
    },
  );
});

test("getRegistryAction treats Amazon homepage URLs as missing direct links", () => {
  assert.deepEqual(
    getRegistryAction({
      registryProvider: null,
      registryUrl: "https://www.amazon.com/",
      registryName: null,
      eventType: null,
      city: null,
      state: null,
    }),
    {
      url: AMAZON_REGISTRY_SEARCH_URL,
      label: "Find Registry on Amazon",
      helperText:
        "This invite mentions an Amazon registry, but the direct registry link was not included.",
    },
  );
});

test("getRegistryAction returns no button for non-Amazon missing direct link", () => {
  assert.deepEqual(getRegistryAction({ registryProvider: "Target", registryUrl: null }), {
    url: null,
    label: null,
    helperText: null,
  });
});

test("getRegistryAction returns no button without provider or direct link", () => {
  assert.deepEqual(getRegistryAction({ registryProvider: null, registryUrl: null }), {
    url: null,
    label: null,
    helperText: null,
  });
});

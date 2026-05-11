import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG = "envitefy-20";

const { decorateAmazonUrl, getAffiliateLinks, getAmazonTagFromConfig } = await import(
  "./affiliates.ts"
);

test("getAmazonTagFromConfig uses the tag-only Amazon associate env", () => {
  assert.equal(getAmazonTagFromConfig(), "envitefy-20");
});

test("getAffiliateLinks generates Amazon searches instead of reading full Amazon URL envs", () => {
  const links = getAffiliateLinks("amazon_confirm", {
    category: "Birthdays",
    viewer: "guest",
    title: "Emma's princess party",
  });

  assert.equal(links.amazon, "https://www.amazon.com/s?k=birthday+gifts+for+girls&tag=envitefy-20");
});

test("decorateAmazonUrl replaces any existing Amazon tag", () => {
  assert.equal(
    decorateAmazonUrl("https://www.amazon.com/dp/B000000?tag=old-20", {
      placement: "registry",
    }),
    "https://www.amazon.com/dp/B000000?tag=envitefy-20&ascsubtag=registry",
  );
});

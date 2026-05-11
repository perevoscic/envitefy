import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG = "envitefy-20";

const { attachAmazonAffiliateTag, buildAmazonSearchUrl, getAmazonAssociateTag, isAmazonUrl } =
  await import("./amazon.ts");

test("getAmazonAssociateTag reads the single public associate tag", () => {
  assert.equal(getAmazonAssociateTag(), "envitefy-20");
});

test("isAmazonUrl recognizes amazon.com subdomains only", () => {
  assert.equal(isAmazonUrl("https://www.amazon.com/baby-reg/example"), true);
  assert.equal(isAmazonUrl("https://smile.amazon.com/dp/example"), true);
  assert.equal(isAmazonUrl("https://target.com/gift-registry/example"), false);
});

test("attachAmazonAffiliateTag adds and replaces Amazon tags", () => {
  assert.equal(
    attachAmazonAffiliateTag("https://www.amazon.com/dp/B000000?tag=old-20&ref=something"),
    "https://www.amazon.com/dp/B000000?tag=envitefy-20&ref=something",
  );
  assert.equal(
    attachAmazonAffiliateTag("https://www.amazon.com/wedding/registry/example"),
    "https://www.amazon.com/wedding/registry/example?tag=envitefy-20",
  );
  assert.equal(
    attachAmazonAffiliateTag("https://www.target.com/gift-registry/example"),
    "https://www.target.com/gift-registry/example",
  );
});

test("buildAmazonSearchUrl creates associate-tagged search URLs", () => {
  assert.equal(
    buildAmazonSearchUrl("birthday party supplies"),
    "https://www.amazon.com/s?k=birthday+party+supplies&tag=envitefy-20",
  );
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("open house skin renders full flyer hero, specs, and realtor details", () => {
  const source = readSource("src/components/OpenHouseSkin.tsx");

  assert.match(source, /data-skin-id="open-house-skin"/);
  assert.match(source, /category="open-house"/);
  assert.match(source, /realtorImageUrl/);
  assert.match(source, /const heroImage = imageUrl \|\| "";/);
  assert.doesNotMatch(source, /galleryImages/);
  assert.doesNotMatch(source, /Property Photos/);
  assert.match(source, /const pageText = ensureReadableTextColor\(colors\.background, colors\.text/);
  assert.match(source, /color: pageText/);
  assert.match(source, /const priceText = ensureReadableTextColor\(colors\.background, colors\.primary/);
  assert.match(source, /const footerText = pageIsDark/);
  assert.match(source, /CarFront/);
  assert.match(source, /label: "Parking"/);
  assert.match(source, /mlsNumber/);
  assert.match(source, /extractedFields/);
  assert.match(source, /isTopSpecDetailLabel/);
  assert.match(source, /isRealtorDetailLabel/);
  assert.match(source, /realtorTitle/);
  assert.match(source, /\.filter\(\(fact\) => !isRealtorDetailLabel\(fact\.label\)\)/);
  assert.match(source, /bg-white object-contain/);
  assert.match(source, /h-32 w-32/);
  assert.match(source, /object-contain object-center/);
  assert.match(source, /\$\{bedrooms\} Beds/);
  assert.match(source, /\$\{bathrooms\} Baths/);
  assert.match(source, /\$\{squareFootage\} Sq Ft/);
  assert.match(source, /Property Details/);
  assert.match(source, /Contact Realtor/);
  assert.match(source, /View Listing/);
  assert.match(source, /View flyer/);
  assert.match(source, /Snapped by/);
});

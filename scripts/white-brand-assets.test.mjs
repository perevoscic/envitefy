import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";
import { WHITE_BRAND_ASSET_SOURCES } from "./generate-white-brand-assets.mjs";

const root = new URL("../", import.meta.url);
const originals = {
  "public/brand/e-only.png": "fc8aea08ddf3df924ca0726bb82cd5e16875b44d011ecdf30e06c2474de82154",
  "public/brand/envitefy-wordmark.png": "21de34c70f9c755ea1a3cf01e0fd476f45794920c860f36676a044ab700b2f64",
  "public/email/envitefy-wordmark-email.png": "21de34c70f9c755ea1a3cf01e0fd476f45794920c860f36676a044ab700b2f64",
  "public/email/social-instagram.png": "5fcda12d746b6d5e241a0abbae5baf224d651e9924774210d89654081d9cbfa6",
  "public/email/social-facebook.png": "98d782f0131857725e881f453bbe02761eb9ed12cfcd59f232bac57067a8facc",
  "public/email/social-youtube.png": "9c729bc9875730a9afe428095abf28813ea88421a67da9b4e7c898c25fb31b5c",
  "public/email/social-tiktok.png": "60d10f4cc70ca8b1921d196acd206e6f9c64180cb03548567e0827d3bc19ba15",
  "public/email/social-reddit.png": "1dbcbdca70d579d8a5235e6251560db7fec2952c7a32305d83616e7b623cb981",
};

async function raw(relative) {
  return sharp(await readFile(new URL(relative, root))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

for (const [source, destination] of WHITE_BRAND_ASSET_SOURCES) {
  test(`${destination} is pure white and preserves every source alpha pixel`, async () => {
    const [originalBytes, original, white] = await Promise.all([
      readFile(new URL(source, root)), raw(source), raw(destination),
    ]);
    assert.equal(createHash("sha256").update(originalBytes).digest("hex"), originals[source], "legacy asset changed");
    assert.equal(white.info.width, original.info.width);
    assert.equal(white.info.height, original.info.height);
    assert.equal(white.info.channels, 4);
    let visiblePixels = 0;
    for (let offset = 0; offset < white.data.length; offset += 4) {
      assert.equal(white.data[offset + 3], original.data[offset + 3], `alpha changed at pixel ${offset / 4}`);
      if (white.data[offset + 3] === 0) continue;
      visiblePixels += 1;
      assert.deepEqual([...white.data.subarray(offset, offset + 3)], [255, 255, 255]);
    }
    assert.ok(visiblePixels > 0, "asset must contain a visible mark");
  });
}

for (const network of ["instagram", "facebook", "youtube", "tiktok", "reddit"]) {
  test(`${network} white SVG preserves the approved source geometry`, async () => {
    const original = await readFile(new URL(`public/email/social-${network}.svg`, root), "utf8");
    const white = await readFile(new URL(`public/email/white-v1/social-${network}.svg`, root), "utf8");
    assert.equal(white.replaceAll("#FFFFFF", "#4E4E50"), original);
    const decoded = await sharp(Buffer.from(white)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let offset = 0; offset < decoded.data.length; offset += 4) {
      if (!decoded.data[offset + 3]) continue;
      assert.deepEqual([...decoded.data.subarray(offset, offset + 3)], [255, 255, 255]);
    }
  });
}

test("all five official social destinations expose separate white email and web variants", async () => {
  const { ENVITEFY_SOCIAL_LINKS } = await import(new URL("src/lib/envitefy-social-links.ts", root));
  assert.equal(ENVITEFY_SOCIAL_LINKS.length, 5);
  for (const { name, href, iconSrc, whiteIconSrc, whiteIconSvgSrc, emailWhiteIconSrc } of ENVITEFY_SOCIAL_LINKS) {
    assert.equal(new URL(href).protocol, "https:", name);
    assert.ok(!iconSrc.includes("white-v1"), "legacy URL remains stable");
    for (const relative of [whiteIconSrc, whiteIconSvgSrc, emailWhiteIconSrc]) {
      assert.ok(relative.startsWith("/email/white-v1/"));
      await readFile(fileURLToPath(new URL(`public${relative}`, root)));
    }
  }
});

for (const [, transparent] of WHITE_BRAND_ASSET_SOURCES.filter(([, path]) => path.startsWith("public/email/"))) {
  test(`${transparent} email matte keeps its white geometry on the exact dark panel color`, async () => {
    const matte = transparent.replace("/white-v1/", "/white-v1/matte/");
    const [source, flattened] = await Promise.all([raw(transparent), raw(matte)]);
    assert.equal(flattened.info.width, source.info.width);
    assert.equal(flattened.info.height, source.info.height);
    const background = [37, 31, 45];
    for (let offset = 0; offset < source.data.length; offset += 4) {
      const alpha = source.data[offset + 3] / 255;
      assert.equal(flattened.data[offset + 3], 255, "matte must be opaque");
      for (let channel = 0; channel < 3; channel += 1) {
        const expected = 255 * alpha + background[channel] * (1 - alpha);
        assert.ok(Math.abs(flattened.data[offset + channel] - expected) <= 1, "matte must preserve the source alpha silhouette");
      }
    }
  });
}

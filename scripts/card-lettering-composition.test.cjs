const assert = require("node:assert/strict");
const { test } = require("node:test");
const sharp = require("sharp");
const { composeCardLettering } = require("./lib/event-messages-test-loader.cjs")("src/lib/card-lettering-composition.ts");

test("isolated lettering composition preserves every background pixel outside layout", async () => {
  const background = await sharp({ create: { width: 100, height: 150, channels: 3, background: "#ab247c" } }).png().toBuffer();
  const layer = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150"><path d="M20 30h10v15h40V30h10v40H70V55H30v15H20Z" fill="gold"/></svg>')).png().toBuffer();
  const result = await composeCardLettering(background, layer);
  const original = await sharp(background).ensureAlpha().raw().toBuffer();
  const composed = await sharp(result.composite).ensureAlpha().raw().toBuffer();
  const { left, top, width, height } = result.layout;
  assert.ok(left >= 12 && left + width <= 88 && top >= 27 && top + height <= 72);
  let changed = 0;
  for (let y = 0; y < 150; y++) for (let x = 0; x < 100; x++) {
    const i = (y * 100 + x) * 4;
    if (x < left || x >= left + width || y < top || y >= top + height) assert.deepEqual(composed.subarray(i, i + 4), original.subarray(i, i + 4));
    else if (!composed.subarray(i, i + 4).equals(original.subarray(i, i + 4))) changed++;
  }
  assert.ok(changed > 0);
});

test("opaque white rectangles and empty assets are rejected as unusable layers", async () => {
  const background = await sharp({ create: { width: 100, height: 150, channels: 3, background: "#abcabc" } }).png().toBuffer();
  for (const color of ["white", { r: 0, g: 0, b: 0, alpha: 0 }]) {
    const layer = await sharp({ create: { width: 100, height: 150, channels: 4, background: color } }).png().toBuffer();
    await assert.rejects(composeCardLettering(background, layer), /usable isolated transparent/);
  }
});

test("saved lettering can be moved and resized locally with bounded placement", async () => {
  const background = await sharp({ create: { width: 100, height: 150, channels: 3, background: "#abcabc" } }).png().toBuffer();
  const layer = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150"><path d="M20 30h10v15h20V30h10v40H50V55H30v15H20Z" fill="gold"/></svg>')).png().toBuffer();
  const result = await composeCardLettering(background, layer, { left: 20, top: 80, width: 30, height: 30 });
  assert.deepEqual(result.layout, { left: 20, top: 80, width: 30, height: 30, canvasWidth: 100, canvasHeight: 150 });
  await assert.rejects(composeCardLettering(background, layer, { left: 90, top: 80, width: 30, height: 30 }), /fit inside/);
  const insetPanel = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150"><rect x="20" y="30" width="40" height="40" fill="white"/></svg>')).png().toBuffer();
  await assert.rejects(composeCardLettering(background, insetPanel), /opaque panel/);
});

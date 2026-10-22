import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright";
import sharp from "sharp";
import { wordmarkDocument, wordmarkMarkup } from "./generate-wordmark-assets.mjs";
import { ENVITEFY_BRAND_ASSETS } from "../src/lib/brand-assets.ts";

function closestInkGap(left, right) {
  const { width, height } = left.info;
  let gap = Infinity;
  for (let y = 0; y < height; y += 1) {
    let edge = -1;
    let start = width;
    for (let x = 0; x < width; x += 1) {
      const alpha = (y * width + x) * 4 + 3;
      if (left.data[alpha] >= 128) edge = x;
      if (right.data[alpha] >= 128 && start === width) start = x;
    }
    if (edge >= 0 && start < width) gap = Math.min(gap, start - edge - 1);
  }
  return gap;
}

test("canonical vi and fy strokes touch without overlapping", { timeout: 60000 }, async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ viewport: { width: 1800, height: 700 } });
    // Highlight individual characters without adding spans or changing shaping.
    const markup = (await wordmarkMarkup("light"))
      .replace(/-webkit-text-fill-color:#ffffff;?/g, "")
      .replace("color:#ffffff", "color:transparent");
    await page.setContent(await wordmarkDocument(`<style>::highlight(glyph){color:white}</style><div id="wordmark">${markup}</div>`));
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => [...document.fonts].some(font => font.family === "Josefin Slab" && font.status === "loaded")), true);
    assert.equal(await page.locator("#wordmark").textContent(), "envitefy");
    const masks = [];
    for (const index of [2, 3, 6, 7]) {
      await page.locator("#wordmark").evaluate((element, offset) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
          if (offset < node.length) {
            const range = new Range();
            range.setStart(node, offset);
            range.setEnd(node, offset + 1);
            CSS.highlights.set("glyph", new Highlight(range));
            return;
          }
          offset -= node.length;
          node = walker.nextNode();
        }
        throw new Error("Missing wordmark character");
      }, index);
      masks.push(await sharp(await page.locator("#wordmark").screenshot({ omitBackground: true })).ensureAlpha().raw().toBuffer({ resolveWithObject: true }));
    }
    for (const [name, left, right] of [["vi", masks[0], masks[1]], ["fy", masks[2], masks[3]]]) {
      const gap = closestInkGap(left, right);
      assert.ok(Math.abs(gap) <= 1, `${name} must touch within one antialiasing pixel at 400px; measured gap ${gap}`);
    }
  } finally {
    await browser.close();
  }
});

test("current app and inbox wordmarks have matching geometry and supported formats", async () => {
  const { wordmark } = ENVITEFY_BRAND_ASSETS;
  const load = async path => sharp(await readFile(new URL(`../public${path}`, import.meta.url)));
  const color = await load(wordmark.color);
  const white = await load(wordmark.white);
  const [colorPixels, whitePixels] = await Promise.all([color.ensureAlpha().raw().toBuffer({ resolveWithObject: true }), white.ensureAlpha().raw().toBuffer({ resolveWithObject: true })]);
  assert.equal(colorPixels.info.width, whitePixels.info.width);
  assert.equal(colorPixels.info.height, whitePixels.info.height);
  for (let offset = 3; offset < colorPixels.data.length; offset += 4) {
    assert.ok(Math.abs(colorPixels.data[offset] - whitePixels.data[offset]) <= 1, "gradient and white silhouettes must agree");
  }
  for (const [path, format] of [[wordmark.color, "webp"], [wordmark.white, "webp"], [wordmark.emailColor, "gif"], [wordmark.emailWhite, "gif"], [wordmark.emailWhiteMatte, "gif"]]) {
    const metadata = await (await load(path)).metadata();
    assert.equal(metadata.format, format);
    assert.equal(metadata.width, colorPixels.info.width);
    assert.equal(metadata.height, colorPixels.info.height);
  }
});

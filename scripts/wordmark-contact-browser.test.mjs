import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright";
import sharp from "sharp";
import { wordmarkDocument, wordmarkMarkup } from "./generate-wordmark-assets.mjs";
import { ENVITEFY_BRAND_ASSETS } from "../src/lib/brand-assets.ts";

function serifContact(left, right, rendered) {
  const { width, height } = left.info;
  let gap = Infinity;
  let rows = [];
  for (let y = 0; y < height; y += 1) {
    let edge = -1;
    let start = width;
    for (let x = 0; x < width; x += 1) {
      const alpha = (y * width + x) * 4 + 3;
      if (left.data[alpha] >= 128) edge = x;
      if (right.data[alpha] >= 128 && start === width) start = x;
    }
    if (edge < 0 || start === width) continue;
    const rowGap = start - edge - 1;
    if (rowGap < gap) {
      gap = rowGap;
      rows = [];
    }
    if (rowGap === gap) rows.push({ y, edge, start });
  }
  assert.ok(rows.length, "both glyphs must contain visible strokes");
  // Omit the serif's antialiased top/bottom; its middle must be solid ink.
  const middle = rows.slice(Math.floor(rows.length / 4), Math.ceil(rows.length * 3 / 4));
  let alpha = 255;
  let relativeAlpha = 1;
  for (const { y, edge, start } of middle) {
    let rowAlpha = 255;
    for (let x = Math.min(edge, start); x <= Math.max(edge, start); x += 1) {
      rowAlpha = Math.min(rowAlpha, rendered.data[(y * width + x) * 4 + 3]);
    }
    const nearby = (x, direction) => Math.max(...[1, 2, 3].map(distance =>
      rendered.data[(y * width + x + distance * direction) * 4 + 3]));
    const surroundingAlpha = Math.min(nearby(edge, -1), nearby(start, 1));
    alpha = Math.min(alpha, rowAlpha);
    relativeAlpha = Math.min(relativeAlpha, rowAlpha / Math.max(1, surroundingAlpha));
  }
  return { gap, alpha, relativeAlpha };
}

async function showWordmark(page, markup, size, highlight = false) {
  await page.setContent(await wordmarkDocument(`<style>#wordmark{font-size:${size}px}${highlight ? "::highlight(glyph){color:white}" : ""}</style><div id="wordmark">${markup}</div>`));
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => [...document.fonts].some(font => font.family === "Josefin Slab" && font.status === "loaded")), true);
  assert.equal(await page.locator("#wordmark").textContent(), "envitefy");
}

function pixels(page) {
  return page.locator("#wordmark").screenshot({ omitBackground: true })
    .then(buffer => sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true }));
}

async function glyphMasks(page, markup, size) {
  // Highlight individual characters without adding spans or changing shaping.
  await showWordmark(page, markup
    .replace(/-webkit-text-fill-color:#ffffff;?/g, "")
    .replace("color:#ffffff", "color:transparent"), size, true);
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
    masks.push(await pixels(page));
  }
  return masks;
}

test("canonical vi and fy serifs join without visible seams or excessive overlap", { timeout: 60000 }, async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const white = await wordmarkMarkup("light");
    const gradient = await wordmarkMarkup("gradient");
    for (const dpr of [1, 2]) {
      const page = await browser.newPage({ viewport: { width: 1800, height: 700 }, deviceScaleFactor: dpr });
      for (const size of [24, 48, 100, 400]) {
        const masks = await glyphMasks(page, white, size);
        for (const [tone, markup] of [["white", white], ["gradient", gradient]]) {
          await showWordmark(page, markup, size);
          const rendered = await pixels(page);
          for (const [name, left, right] of [["vi", masks[0], masks[1]], ["fy", masks[2], masks[3]]]) {
            const { gap, alpha, relativeAlpha } = serifContact(left, right, rendered);
            const context = `${name}, ${tone}, ${size}px, DPR ${dpr}`;
            assert.ok(gap <= 1 && gap >= -Math.ceil(size * dpr * 0.005) - 1, `${context}: serif contact must stay within 0.005em plus one raster pixel; gap ${gap}`);
            if (size === 400 || tone === "white") {
              assert.ok(alpha >= (size === 400 ? 250 : 235), `${context}: joined serif must stay opaque; minimum alpha ${alpha}`);
            } else {
              // Small gradient text masks can leave one partially covered raster
              // pixel at a fractional run boundary; compare it with nearby ink.
              assert.ok(alpha > 0 && relativeAlpha >= 0.7, `${context}: no transparent or deep gradient seam; relative opacity ${relativeAlpha}`);
            }
          }
        }
      }
      if (dpr === 1) {
        // The former spacing passed the distance check while leaving a gray seam.
        const former = white.replace(/env<span(?: style="[^"]*")?>itef<\/span><span(?: style="[^"]*")?>y<\/span>/,
          'env<span style="margin-left:0.005em">itef</span><span>y</span>');
        assert.notEqual(former, white, "the negative control must restore the former pair spacing");
        const masks = await glyphMasks(page, former, 400);
        await showWordmark(page, former, 400);
        const rendered = await pixels(page);
        for (const [left, right] of [[masks[0], masks[1]], [masks[2], masks[3]]]) {
          assert.ok(serifContact(left, right, rendered).alpha < 250, "the seam-opacity guard must reject the former spacing");
        }
      }
      await page.close();
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
    assert.ok(Math.abs(colorPixels.data[offset] - whitePixels.data[offset]) <= 2, "gradient and white silhouettes must agree within two alpha rounding levels");
  }
  for (const [path, format] of [[wordmark.color, "webp"], [wordmark.white, "webp"], [wordmark.emailColor, "gif"], [wordmark.emailWhite, "gif"], [wordmark.emailWhiteMatte, "gif"]]) {
    const metadata = await (await load(path)).metadata();
    assert.equal(metadata.format, format);
    assert.equal(metadata.width, colorPixels.info.width);
    assert.equal(metadata.height, colorPixels.info.height);
  }
});

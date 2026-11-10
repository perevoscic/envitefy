import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { wordmarkMarkup, wordmarkDocument } from '../generate-wordmark-assets.mjs';
import { traceMask } from './merch-contours.mjs';

const platforms = ['instagram', 'facebook', 'youtube', 'tiktok', 'reddit'];
const wordmarkCache = new Map();
const uri = (mime, buffer) => `data:${mime};base64,${buffer.toString('base64')}`;
const image = (buffer, x, y, width, height, mime = 'image/svg+xml') =>
  `<image x="${x}" y="${y}" width="${width}" height="${height}" href="${uri(mime, buffer)}"/>`;
const assert = (value, message) => { if (!value) throw new Error(message); };

async function canonicalWordmark(root) {
  if (wordmarkCache.has(root)) return wordmarkCache.get(root);
  const pending = (async () => {
    const options = { headless: true };
    if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) options.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
    let browser;
    try { browser = await chromium.launch(options); }
    catch (error) {
      if (options.executablePath) throw error;
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    }
    try {
      const page = await browser.newPage({ viewport: { width: 1800, height: 700 }, deviceScaleFactor: 4 });
      await page.setContent(await wordmarkDocument(`<div id="wordmark">${await wordmarkMarkup('gradient')}</div>`));
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => [...document.fonts].some(font => font.family === 'Josefin Slab' && font.status === 'loaded')),
        'Bundled canonical wordmark font did not load');
      const capture = await page.locator('#wordmark').screenshot({ omitBackground: true });
      const png = await sharp(capture).trim().png().toBuffer();
      const metadata = await sharp(png).metadata();
      assert(metadata.hasAlpha && metadata.width >= 4000, 'Canonical wordmark source is not high resolution');
      return { png, width: metadata.width, height: metadata.height };
    } finally { await browser.close(); }
  })();
  wordmarkCache.set(root, pending);
  try { return await pending; }
  catch (error) { wordmarkCache.delete(root); throw error; }
}

async function socialIcon(root, name, color) {
  let source = await readFile(join(root, `public/email/social-${name}.svg`), 'utf8');
  source = source.replace(/#4e4e50/gi, color);
  if (name === 'reddit') {
    const match = source.match(/<image\b[^>]*href="data:image\/png;base64,([^"]+)"[^>]*\/>/);
    assert(match, 'Canonical Reddit raster insert was not found');
    const { data, info } = await sharp(Buffer.from(match[1], 'base64')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const mask = new Uint8Array(info.width * info.height);
    for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] >= 128 ? 1 : 0;
    const traced = traceMask(mask, info.width, info.height, { minArea: 2, fitError: 0.3 });
    source = source.replace(match[0], `<g transform="translate(10 10) scale(${28 / info.width} ${28 / info.height})"><path fill="${color}" fill-rule="evenodd" d="${traced.path}"/></g>`);
  }
  return Buffer.from(source);
}

async function invitationText(color) {
  const fontfile = join(process.env.WINDIR || 'C:/Windows', 'Fonts/arialbd.ttf');
  await access(fontfile);
  const png = await sharp({ text: {
    text: `<span foreground="${color}">YOU ARE INVITED</span>`,
    font: 'Arial Bold 250', fontfile, dpi: 144, rgba: true,
  } }).trim().png().toBuffer();
  const metadata = await sharp(png).metadata();
  return { png, width: metadata.width, height: metadata.height };
}

/** Return transparent native branding/social footer SVG; never rewrites source assets. */
export async function buildBackFooter({ root = resolve(import.meta.dirname, '../..'), color, width }) {
  assert(typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color), 'Footer color must be a six-digit hex color');
  assert(Number.isFinite(width) && width > 0, 'Footer width must be positive');
  root = resolve(root);
  const [wordmark, socials, caption] = await Promise.all([
    canonicalWordmark(root),
    Promise.all(platforms.map(name => socialIcon(root, name, color))),
    invitationText(color),
  ]);
  const wordmarkWidth = width * 0.70;
  const wordmarkHeight = wordmarkWidth * wordmark.height / wordmark.width;
  const iconSize = width * 0.10;
  const rowWidth = width * 0.78;
  const iconGap = (rowWidth - iconSize * platforms.length) / (platforms.length - 1);
  const iconY = wordmarkHeight + width * 0.018;
  const captionWidth = width * 0.68;
  const captionHeight = captionWidth * caption.height / caption.width;
  const captionY = iconY + iconSize + width * 0.022;
  const height = Math.ceil(captionY + captionHeight);
  const body = image(wordmark.png, (width - wordmarkWidth) / 2, 0, wordmarkWidth, wordmarkHeight, 'image/png')
    + socials.map((buffer, index) => image(buffer, (width - rowWidth) / 2 + index * (iconSize + iconGap), iconY, iconSize, iconSize)).join('')
    + image(caption.png, (width - captionWidth) / 2, captionY, captionWidth, captionHeight, 'image/png');
  const buffer = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`);
  return { buffer, width, height, wordmarkWidth, wordmarkHeight };
}

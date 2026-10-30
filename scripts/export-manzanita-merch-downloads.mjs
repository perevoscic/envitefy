import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import jsQR from 'jsqr';

const root = process.cwd();
const source = path.join(root, 'output/merch/gymnastics-colorways-2026-10-30/manzanita-back.svg');
const out = path.join(path.dirname(source), 'manzanita-downloads');
const transparent = path.join(out, 'envitefy-manzanita-back-9x12.2in-300dpi-transparent.png');
const matte = path.join(out, 'envitefy-manzanita-back-9x12.2in-300dpi-garment-preview.png');
const preview = path.join(out, 'envitefy-manzanita-back-garment-preview.webp');
const hash = value => createHash('sha256').update(value).digest('hex');
const assert = (value, message) => { if (!value) throw new Error(message); };
const input = await fs.readFile(source);
const inputHash = hash(input);
await fs.mkdir(out, { recursive: true });
for (const target of [transparent, matte, preview]) {
  try { await fs.access(target); throw new Error(`Output already exists: ${target}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}

const raster = await sharp(input).resize(2700, 3660).ensureAlpha().png().toBuffer();
await sharp(raster).withMetadata({ density: 300 }).png({ compressionLevel: 9 }).toFile(transparent);
await sharp(raster).flatten({ background: '#893b51' }).withMetadata({ density: 300 }).png({ compressionLevel: 9 }).toFile(matte);

function pHYs(png) {
  let at = 8;
  while (at + 12 <= png.length) {
    const length = png.readUInt32BE(at);
    if (png.toString('ascii', at + 4, at + 8) === 'pHYs') {
      return { x: png.readUInt32BE(at + 8), y: png.readUInt32BE(at + 12), unit: png[at + 16] };
    }
    at += length + 12;
  }
  return null;
}

const exports = [];
for (const file of [transparent, matte]) {
  const bytes = await fs.readFile(file);
  const meta = await sharp(bytes).metadata();
  const physical = pHYs(bytes);
  assert(meta.format === 'png' && meta.width === 2700 && meta.height === 3660 && meta.density === 300, 'PNG dimensions or density mismatch');
  assert(physical?.x === 11811 && physical?.y === 11811 && physical?.unit === 1, 'PNG pHYs must specify 300 DPI');
  exports.push({ file, width: meta.width, height: meta.height, dpi: meta.density, channels: meta.channels, hasAlpha: meta.hasAlpha, pHYs: physical, sha256: hash(bytes), bytes: bytes.length });
}
assert(exports[0].hasAlpha && exports[0].channels === 4, 'Primary print PNG must preserve RGBA');
assert(!exports[1].hasAlpha && exports[1].channels === 3, 'Garment preview must be RGB');
const alpha = await sharp(transparent).extractChannel('alpha').raw().toBuffer();
const transparentPixels = alpha.reduce((count, value) => count + (value === 0), 0);
assert(transparentPixels > 2700 * 3660 * .3, 'Primary PNG has unexpectedly little transparency');
for (const i of [0, 2699, 2700 * 3659, 2700 * 3660 - 1]) assert(alpha[i] === 0, 'Primary print corner is not transparent');

const qrRaster = await sharp(matte).resize(900, 1220).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const decoded = jsQR(new Uint8ClampedArray(qrRaster.data), qrRaster.info.width, qrRaster.info.height, { inversionAttempts: 'dontInvert' });
const expectedQr = 'https://envitefy.com/gymnastics#preview';
assert(decoded?.data === expectedQr, 'Matte preview QR did not decode in standard mode');

execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', matte, '-c:v', 'libwebp', '-quality', '85', '-compression_level', '6', preview], { stdio: 'pipe' });
const webp = await sharp(preview).metadata();
assert(webp.format === 'webp' && webp.width === 2700 && webp.height === 3660, 'WebP preview dimensions mismatch');
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', preview, '-f', 'null', '-'], { stdio: 'pipe' });
assert(hash(await fs.readFile(source)) === inputHash, 'Source artwork changed');
const report = {
  source,
  sourceSha256: inputHash,
  sourceUnchanged: true,
  dimensions: { widthIn: 9, heightIn: 12.2, widthPx: 2700, heightPx: 3660, dpi: 300 },
  garmentColor: '#893b51',
  primaryPrintTransparency: { transparentPixels, totalPixels: 2700 * 3660, fraction: transparentPixels / (2700 * 3660), fourCornersTransparent: true },
  qr: { placeholder: true, decodedDestination: decoded.data, inversionAttempts: 'dontInvert', sampleDimensionsPx: { width: 900, height: 1220 }, actualMeetLinkPending: true },
  exports,
  inlinePreview: preview,
  pngRetention: 'User requested PNG downloads; print and garment preview PNGs are intentionally retained.',
};
await fs.writeFile(path.join(out, 'export-verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

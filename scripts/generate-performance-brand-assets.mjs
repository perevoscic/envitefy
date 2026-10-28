import { mkdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import ffmpeg from "ffmpeg-static";

const root = fileURLToPath(new URL("../", import.meta.url));
const destination = path.join(root, "public/brand/responsive-v1");
export const wordmarkWidths = [150, 300, 450, 600, 900];

// Derive from the approved raster artwork; never redraw or retrack the logo.
export async function generatePerformanceBrandAssets() {
  await mkdir(destination, { recursive: true });
  const sources = [
    ["wordmark", "public/brand/wordmark-v2/envitefy-wordmark.webp", wordmarkWidths.map((width) => ({ width }))],
    ["wordmark-white", "public/brand/wordmark-v2/envitefy-wordmark-white.webp", wordmarkWidths.map((width) => ({ width }))],
    ["concierge", "public/brand/concierge-chat.webp", [{ height: 168 }]],
    ["concierge-gold", "public/brand/concierge-chat.webp", [{ height: 168 }]],
  ];
  for (const [name, relative, sizes] of sources) {
    const original = await readFile(path.join(root, relative));
    for (const size of sizes) {
      // Keep the intermediate in memory; no new PNG/JPEG originals are left behind.
      let resized = await sharp(original).resize({ ...size, withoutEnlargement: true }).png().toBuffer();
      if (name.startsWith("concierge")) {
        // CSS masks use alpha only. Removing unused RGB detail makes the mask
        // compact without changing a single resized alpha value.
        const { data, info } = await sharp(resized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        for (let offset = 0; offset < data.length; offset += 4) {
          data[offset] = name === "concierge-gold" ? 249 : 255;
          data[offset + 1] = name === "concierge-gold" ? 223 : 255;
          data[offset + 2] = name === "concierge-gold" ? 148 : 255;
        }
        resized = await sharp(data, { raw: info }).png().toBuffer();
      }
      const expected = await sharp(resized).metadata();
      const filename = `${name}-${size.width ?? size.height}.webp`;
      const output = path.join(destination, filename);
      const result = spawnSync(process.env.FFMPEG_PATH || ffmpeg, [
        "-hide_banner", "-loglevel", "error", "-y", "-i", "pipe:0",
        "-c:v", "libwebp", ...(name.startsWith("concierge") || name === "wordmark-white" ? ["-lossless", "1"] : []),
        "-q:v", "85", "-compression_level", "6", output,
      ], { input: resized });
      if (result.status !== 0) throw new Error(result.error?.message || result.stderr.toString());
      const actual = await sharp(output).metadata();
      if (actual.format !== "webp" || !actual.hasAlpha || actual.width !== expected.width || actual.height !== expected.height) {
        throw new Error(`Invalid brand derivative: ${filename}`);
      }
      console.log(`${filename}: ${actual.width} x ${actual.height}, ${(await stat(output)).size} bytes`);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await generatePerformanceBrandAssets();
}

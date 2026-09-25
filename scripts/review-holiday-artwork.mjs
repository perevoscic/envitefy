import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Inspection sheets only. Final artwork always remains the verified, uncropped WebP.
const plan = JSON.parse(await fs.readFile("docs/holiday-template-artwork.json", "utf8"));
const out = path.resolve("output/seasonal-templates/review");
await fs.mkdir(out, { recursive: true });
const requested = new Set(process.argv.slice(2));
for (const collection of [...new Set(plan.assets.map((asset) => asset.collection))]) {
  if (requested.size && !requested.has(collection)) continue;
  const assets = plan.assets.filter((asset) => asset.collection === collection && asset.status === "generated");
  if (!assets.length) continue;
  const tiles = [];
  for (const [index, asset] of assets.entries()) {
    const left = index % 5 * 320, top = Math.floor(index / 5) * 240;
    tiles.push({ input: await sharp(asset.output).resize(320, 213).toBuffer(), left, top });
    const label = `${index + 1}. ${asset.name}`.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
    tiles.push({ input: Buffer.from(`<svg width="320" height="27"><rect width="320" height="27" fill="white"/><text x="8" y="19" font-family="Arial" font-size="13" fill="#222">${label}</text></svg>`), left, top: top + 213 });
  }
  await sharp({ create: { width: 1600, height: 480, channels: 3, background: "white" } })
    .composite(tiles).webp({ quality: 90 }).toFile(path.join(out, `${collection}.webp`));
  console.log(`${collection}: ${path.join(out, `${collection}.webp`)}`);
}

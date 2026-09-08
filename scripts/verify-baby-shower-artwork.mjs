import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const catalog = JSON.parse(fs.readFileSync("src/data/baby-shower-templates.json", "utf8"));
const reportPath = "docs/design/baby-shower-artwork-2026-09-07.json";
const convert = process.argv.includes("--convert");
const removeOriginals = process.argv.includes("--delete-originals");
const previous = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : { assets: [] };
const assets = [];
const fingerprints = new Set();
const hash = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
for (const design of catalog) {
  const destination = path.join("public", design.heroImage);
  const old = previous.assets.find((asset) => asset.id === design.id);
  const recordFile = `tmp/baby-shower-redesign/records/${design.id}.json`;
  const record = fs.existsSync(recordFile) ? JSON.parse(fs.readFileSync(recordFile, "utf8")) : old;
  assert.ok(record?.original, `Missing provenance: ${design.id}`);
  if (convert && !fs.existsSync(destination)) {
    execFileSync("ffmpeg", ["-v", "error", "-i", record.original, "-c:v", "libwebp", "-quality", "85", "-compression_level", "6", "-frames:v", "1", destination]);
  }
  const metadata = await sharp(destination).metadata();
  const bytes = fs.readFileSync(destination);
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  assert.equal(metadata.format, "webp");
  execFileSync("ffmpeg", ["-v", "error", "-i", destination, "-f", "null", "-"]);
  const outputHash = hash(destination);
  assert.ok(!fingerprints.has(outputHash), `Duplicate artwork: ${design.id}`);
  fingerprints.add(outputHash);
  let originalHash = old?.originalSha256;
  if (fs.existsSync(record.original)) {
    const original = await sharp(record.original).metadata();
    assert.equal(metadata.width, original.width);
    assert.equal(metadata.height, original.height);
    assert.equal(metadata.hasAlpha, original.hasAlpha);
    originalHash = hash(record.original);
  } else {
    assert.ok(old?.originalRemoved, `Unverified missing original: ${design.id}`);
    assert.equal(metadata.width, old.width);
    assert.equal(metadata.height, old.height);
    assert.equal(outputHash, old.webpSha256);
  }
  assets.push({ id: design.id, path: design.heroImage, original: record.original, originalSha256: originalHash, webpSha256: outputHash, width: metadata.width, height: metadata.height, bytes: bytes.length, hasAlpha: metadata.hasAlpha, originalRemoved: !fs.existsSync(record.original) });
}
assert.equal(assets.length, 60);
// Only exact manifest originals with verified output replacements may be removed.
if (removeOriginals) {
  for (const asset of assets) {
    assert.ok(asset.original.startsWith("/Users/rj/.codex/generated_images/01a07e16-3448-74c2-9fa6-d6112ad95aac/"));
    if (fs.existsSync(asset.original)) {
      assert.equal(hash(asset.original), asset.originalSha256);
      fs.unlinkSync(asset.original);
    }
    asset.originalRemoved = !fs.existsSync(asset.original);
  }
}
fs.writeFileSync(reportPath, `${JSON.stringify({ generator: "Built-in image_gen", encoder: "FFmpeg libwebp", quality: 85, compressionLevel: 6, dimensionsPreserved: true, assets }, null, 2)}\n`);
console.log(JSON.stringify({ verified: assets.length, distinctFiles: fingerprints.size, totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0), originalsRemoved: assets.filter((asset) => asset.originalRemoved).length }));

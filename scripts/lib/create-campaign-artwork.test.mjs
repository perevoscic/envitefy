import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { archiveGeneratedArtwork, cleanupVerifiedArtworkOriginals } from "./create-campaign-artwork.mjs";

async function fixture() {
  const root = path.resolve(".qa/create-campaign");
  await mkdir(root, { recursive: true });
  const runDir = await mkdtemp(path.join(root, "artwork-test-"));
  const pixels = Buffer.alloc(16 * 12 * 4);
  for (let index = 0; index < pixels.length / 4; index++) {
    pixels[index * 4] = 90; pixels[index * 4 + 1] = 130; pixels[index * 4 + 2] = 210;
    pixels[index * 4 + 3] = index % 3 === 0 ? 0 : index % 3 === 1 ? 128 : 255;
  }
  const bytes = await sharp(pixels, { raw: { width: 16, height: 12, channels: 4 } }).png().toBuffer();
  return { runDir, bytes, cleanup: async () => {
    assert.equal(path.dirname(path.resolve(runDir)), root);
    await rm(runDir, { recursive: true, force: true });
  } };
}

test("FFmpeg archival preserves dimensions and exact alpha, then removes only its own source", async () => {
  const f = await fixture();
  try {
    const unrelated = path.join(f.runDir, "user-reference.png");
    await writeFile(unrelated, f.bytes);
    const result = await archiveGeneratedArtwork({ ...f, targetPath: path.join(f.runDir, "artwork.webp") });
    assert.deepEqual([result.width, result.height, result.hasTransparency], [16, 12, true]);
    assert.equal(result.encoding, "ffmpeg-libwebp-quality85-compression6");
    assert.equal(result.verification.alphaPreserved, true);
    assert.equal((await readFile(result.finalWebp)).subarray(8, 12).toString(), "WEBP");
    await assert.rejects(readFile(result.originalPath), { code: "ENOENT" });
    assert.deepEqual(await readFile(unrelated), f.bytes);
    assert.deepEqual((await readdir(f.runDir)).sort(), ["artwork.webp", "user-reference.png"]);
  } finally { await f.cleanup(); }
});

test("already-WebP archives are verified without recompression", async () => {
  const f = await fixture();
  try {
    const bytes = await sharp(f.bytes).webp().toBuffer();
    const result = await archiveGeneratedArtwork({ ...f, bytes, targetPath: path.join(f.runDir, "ready.webp") });
    assert.equal(result.encoding, "verified-original-webp");
    assert.equal(result.sourceHash, result.finalHash);
    assert.deepEqual(await readFile(result.finalWebp), bytes);
  } finally { await f.cleanup(); }
});

test("failed verification retains its exact original and refuses paths outside the run", async () => {
  const f = await fixture();
  try {
    let failure;
    try { await archiveGeneratedArtwork({ ...f, targetPath: path.join(f.runDir, "failed.webp"), ffmpegPath: path.join(f.runDir, "missing-ffmpeg") }); } catch (error) { failure = error; }
    assert.ok(failure?.originalPath);
    assert.deepEqual(await readFile(failure.originalPath), f.bytes);
    await assert.rejects(archiveGeneratedArtwork({ ...f, targetPath: path.join(f.runDir, "..", "outside.webp") }), /inside/);
  } finally { await f.cleanup(); }
});

test("cleanup verifies all hashes and retains active local blob copies", async () => {
  const f = await fixture();
  try {
    const artifact = await archiveGeneratedArtwork({ ...f, targetPath: path.join(f.runDir, "final.webp") });
    const matched = path.join(f.runDir, "generated-copy.png");
    const mismatch = path.join(f.runDir, "different.png");
    const blob = path.join(f.runDir, "runtime/blobs/event-media/generated.png");
    await mkdir(path.dirname(blob), { recursive: true });
    await writeFile(matched, f.bytes); await writeFile(blob, f.bytes); await writeFile(mismatch, Buffer.from("different"));
    await assert.rejects(cleanupVerifiedArtworkOriginals({ runDir: f.runDir, artifact, originalPaths: [matched, mismatch] }), /source hash/);
    assert.deepEqual(await readFile(matched), f.bytes);
    const decisions = await cleanupVerifiedArtworkOriginals({ runDir: f.runDir, artifact, originalPaths: [matched, blob] });
    assert.equal(decisions[0].deleted, true);
    assert.equal(decisions[1].reason, "live_blob_requires_url_migration");
    assert.deepEqual(await readFile(blob), f.bytes);
    await assert.rejects(readFile(matched), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import sharp from "sharp";
import { finishStudioImage, finishStudioVideo, mp4Duration } from "./media.ts";
import { DEFAULT_STUDIO_SETTINGS } from "./types.ts";

const executeFile = promisify(execFile);

test("single-image finishing produces requested PNG aspect ratios and preserves raw bytes", async () => {
  const raw = await sharp({ create: { width: 32, height: 48, channels: 3, background: "#c8b8e8" } }).png().toBuffer();
  const original = Buffer.from(raw);
  for (const [format, width, height] of [["square", 1024, 1024], ["vertical", 864, 1536], ["horizontal", 1536, 864]] as const) {
    const result = await finishStudioImage(raw, { ...DEFAULT_STUDIO_SETTINGS, format });
    const info = await sharp(result.bytes).metadata();
    assert.equal(info.format, "png"); assert.equal(info.width, width); assert.equal(info.height, height);
  }
  assert.deepEqual(raw, original);
});

test("visible branding uses a separate official-asset overlay without modifying raw media", async () => {
  const raw = await sharp({ create: { width: 32, height: 32, channels: 3, background: "#c8b8e8" } }).png().toBuffer();
  const clean = await finishStudioImage(raw, DEFAULT_STUDIO_SETTINGS);
  const branded = await finishStudioImage(raw, { ...DEFAULT_STUDIO_SETTINGS, branding: true });
  assert.notDeepEqual(clean.bytes, branded.bytes);
  assert.equal(branded.width, clean.width); assert.equal(branded.height, clean.height);
});

test("MP4 duration is read from movie metadata with version0 and version1 boxes", () => {
  for (const version of [0, 1]) {
    const movie = Buffer.alloc(version === 1 ? 48 : 40);
    movie.writeUInt32BE(movie.length, 0); movie.write("moov", 4);
    movie.writeUInt32BE(movie.length - 8, 8); movie.write("mvhd", 12); movie[16] = version;
    const scaleOffset = version === 1 ? 36 : 28;
    movie.writeUInt32BE(1000, scaleOffset);
    if (version === 1) movie.writeBigUInt64BE(BigInt(10000), scaleOffset + 4);
    else movie.writeUInt32BE(10000, scaleOffset + 4);
    assert.equal(mp4Duration(movie), 10);
  }
  assert.equal(mp4Duration(Buffer.from("not-a-video")), undefined);
});

test("video branding preserves the generated audio stream", async context => {
  const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
  try { await executeFile(ffmpeg, ["-version"], { windowsHide: true }); }
  catch { context.skip("ffmpeg is required only for opt-in video branding"); return; }
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "studio-media-test-"));
  try {
    const original = path.join(directory, "original.mp4");
    const finished = path.join(directory, "finished.mp4");
    await executeFile(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "color=c=blue:s=720x1280:r=12", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100", "-t", "1", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", original], { windowsHide: true, timeout: 30_000 });
    const raw = await fs.readFile(original);
    const unchanged = await finishStudioVideo(raw, { ...DEFAULT_STUDIO_SETTINGS, output: "video", format: "vertical" });
    assert.deepEqual(unchanged.bytes, raw);
    const branded = await finishStudioVideo(raw, { ...DEFAULT_STUDIO_SETTINGS, output: "video", format: "vertical", branding: true });
    await fs.writeFile(finished, branded.bytes);
    assert.ok(branded.durationSec && Math.abs(branded.durationSec - 1) < 0.1);
    const audioHash = async (file: string) => (await executeFile(ffmpeg, ["-hide_banner", "-loglevel", "error", "-i", file, "-map", "0:a:0", "-c", "copy", "-f", "hash", "-hash", "sha256", "-"], { windowsHide: true })).stdout.trim();
    assert.equal(await audioHash(finished), await audioHash(original));
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

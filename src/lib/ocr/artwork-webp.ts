import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

/** Convert in memory: generated PNG/JPEG originals are never written or uploaded. */
export async function encodeScanArtworkWebp(
  original: Buffer,
  options: { maxWidth?: number; quality?: number } = {},
): Promise<Buffer> {
  const binary = process.env.IMAGE_FFMPEG_PATH || process.env.SCAN_ARTWORK_FFMPEG_PATH || ffmpegPath;
  if (!binary) throw new Error("FFmpeg is unavailable");
  const inputMeta = await sharp(original, { failOn: "warning" }).metadata();
  if ((inputMeta.pages || 1) > 1) throw new Error("Animated images require an animated WebP conversion");
  if (inputMeta.format === "webp" && (!inputMeta.orientation || inputMeta.orientation === 1) &&
      (!options.maxWidth || (inputMeta.width || 0) <= options.maxWidth)) {
    await sharp(original, { failOn: "warning" }).raw().toBuffer();
    return original;
  }
  // Normalize EXIF orientation without a lossy intermediate. No originals touch disk.
  let normalized = sharp(original, { failOn: "warning" }).rotate();
  if (options.maxWidth) {
    normalized = normalized.resize({ width: options.maxWidth, withoutEnlargement: true });
  }
  const { data: input, info: before } = await normalized.png().toBuffer({ resolveWithObject: true });
  const hasTransparency = before.channels === 4 && !(await sharp(input).stats()).isOpaque;
  const webp = await new Promise<Buffer>((resolve, reject) => {
    const child = spawn(
      binary,
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-frames:v",
        "1",
        "-c:v",
        "libwebp",
        "-quality",
        String(options.quality ?? 85),
        "-compression_level",
        "6",
        "-f",
        // The WebP muxer seeks back to finalize RIFF sizes; stdout cannot seek.
        // Emit the encoder's complete WebP packet directly, including its header.
        "image2pipe",
        "pipe:1",
      ],
      { windowsHide: true, timeout: 30_000 },
    );
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.resume();
    child.on("error", reject);
    child.stdin.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(chunks))
        : reject(new Error("Artwork WebP conversion failed")),
    );
    child.stdin.end(input);
  });
  const after = await sharp(webp).metadata();
  await sharp(webp, { failOn: "warning" }).raw().toBuffer();
  if (
    after.format !== "webp" ||
    before.width !== after.width ||
    before.height !== after.height ||
    (hasTransparency && !after.hasAlpha)
  )
    throw new Error("Artwork WebP verification failed");
  return webp;
}

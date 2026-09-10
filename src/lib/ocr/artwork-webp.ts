import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

/** Convert in memory: generated PNG/JPEG originals are never written or uploaded. */
export async function encodeScanArtworkWebp(original: Buffer): Promise<Buffer> {
  const binary = process.env.SCAN_ARTWORK_FFMPEG_PATH || ffmpegPath;
  if (!binary) throw new Error("FFmpeg is unavailable");
  const before = await sharp(original).metadata();
  const hasTransparency = before.hasAlpha && !(await sharp(original).stats()).isOpaque;
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
        "85",
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
    child.stdin.end(original);
  });
  const after = await sharp(webp).metadata();
  await sharp(webp).raw().toBuffer();
  if (
    after.format !== "webp" ||
    before.width !== after.width ||
    before.height !== after.height ||
    (hasTransparency && !after.hasAlpha)
  )
    throw new Error("Artwork WebP verification failed");
  return webp;
}

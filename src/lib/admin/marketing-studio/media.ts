import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import { StudioProviderError } from "./provider-errors.ts";
import type { StudioSettings } from "./types.ts";

const executeFile = promisify(execFile);
const WORDMARK = path.join(process.cwd(), "public", "brand", "envitefy-wordmark.png");
export type StudioFinishedMedia = { bytes: Buffer; width: number; height: number; durationSec?: number };

/** Use the official raster asset; never redraw or typeset the locked wordmark. */
async function logoOverlay(width: number): Promise<Buffer> {
  const logo = await sharp(WORDMARK).resize({ width: Math.round(width * 0.2) }).png().toBuffer();
  const meta = await sharp(logo).metadata();
  const padding = Math.max(10, Math.round(width * 0.015));
  return sharp({ create: { width: (meta.width || 1) + padding * 2, height: (meta.height || 1) + padding * 2, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.96 } } })
    .composite([{ input: logo, left: padding, top: padding }]).png().toBuffer();
}

export async function finishStudioImage(bytes: Buffer, settings: StudioSettings): Promise<StudioFinishedMedia> {
  const width = settings.format === "horizontal" ? 1536 : settings.format === "vertical" ? 864 : 1024;
  const height = settings.format === "horizontal" ? 864 : settings.format === "vertical" ? 1536 : 1024;
  const normalized = await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate().resize(width, height, { fit: "cover" }).png().toBuffer();
  const output = settings.branding
    ? await sharp(normalized).composite([{ input: await logoOverlay(width), left: Math.round(width * 0.04), top: Math.round(height * 0.04) }]).png().toBuffer()
    : normalized;
  return { bytes: output, width, height };
}

/** Read movie duration without requiring ffprobe on unbranded video deployments. */
export function mp4Duration(bytes: Buffer): number | undefined {
  function scan(start: number, end: number): number | undefined {
    for (let offset = start; offset + 8 <= end;) {
      const size = bytes.readUInt32BE(offset);
      if (size < 8 || offset + size > end) break;
      const kind = bytes.toString("ascii", offset + 4, offset + 8);
      if (kind === "moov") return scan(offset + 8, offset + size);
      if (kind === "mvhd") {
        const version = bytes[offset + 8];
        const scaleOffset = offset + (version === 1 ? 28 : 20);
        const durationOffset = scaleOffset + 4;
        if (durationOffset + (version === 1 ? 8 : 4) > offset + size) return;
        const timescale = bytes.readUInt32BE(scaleOffset);
        const duration = version === 1 ? Number(bytes.readBigUInt64BE(durationOffset)) : bytes.readUInt32BE(durationOffset);
        return timescale > 0 && duration > 0 ? duration / timescale : undefined;
      }
      offset += size;
    }
  }
  return scan(0, bytes.length);
}

export async function finishStudioVideo(bytes: Buffer, settings: StudioSettings): Promise<StudioFinishedMedia> {
  if (bytes.length < 12 || bytes.toString("ascii", 4, 8) !== "ftyp") throw new StudioProviderError("The provider did not return a valid MP4. The saved interaction will be retained for inspection.", "rejected");
  const width = settings.format === "horizontal" ? 1280 : 720;
  const height = settings.format === "horizontal" ? 720 : 1280;
  const durationSec = mp4Duration(bytes);
  if (!settings.branding) return { bytes, width, height, durationSec };
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "envitefy-content-video-"));
  try {
    await fs.writeFile(path.join(directory, "original.mp4"), bytes);
    await fs.writeFile(path.join(directory, "wordmark.png"), await logoOverlay(width));
    try {
      await executeFile(process.env.FFMPEG_PATH || "ffmpeg", [
        "-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i", "original.mp4", "-i", "wordmark.png",
        "-filter_complex", `[0:v][1:v]overlay=x=${Math.round(width * 0.04)}:y=${Math.round(height * 0.04)}[video]`,
        "-map", "[video]", "-map", "0:a?", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "copy", "-movflags", "+faststart", "finished.mp4",
      ], { cwd: directory, timeout: 120_000, maxBuffer: 1024 * 1024, windowsHide: true });
    } catch {
      throw new StudioProviderError("The video is saved but its logo could not be applied. Configure ffmpeg (or FFMPEG_PATH) and retry finishing this version; no new video generation is needed.", "retryable");
    }
    return { bytes: await fs.readFile(path.join(directory, "finished.mp4")), width, height, durationSec };
  } finally {
    // directory is created by mkdtemp with a fixed prefix; no request path reaches rm.
    await fs.rm(directory, { recursive: true, force: true });
  }
}

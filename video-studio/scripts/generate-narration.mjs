import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { parse } from "dotenv";
import {
  alignmentToCaptions,
  captionsToSrt,
  narrationCacheKey,
  sceneTiming,
} from "./narration-utils.mjs";

const studioRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = path.dirname(studioRoot);
const env = {};
for (const filename of [".env", ".env.local"]) {
  try {
    Object.assign(env, parse(await fs.readFile(path.join(repoRoot, filename))));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
Object.assign(env, process.env);
const apiKey = env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("Set ELEVENLABS_API_KEY in the repo environment or .env.local.");

async function apiRequest(route, body) {
  const response = await fetch(`https://api.elevenlabs.io${route}`, {
    method: body ? "POST" : "GET",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Avoid logging request headers or the provider's unfiltered response.
    const code = typeof error.detail?.status === "string" ? error.detail.status : "request_failed";
    throw new Error(
      `ElevenLabs HTTP ${response.status} (${code}). Check key permissions and credits.`,
    );
  }
  return response.json();
}

if (process.argv.includes("--voices")) {
  const result = await apiRequest("/v1/voices");
  console.log(
    JSON.stringify(
      result.voices.map(({ voice_id, name, category, labels }) => ({
        voice_id,
        name,
        category,
        labels,
      })),
      null,
      2,
    ),
  );
} else {
  const projectId = process.argv[2] || "intro";
  if (!/^[a-z0-9-]+$/.test(projectId))
    throw new Error("Project id must contain lowercase letters, digits, or hyphens.");
  const brief = JSON.parse(
    await fs.readFile(path.join(studioRoot, "projects", projectId, "brief.json"), "utf8"),
  );
  if (!Array.isArray(brief.scenes) || !brief.scenes.length || brief.scenes.length > 80)
    throw new Error("A brief needs 1–80 scenes.");
  if (!Number.isInteger(brief.fps) || brief.fps < 1 || brief.fps > 60)
    throw new Error("Invalid frame rate.");
  const voiceId = env.ELEVENLABS_VOICE_ID || brief.voiceId;
  if (!/^[a-zA-Z0-9_-]+$/.test(voiceId)) throw new Error("Invalid narrator voice id.");
  const audioRoot = path.join(studioRoot, "public", "audio");
  const outputRoot = path.join(studioRoot, "public", "projects", projectId);
  await fs.mkdir(audioRoot, { recursive: true });
  await fs.mkdir(outputRoot, { recursive: true });
  const scenes = [];
  const allCaptions = [];
  let cursorFrames = 0;
  for (const scene of brief.scenes) {
    if (
      !/^[a-z0-9-]+$/.test(scene.id) ||
      typeof scene.narration !== "string" ||
      !scene.narration.trim() ||
      scene.narration.length > 4500
    )
      throw new Error("Invalid scene id or narration text.");
    const request = {
      text: scene.narration,
      model_id: brief.modelId,
      voice_settings: brief.voiceSettings,
    };
    const cacheKey = narrationCacheKey({ voiceId, outputFormat: "mp3_44100_128", ...request });
    const audioFile = path.join(audioRoot, `${cacheKey}.mp3`);
    const timingFile = path.join(audioRoot, `${cacheKey}.json`);
    let cached;
    try {
      cached = JSON.parse(await fs.readFile(timingFile, "utf8"));
      const stat = await fs.stat(audioFile);
      if (!stat.size) cached = null;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (!cached) {
      console.log(`Generating narration: ${scene.id}`);
      const result = await apiRequest(
        `/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
        request,
      );
      if (typeof result.audio_base64 !== "string" || !result.audio_base64)
        throw new Error("ElevenLabs returned no audio.");
      const captions = alignmentToCaptions(result.normalized_alignment || result.alignment);
      await fs.writeFile(audioFile, Buffer.from(result.audio_base64, "base64"));
      cached = { captions };
      await fs.writeFile(timingFile, `${JSON.stringify(cached, null, 2)}\n`);
    } else console.log(`Reusing narration: ${scene.id}`);
    const durationSeconds = Number(
      execFileSync(
        "ffprobe",
        [
          "-v",
          "error",
          "-show_entries",
          "format=duration",
          "-of",
          "default=noprint_wrappers=1:nokey=1",
          audioFile,
        ],
        { encoding: "utf8", windowsHide: true },
      ).trim(),
    );
    const timing = sceneTiming(durationSeconds, brief.fps);
    scenes.push({
      ...scene,
      ...timing,
      durationSeconds,
      audioFile: `audio/${cacheKey}.mp3`,
      captions: cached.captions,
    });
    const offsetMs = ((cursorFrames + timing.audioOffsetFrames) / brief.fps) * 1000;
    for (const caption of cached.captions)
      allCaptions.push({
        ...caption,
        startMs: caption.startMs + offsetMs,
        endMs: caption.endMs + offsetMs,
      });
    cursorFrames += timing.durationInFrames;
  }
  const durationInFrames = Math.max(cursorFrames + 30, brief.targetDurationSeconds * brief.fps);
  scenes[scenes.length - 1].durationInFrames += durationInFrames - cursorFrames;
  const manifest = {
    id: projectId,
    title: brief.title,
    fps: brief.fps,
    width: 1080,
    height: 1920,
    durationInFrames,
    heroImage: brief.heroImage,
    voiceId,
    voiceName: brief.voiceName,
    generatedAt: new Date().toISOString(),
    scenes,
  };
  await fs.writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await fs.writeFile(path.join(outputRoot, "captions.srt"), captionsToSrt(allCaptions));
  console.log(
    `Ready: ${projectId}, ${(durationInFrames / brief.fps).toFixed(2)} seconds, ${scenes.length} narrated scenes.`,
  );
}

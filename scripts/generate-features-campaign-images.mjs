#!/usr/bin/env node
// Generates fresh artwork for the October 2026 features email campaign.
// Every campaign gets new images; never reuse library artwork (see AGENTS.md).
//
// Usage (from the repo root, with OPENAI_API_KEY in .env.local or .env):
//   node scripts/generate-features-campaign-images.mjs
//
// Writes WebP files to public/email/features-oct26/ and removes the PNG originals
// after each WebP is verified. Email copies are scaled to their display width (2x). Prompts are recorded in docs/email-campaigns/.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is missing from .env.local / .env.");
  process.exit(1);
}

const model =
  process.env.ADMIN_EMAIL_IMAGE_MODEL ||
  process.env.STUDIO_OPENAI_IMAGE_MODEL ||
  "gpt-image-2.5-flare";
const outDir = path.join("public", "email", "features-oct26");
fs.mkdirSync(outDir, { recursive: true });

const STYLE =
  "Professional documentary / stock photography for a brand marketing email. Natural light, realistic skin and fabric texture, believable anatomy and hands, calm single-scene composition. No logos, wordmarks, watermarks, floating icons, holograms or collage effects.";

const IMAGES = [
  {
    name: "hero",
    size: "1536x1024",
    emailWidth: 1200,
    scene:
      "A warm backyard evening party at golden hour: a long table with flowers and candles, string lights overhead, a few friends laughing in soft focus, and one guest in the foreground glancing at a phone showing an elegant invitation card. Pastel lavender and soft blue accents.",
  },
  {
    name: "snap",
    size: "1024x1024",
    emailWidth: 480,
    scene:
      "Close-up of a parent's hands at a bright kitchen counter photographing a printed children's birthday party invitation with a smartphone. The invitation is colorful and readable as a party card; a fridge and morning light softly blurred behind.",
  },
  {
    name: "live-card",
    size: "1024x1024",
    emailWidth: 480,
    scene:
      "A young couple on a sofa smiling at a phone screen showing a beautifully illustrated wedding invitation with round buttons along the bottom. Cozy living room, natural window light, shallow depth of field on the phone.",
  },
  {
    name: "event-page",
    size: "1024x1024",
    emailWidth: 480,
    scene:
      "A host at a sunny café table scrolling an event website on a laptop: a hero photo of a garden shower, a schedule section and a small map are visible but soft. Coffee cup and a notebook beside the laptop.",
  },
  {
    name: "signup",
    size: "1024x1024",
    emailWidth: 480,
    scene:
      "Volunteers at a community potluck setting out dishes on a long table in a church hall or community center, one organizer holding a phone with a sign-up list. Diverse ages, friendly and candid.",
  },
  {
    name: "rsvp",
    size: "1024x1024",
    emailWidth: 480,
    scene:
      "A relaxed host at a tidy planning table with a laptop open to a guest list of responses and headcounts, a small stack of gift boxes and a calendar nearby. Soft afternoon light, calm and organized.",
  },
];

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${cmd} failed: ${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

const client = new OpenAI({ apiKey });
const provenance = [];

for (const image of IMAGES) {
  const prompt = `Create one premium documentary stock photograph for an Envitefy email campaign. ${image.scene} ${STYLE}`;
  console.log(`Generating ${image.name} (${image.size}) with ${model}...`);
  const response = await client.images.generate({
    model,
    prompt,
    size: image.size,
    quality: "medium",
    output_format: "png",
    n: 1,
  });
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No image data returned for ${image.name}`);

  const pngPath = path.join(outDir, `${image.name}.png`);
  const webpPath = path.join(outDir, `${image.name}.webp`);
  fs.writeFileSync(pngPath, Buffer.from(b64, "base64"));

  run("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    pngPath,
    "-vf",
    `scale=${image.emailWidth}:-2`,
    "-c:v",
    "libwebp",
    "-quality",
    "75",
    "-compression_level",
    "6",
    webpPath,
  ]);

  const probe = (file) =>
    run("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=codec_name,width,height",
      "-of",
      "csv=p=0",
      file,
    ]);
  const [srcCodec, srcW, srcH] = probe(pngPath).split(",");
  const [codec, w, h] = probe(webpPath).split(",");
  // Email copies are downsized for faster loading on phones; the aspect ratio must survive.
  const ratioDrift = Math.abs(Number(w) / Number(h) - Number(srcW) / Number(srcH));
  if (codec !== "webp" || Number(w) !== image.emailWidth || ratioDrift > 0.01) {
    throw new Error(
      `WebP verification failed for ${image.name}: ${srcCodec} ${srcW}x${srcH} -> ${codec} ${w}x${h}`,
    );
  }
  fs.unlinkSync(pngPath);
  console.log(`  ✓ ${webpPath} (${w}x${h}, ${Math.round(fs.statSync(webpPath).size / 1024)} KB)`);
  provenance.push({ file: webpPath.replaceAll("\\", "/"), model, size: image.size, prompt });
}

const provenancePath = path.join("docs", "email-campaigns", "features-oct26-images.json");
fs.mkdirSync(path.dirname(provenancePath), { recursive: true });
fs.writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
console.log(`Done. ${IMAGES.length} images in ${outDir}`);

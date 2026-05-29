import fs from "node:fs/promises";
import path from "node:path";
import {
  extensionForMimeType,
  generateBaseImageWithProvider,
  resolveAdStudioImageModel,
  resolveAdStudioImageProvider,
} from "@/lib/admin/ad-studio/providers";
import type { BaseFrame, FramePlan, FramePlanItem } from "@/lib/admin/ad-studio/types";

function padFrame(frameNumber: number): string {
  return String(frameNumber).padStart(2, "0");
}

export function buildBaseFramePrompt(frame: FramePlanItem, plan: FramePlan): string {
  return [
    `Generate only a realistic base lifestyle scene for frame ${frame.frameNumber} of an Envitefy ${plan.aspectRatio} promo video.`,
    `Scene purpose: ${frame.scenePurpose}.`,
    `Visual description: ${frame.visualDescription}`,
    `Camera angle: ${frame.cameraAngle}. Character action: ${frame.characterAction}.`,
    `Lighting: ${frame.lighting}. Mood: ${frame.mood}.`,
    `Required blank surfaces: ${frame.blankSurfaceRequirements.join("; ")}.`,
    "The blank paper, card, flyer, and phone screens must be clean, unprinted, and ready for later deterministic compositing.",
    "When a phone is visible, it must be a vertical portrait phone with a large blank screen facing camera unless the frame plan explicitly says otherwise.",
    "Keep one consistent primary host across the story and do not introduce new main characters unless the frame plan explicitly requires them.",
    "Do not generate readable flyer text. Do not generate exact phone UI. Do not render Envitefy product screens, captions, QR codes, logos, watermarks, or fake chat text in the base image.",
    "Leave a clean safe area for large deterministic ad overlays, especially product UI, captions, chat bubbles, and CTA.",
    "Keep the scene cinematic, premium, modern, and friendly, with the lifestyle image acting as a background plate for the final ad-player composition.",
    `Negative prompt: ${frame.negativePrompt}`,
  ].join("\n");
}

async function renderPlaceholderBaseFrame(frame: FramePlanItem, plan: FramePlan): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const width = plan.format === "horizontal" ? 1536 : plan.format === "square" ? 1024 : 1024;
  const height = plan.format === "horizontal" ? 1024 : plan.format === "square" ? 1024 : 1536;
  const hasPhone = frame.compositeTargets.some((target) => target.type === "phone-ui");
  const hasInvite = frame.compositeTargets.some((target) => target.type === "invitation");
  const phone = hasPhone
    ? `<rect x="${Math.round(width * 0.58)}" y="${Math.round(height * 0.22)}" width="${Math.round(width * 0.26)}" height="${Math.round(height * 0.46)}" rx="44" fill="#0F172A"/><rect x="${Math.round(width * 0.605)}" y="${Math.round(height * 0.25)}" width="${Math.round(width * 0.21)}" height="${Math.round(height * 0.39)}" rx="28" fill="#F8FAFC"/>`
    : "";
  const invite = hasInvite
    ? `<rect x="${Math.round(width * 0.13)}" y="${Math.round(height * 0.22)}" width="${Math.round(width * 0.28)}" height="${Math.round(width * 0.39)}" rx="18" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="4"/>`
    : "";
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#F8FAFC"/>
      <stop offset="0.5" stop-color="#EFE7FF"/>
      <stop offset="1" stop-color="#E0F2FE"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${Math.round(width * 0.28)}" cy="${Math.round(height * 0.36)}" r="${Math.round(width * 0.12)}" fill="#CBD5E1"/>
  <rect x="${Math.round(width * 0.18)}" y="${Math.round(height * 0.49)}" width="${Math.round(width * 0.22)}" height="${Math.round(height * 0.28)}" rx="70" fill="#94A3B8"/>
  ${invite}
  ${phone}
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function cropHostIdentityReference({
  sourcePath,
  outputPath,
}: {
  sourcePath: string;
  outputPath: string;
}): Promise<void> {
  const sharp = (await import("sharp")).default;
  const meta = await sharp(sourcePath).metadata();
  const width = meta.width || 1024;
  const height = meta.height || 1536;
  const cropWidth = Math.max(180, Math.round(width * 0.42));
  const cropHeight = Math.max(180, Math.round(height * 0.38));
  const left = Math.max(0, Math.round(width * 0.19));
  const top = Math.max(0, Math.round(height * 0.16));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(sourcePath)
    .extract({
      left: Math.min(left, width - cropWidth),
      top: Math.min(top, height - cropHeight),
      width: Math.min(cropWidth, width),
      height: Math.min(cropHeight, height),
    })
    .png()
    .toFile(outputPath);
}

export async function generateBaseImageFrames({
  runDir,
  plan,
  frameNumber,
  buildAssetUrl,
}: {
  runDir: string;
  plan: FramePlan;
  frameNumber?: number | null;
  buildAssetUrl: (file: string) => string;
}): Promise<{ frames: BaseFrame[]; hostReferenceFile: string | null; warnings: string[] }> {
  const framesToGenerate = frameNumber
    ? plan.frames.filter((frame) => frame.frameNumber === frameNumber)
    : plan.frames;
  const outputDir = path.join(runDir, "base-frames");
  await fs.mkdir(outputDir, { recursive: true });
  const warnings: string[] = [];
  const generated: BaseFrame[] = [];
  let hostReferenceFile: string | null = null;
  let hostReferencePath: string | null = null;
  const existingHostReferenceFile = "references/host-identity.png";
  const existingHostReferencePath = path.join(runDir, existingHostReferenceFile);
  try {
    await fs.access(existingHostReferencePath);
    hostReferenceFile = existingHostReferenceFile;
    hostReferencePath = existingHostReferencePath;
  } catch {}

  for (const frame of framesToGenerate) {
    const prompt = buildBaseFramePrompt(frame, plan);
    const referencePaths =
      hostReferencePath && frame.requiredReferences.includes("cropped_host_identity_reference")
        ? [hostReferencePath]
        : [];
    let payload: Awaited<ReturnType<typeof generateBaseImageWithProvider>> = null;
    try {
      payload = await generateBaseImageWithProvider({
        prompt,
        format: plan.format,
        referenceFiles: referencePaths,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image provider failed.";
      warnings.push(`Frame ${frame.frameNumber} used deterministic placeholder base: ${message}`);
    }

    const bytes = payload?.bytes || (await renderPlaceholderBaseFrame(frame, plan));
    const provider = payload?.provider || `${resolveAdStudioImageProvider()}-placeholder`;
    const model = payload?.model || resolveAdStudioImageModel();
    warnings.push(...(payload?.warnings || []));
    const file = `base-frames/frame-${padFrame(frame.frameNumber)}${extensionForMimeType(
      payload?.mimeType || "image/png",
    )}`;
    const absolutePath = path.join(runDir, file);
    await fs.writeFile(absolutePath, bytes);
    const sharp = (await import("sharp")).default;
    const meta = await sharp(absolutePath).metadata();
    if (frame.frameNumber === 1) {
      hostReferenceFile = existingHostReferenceFile;
      hostReferencePath = path.join(runDir, hostReferenceFile);
      await cropHostIdentityReference({ sourcePath: absolutePath, outputPath: hostReferencePath });
    }
    generated.push({
      frameNumber: frame.frameNumber,
      file,
      url: buildAssetUrl(file),
      prompt,
      provider,
      model,
      generatedAt: new Date().toISOString(),
      references: referencePaths.length && hostReferenceFile ? [hostReferenceFile] : [],
      hostReferenceFile,
      width: meta.width || null,
      height: meta.height || null,
    });
  }

  return { frames: generated, hostReferenceFile, warnings };
}

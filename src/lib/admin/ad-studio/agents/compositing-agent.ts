import fs from "node:fs/promises";
import path from "node:path";
import { renderInvitationCompositeBuffer } from "@/lib/admin/ad-studio/compositing/composite-invitation";
import { renderPhoneUiCompositeBuffer } from "@/lib/admin/ad-studio/compositing/composite-phone-ui";
import { computeCompositePlacement } from "@/lib/admin/ad-studio/compositing/perspective-utils";
import type {
  BaseFrame,
  CompositeFrame,
  FramePlan,
  RenderedAsset,
} from "@/lib/admin/ad-studio/types";

function padFrame(frameNumber: number): string {
  return String(frameNumber).padStart(2, "0");
}

export async function compositeFinalFrames({
  runDir,
  plan,
  baseFrames,
  invitationAsset,
  phoneUiAsset,
  buildAssetUrl,
}: {
  runDir: string;
  plan: FramePlan;
  baseFrames: BaseFrame[];
  invitationAsset: RenderedAsset;
  phoneUiAsset: RenderedAsset;
  buildAssetUrl: (file: string) => string;
}): Promise<CompositeFrame[]> {
  const sharp = (await import("sharp")).default;
  const outputDir = path.join(runDir, "composited-frames");
  await fs.mkdir(outputDir, { recursive: true });
  const frames: CompositeFrame[] = [];

  for (const baseFrame of baseFrames) {
    const framePlan = plan.frames.find((frame) => frame.frameNumber === baseFrame.frameNumber);
    if (!framePlan) continue;
    const inputPath = path.join(runDir, baseFrame.file);
    const meta = await sharp(inputPath).metadata();
    const imageWidth = meta.width || baseFrame.width || 1024;
    const imageHeight = meta.height || baseFrame.height || 1536;
    const placements = framePlan.compositeTargets.map((target) =>
      computeCompositePlacement({ target, imageWidth, imageHeight, plan }),
    );
    const compositeInputs = [];
    for (const placement of placements) {
      const input =
        placement.type === "invitation"
          ? await renderInvitationCompositeBuffer(
              invitationAsset,
              placement.width,
              placement.height,
            )
          : await renderPhoneUiCompositeBuffer(phoneUiAsset, placement.width, placement.height);
      compositeInputs.push({
        input,
        left: placement.left,
        top: placement.top,
      });
    }
    const outputFile = `composited-frames/frame-${padFrame(baseFrame.frameNumber)}.png`;
    await sharp(inputPath).composite(compositeInputs).png().toFile(path.join(runDir, outputFile));

    frames.push({
      frameNumber: baseFrame.frameNumber,
      baseFrameFile: baseFrame.file,
      finalFile: outputFile,
      finalUrl: buildAssetUrl(outputFile),
      invitationAssetFile: placements.some((placement) => placement.type === "invitation")
        ? invitationAsset.file
        : null,
      phoneUiAssetFile: placements.some((placement) => placement.type === "phone-ui")
        ? phoneUiAsset.file
        : null,
      placements,
      generatedAt: new Date().toISOString(),
    });
  }

  return frames;
}

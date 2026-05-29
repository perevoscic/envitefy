import type {
  AdStudioCampaign,
  CompositeFrame,
  QAResult,
  VeoPromptPackage,
} from "@/lib/admin/ad-studio/types";
import { buildTimingMap } from "@/lib/admin/ad-studio/video/timing-map";

export function generateVeoPromptPackage({
  campaign,
  compositeFrames,
  qaResults,
}: {
  campaign: AdStudioCampaign;
  compositeFrames: CompositeFrame[];
  qaResults: QAResult[];
}): VeoPromptPackage {
  const failedQa = qaResults.find((result) => !result.passed);
  if (failedQa) {
    throw new Error(
      `image_qa_failed: frame ${failedQa.frameNumber} ${failedQa.failureReason || ""}`,
    );
  }
  if (compositeFrames.length < campaign.framePlan.frames.length) {
    throw new Error("image_qa_failed: accepted composited frames are required before Veo prompts.");
  }

  const timingMap = buildTimingMap(campaign.script);
  const frameList = campaign.framePlan.frames
    .map((plan) => {
      const baseFrame = campaign.baseFrames.find((frame) => frame.frameNumber === plan.frameNumber);
      const compositeFrame = compositeFrames.find(
        (frame) => frame.frameNumber === plan.frameNumber,
      );
      return `Frame ${plan.frameNumber}: use ${baseFrame?.file || compositeFrame?.finalFile || "accepted frame"} as the cinematic background plate; deterministic overlays supply all readable invitation, phone UI, captions, chats, and CTA content.`;
    })
    .join("\n");
  const sceneBriefs = campaign.script.scenes
    .map(
      (scene) =>
        `Scene ${scene.sceneNumber} (${scene.timestamp}): ${scene.visual} Voiceover: "${scene.voiceover}" Overlay: "${scene.onScreenText}"`,
    )
    .join("\n");

  const masterPrompt = `Create a polished ${campaign.request.videoLength}-second Envitefy promotional video using a controlled ad-player composition.

Brand and story:
${campaign.campaignBrief.adSummary}

Use these accepted image plates as visual anchors:
${frameList}

Scene plan:
${sceneBriefs}

Important production rules:
- Treat generated lifestyle frames as background plates, not the final ad layout.
- Render deterministic invitation, Envitefy phone UI, chat bubbles, captions, logo, and CTA as crisp motion-graphic overlays.
- Keep product UI large and readable; do not redraw, hallucinate, or replace readable fields.
- Animate the realistic lifestyle background subtly: phone buzzes, host moves naturally, camera breathes.
- Do not introduce fake text, distorted UI, extra logos, discounts, or claims.
- Keep pacing fast, premium, helpful, family/event focused, and mobile-first.
- End on the CTA: ${campaign.campaignBrief.cta}.`;

  const perScenePrompts = campaign.script.scenes.map((scene) => {
    const frame = compositeFrames.find((item) => item.frameNumber === scene.sceneNumber);
    return {
      sceneNumber: scene.sceneNumber,
      sourceFrameFile: frame?.baseFrameFile || frame?.finalFile || "",
      prompt: `Animate scene ${scene.sceneNumber} for ${scene.durationSeconds} seconds using the accepted image as a background plate. ${scene.visual} Render the readable invitation, Envitefy phone UI, chats, captions, and CTA as deterministic overlays in the ad-player style. Camera motion should be subtle and cinematic. Overlay text timing: "${scene.onScreenText}". Voiceover: "${scene.voiceover}".`,
    };
  });

  return {
    masterPrompt,
    perScenePrompts,
    timingMap,
    transitionInstructions:
      "Use clean ad-player transitions: quick cuts for chaos, a soft snap/upload transition for the Envitefy reveal, and a controlled product UI push-in for the final demo.",
    cameraMotionInstructions:
      "Use gentle movement on lifestyle background plates, controlled push-ins on deterministic phone UI, and no aggressive zooms that reduce UI readability.",
    overlayCaptionInstructions:
      "Show captions in platform-safe zones. Keep overlays short, high-contrast, and timed to scene starts. Do not cover the phone UI or invitation.",
    finalCtaInstructions: `Final second: hold on Envitefy payoff and CTA "${campaign.campaignBrief.cta}".`,
    formatSpecificPrompts: {
      vertical:
        "9:16 vertical: keep host/background centered, put captions in top safe zones, and make the product phone large enough for mobile feed readability.",
      horizontal:
        "16:9 horizontal: widen the environment, keep story copy on the left and product phone on the right third, preserve readable UI and invitation inserts.",
      square:
        "1:1 square: center action, use moderate cropping, keep CTA and product UI inside the middle 80% safe area.",
    },
  };
}

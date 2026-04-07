import {
  generateInvitationImageWithGemini,
  generateInvitationTextWithGemini,
} from "@/lib/studio/gemini";
import { buildInvitationImagePrompt, buildInvitationTextPrompt } from "@/lib/studio/prompts";
import type { StudioGenerateRequest, StudioGenerateResponse } from "@/lib/studio/types";

function uniqueWarnings(list: string[]): string[] {
  return Array.from(new Set(list.map((item) => item.trim()).filter(Boolean)));
}

export async function generateStudioInvitation(
  request: StudioGenerateRequest,
): Promise<StudioGenerateResponse> {
  const mode = request.mode || "both";
  const warnings: string[] = [];
  let invitation: StudioGenerateResponse["invitation"] = null;
  let imageDataUrl: string | null = null;
  const errors: NonNullable<StudioGenerateResponse["errors"]> = {};

  const wantsText = mode === "text" || mode === "both";
  const wantsImage = mode === "image" || mode === "both";

  if (wantsText) {
    const textPrompt = buildInvitationTextPrompt(request.event, request.guidance);
    const textResult = await generateInvitationTextWithGemini(textPrompt);
    warnings.push(...textResult.warnings);
    if (textResult.ok) {
      invitation = textResult.invitation;
    } else {
      errors.text = textResult.error;
      warnings.push("Invitation text generation failed.");
    }
  }

  if (wantsImage) {
    const imagePrompt = buildInvitationImagePrompt(request.event, request.guidance);
    const imageResult = await generateInvitationImageWithGemini(imagePrompt);
    warnings.push(...imageResult.warnings);
    if (imageResult.ok) {
      imageDataUrl = imageResult.imageDataUrl;
    } else {
      errors.image = imageResult.error;
      warnings.push("Invitation image generation failed.");
    }
  }

  const hasErrors = Boolean(errors.text || errors.image);
  const ok = !hasErrors && (invitation !== null || imageDataUrl !== null);

  return {
    ok,
    mode,
    invitation,
    imageDataUrl,
    warnings: uniqueWarnings(warnings),
    errors: hasErrors ? errors : undefined,
  };
}

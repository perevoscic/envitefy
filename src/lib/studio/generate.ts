import {
  editInvitationImageWithGemini,
  generateInvitationImageWithGemini,
  generateStudioLiveCardWithGemini,
} from "@/lib/studio/gemini";
import { buildInvitationImagePrompt, buildLiveCardPrompt } from "@/lib/studio/prompts";
import { resolveStudioReferenceImages } from "@/lib/studio/reference-image-url";
import type {
  StudioGenerateRequest,
  StudioGenerateResponse,
  StudioLiveCardMetadata,
} from "@/lib/studio/types";

function uniqueWarnings(list: string[]): string[] {
  return Array.from(new Set(list.map((item) => item.trim()).filter(Boolean)));
}

export async function generateStudioInvitation(
  request: StudioGenerateRequest,
): Promise<StudioGenerateResponse> {
  const mode = request.mode || "both";
  const warnings: string[] = [];
  let liveCard: StudioLiveCardMetadata | null = null;
  let invitation: StudioGenerateResponse["invitation"] = null;
  let imageDataUrl: string | null = null;
  const errors: NonNullable<StudioGenerateResponse["errors"]> = {};

  const wantsText = mode === "text" || mode === "both";
  const wantsImage = mode === "image" || mode === "both";

  if (wantsText) {
    const textPrompt = buildLiveCardPrompt(request.event, request.guidance);
    const textResult = await generateStudioLiveCardWithGemini(textPrompt);
    warnings.push(...textResult.warnings);
    if (textResult.ok) {
      liveCard = textResult.liveCard;
      invitation = textResult.liveCard.invitation;
    } else {
      errors.text = textResult.error;
      warnings.push("Invitation text generation failed.");
    }
  }

  if (wantsImage) {
    const referenceImages = await resolveStudioReferenceImages(request.event.referenceImageUrls);
    const imagePrompt = buildInvitationImagePrompt(request.event, request.guidance, liveCard, {
      editingExistingImage: Boolean(request.imageEdit?.sourceImageDataUrl),
      referenceImageCount: referenceImages.length,
    });
    const imageResult = request.imageEdit?.sourceImageDataUrl
      ? await editInvitationImageWithGemini(
          imagePrompt,
          request.imageEdit.sourceImageDataUrl,
          referenceImages.length > 0 ? referenceImages : undefined,
        )
      : await generateInvitationImageWithGemini(
          imagePrompt,
          referenceImages.length > 0 ? referenceImages : undefined,
        );
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
    liveCard,
    invitation,
    imageDataUrl,
    warnings: uniqueWarnings(warnings),
    errors: hasErrors ? errors : undefined,
  };
}

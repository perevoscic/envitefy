import {
  editInvitationImageWithGemini,
  generateInvitationImageWithGemini,
  generateStudioLiveCardWithGemini,
} from "@/lib/studio/gemini";
import {
  editInvitationImageWithOpenAi,
  generateInvitationImageWithOpenAi,
  generateStudioLiveCardWithOpenAi,
} from "@/lib/studio/openai";
import { resolveStudioProvider } from "@/lib/studio/provider";
import {
  buildInvitationImagePrompt,
  buildLiveCardPrompt,
  sanitizeStudioLiveCardVisibleCopy,
} from "@/lib/studio/prompts";
import { resolveStudioReferenceImages } from "@/lib/studio/reference-image-url";
import {
  applyStudioThemeNormalization,
  normalizeStudioTheme,
} from "@/lib/studio/theme-normalization";
import type {
  StudioGenerateRequest,
  StudioGenerateResponse,
  StudioLiveCardMetadata,
  StudioProvider,
} from "@/lib/studio/types";

function uniqueWarnings(list: string[]): string[] {
  return Array.from(new Set(list.map((item) => item.trim()).filter(Boolean)));
}

function buildReferenceImageError(provider: StudioProvider): NonNullable<
  StudioGenerateResponse["errors"]
>["image"] {
  return {
    code: "reference_images_unavailable",
    message:
      "The invite was not generated because attached reference photos could not be used. Re-upload the photos and try again.",
    retryable: true,
    provider,
    status: 400,
  };
}

function buildThemeBlockedError(provider: StudioProvider): NonNullable<
  StudioGenerateResponse["errors"]
>["text"] {
  return {
    code: "policy_blocked",
    message: "This theme cannot be used for invitation generation.",
    retryable: false,
    provider,
    status: 400,
  };
}

export const studioGenerationDeps = {
  applyStudioThemeNormalization,
  editInvitationImageWithGemini,
  editInvitationImageWithOpenAi,
  generateInvitationImageWithGemini,
  generateInvitationImageWithOpenAi,
  generateStudioLiveCardWithGemini,
  generateStudioLiveCardWithOpenAi,
  normalizeStudioTheme,
  resolveStudioProvider,
  resolveStudioReferenceImages,
};

export async function generateStudioInvitation(
  request: StudioGenerateRequest,
): Promise<StudioGenerateResponse> {
  const provider = studioGenerationDeps.resolveStudioProvider();
  const mode = request.mode || "both";
  const surface = request.surface || (mode === "both" || mode === "text" ? "page" : "image");
  const themeNormalization = await studioGenerationDeps.normalizeStudioTheme({
    provider,
    event: request.event,
    guidance: request.guidance,
  });
  const normalizedRequest =
    themeNormalization.riskLevel === "block"
      ? request
      : studioGenerationDeps.applyStudioThemeNormalization(request, themeNormalization);
  const warnings: string[] = [];
  let liveCard: StudioLiveCardMetadata | null = null;
  let invitation: StudioGenerateResponse["invitation"] = null;
  let imageDataUrl: string | null = null;
  const errors: NonNullable<StudioGenerateResponse["errors"]> = {};

  const wantsText = mode === "text" || mode === "both";
  const wantsImage = mode === "image" || mode === "both";

  if (themeNormalization.riskLevel === "block") {
    errors.text = buildThemeBlockedError(provider);
    if (wantsImage) {
      errors.image = buildThemeBlockedError(provider);
    }
    return {
      ok: false,
      mode,
      liveCard: null,
      invitation: null,
      imageDataUrl: null,
      themeNormalization,
      warnings: uniqueWarnings(warnings),
      errors,
    };
  }

  if (wantsText) {
    const textPrompt = buildLiveCardPrompt(normalizedRequest.event, normalizedRequest.guidance);
    const textResult =
      provider === "openai"
        ? await studioGenerationDeps.generateStudioLiveCardWithOpenAi(textPrompt)
        : await studioGenerationDeps.generateStudioLiveCardWithGemini(textPrompt);
    warnings.push(...textResult.warnings);
    if (textResult.ok) {
      liveCard = sanitizeStudioLiveCardVisibleCopy(normalizedRequest.event, textResult.liveCard);
      invitation = liveCard.invitation;
    } else {
      errors.text = textResult.error;
      warnings.push("Invitation text generation failed.");
    }
  }

  if (wantsImage) {
    const requestedRefCount = normalizedRequest.event.referenceImageUrls?.length ?? 0;
    const referenceImages = await studioGenerationDeps.resolveStudioReferenceImages(
      normalizedRequest.event.referenceImageUrls,
    );
    if (requestedRefCount > 0 && referenceImages.length !== requestedRefCount) {
      errors.image = buildReferenceImageError(provider);
    } else {
      const imagePrompt = buildInvitationImagePrompt(
        normalizedRequest.event,
        normalizedRequest.guidance,
        liveCard,
        {
          surface,
          editingExistingImage: Boolean(normalizedRequest.imageEdit?.sourceImageDataUrl),
          referenceImageCount: referenceImages.length,
        },
      );
      const imageResult = normalizedRequest.imageEdit?.sourceImageDataUrl
        ? provider === "openai"
          ? await studioGenerationDeps.editInvitationImageWithOpenAi(
              imagePrompt,
              normalizedRequest.imageEdit.sourceImageDataUrl,
              referenceImages.length > 0 ? referenceImages : undefined,
            )
          : await studioGenerationDeps.editInvitationImageWithGemini(
              imagePrompt,
              normalizedRequest.imageEdit.sourceImageDataUrl,
              referenceImages.length > 0 ? referenceImages : undefined,
            )
        : provider === "openai"
          ? await studioGenerationDeps.generateInvitationImageWithOpenAi(
              imagePrompt,
              referenceImages.length > 0 ? referenceImages : undefined,
            )
          : await studioGenerationDeps.generateInvitationImageWithGemini(
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
  }

  const hasErrors = Boolean(errors.text || errors.image);
  const hasTextSuccess = invitation !== null;
  const hasImageSuccess = imageDataUrl !== null;
  const ok =
    mode === "text"
      ? hasTextSuccess
      : mode === "image"
        ? hasImageSuccess
        : hasTextSuccess || hasImageSuccess;

  return {
    ok,
    mode,
    liveCard,
    invitation,
    imageDataUrl,
    themeNormalization,
    warnings: uniqueWarnings(warnings),
    errors: hasErrors ? errors : undefined,
  };
}

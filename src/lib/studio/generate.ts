import { composeFlyerExport } from "./flyer-export.ts";
import { applyVerifiedCopy, verifyStudioArtwork, type ArtworkCheck } from "./output-checks.ts";
import { buildProductCopyPrompt, buildProductArtworkPrompt } from "./product-prompts.ts";
import { validateCreativePlan, resolveStudioProduct } from "./product-contract.ts";
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
import {
  buildExistingInvitationImageEditPrompt,
  sanitizeStudioLiveCardVisibleCopy,
} from "@/lib/studio/prompts";
import { resolveStudioProvider } from "@/lib/studio/provider";
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

function buildReferenceImageError(
  provider: StudioProvider,
): NonNullable<StudioGenerateResponse["errors"]>["image"] {
  return {
    code: "reference_images_unavailable",
    message:
      "The invite was not generated because attached reference photos could not be used. Re-upload the photos and try again.",
    retryable: true,
    provider,
    status: 400,
  };
}

function buildThemeBlockedError(
  provider: StudioProvider,
): NonNullable<StudioGenerateResponse["errors"]>["text"] {
  return {
    code: "policy_blocked",
    message: "This theme cannot be used for invitation generation.",
    retryable: false,
    provider,
    status: 400,
  };
}

function getOrderedStudioReferenceImageUrls(
  event: StudioGenerateRequest["event"],
): string[] | undefined {
  const seen = new Set<string>();
  const urls = [...(event.propertyImageUrls || []), ...(event.referenceImageUrls || [])].filter(
    (url) => {
      const trimmed = url.trim();
      if (!trimmed || seen.has(trimmed)) return false;
      seen.add(trimmed);
      return true;
    },
  );
  return urls.length > 0 ? urls : undefined;
}

export const studioGenerationDeps = {
  composeFlyerExport,
  verifyStudioArtwork,
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
  const product = resolveStudioProduct(request.product, surface);
  let qualityCheck: ArtworkCheck["status"] = "unavailable";
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

  const wantsText = mode === "text" || mode === "both" || (mode === "image" && !request.imageEdit);
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
    const textPrompt = buildProductCopyPrompt(normalizedRequest.event, normalizedRequest.guidance, product);
    const textResult =
      provider === "openai"
        ? await studioGenerationDeps.generateStudioLiveCardWithOpenAi(textPrompt)
        : await studioGenerationDeps.generateStudioLiveCardWithGemini(textPrompt);
    warnings.push(...textResult.warnings);
    if (textResult.ok) {
      liveCard = applyVerifiedCopy(normalizedRequest.event, sanitizeStudioLiveCardVisibleCopy(normalizedRequest.event, textResult.liveCard));
      liveCard.creativePlan = validateCreativePlan(normalizedRequest.event, product, liveCard.creativePlan);
      invitation = liveCard.invitation;
    } else {
      errors.text = textResult.error;
      warnings.push("Invitation text generation failed.");
    }
  }

  if (wantsImage) {
    const editingExistingImage = Boolean(normalizedRequest.imageEdit?.sourceImageDataUrl);
    const orderedReferenceImageUrls = editingExistingImage
      ? undefined
      : getOrderedStudioReferenceImageUrls(normalizedRequest.event);
    const requestedRefCount = orderedReferenceImageUrls?.length ?? 0;
    const referenceImages =
      await studioGenerationDeps.resolveStudioReferenceImages(orderedReferenceImageUrls);
    if (requestedRefCount > 0 && referenceImages.length !== requestedRefCount) {
      errors.image = buildReferenceImageError(provider);
    } else {
      const artworkPrompt = buildProductArtworkPrompt(normalizedRequest.event, normalizedRequest.guidance, liveCard, product, referenceImages.length);
      const imagePrompt = editingExistingImage
        ? product === "live_card"
          ? buildExistingInvitationImageEditPrompt(normalizedRequest.imageEdit?.editInstruction)
          : ["Edit the supplied artwork. Remove all existing typography so the application can typeset the current event facts. Preserve the visual subject and apply the requested changes.", normalizedRequest.imageEdit?.editInstruction, artworkPrompt].filter(Boolean).join("\n")
        : artworkPrompt;
      const imageResult = editingExistingImage
        ? provider === "openai"
          ? await studioGenerationDeps.editInvitationImageWithOpenAi(
              imagePrompt,
              normalizedRequest.imageEdit!.sourceImageDataUrl,
            )
          : await studioGenerationDeps.editInvitationImageWithGemini(
              imagePrompt,
              normalizedRequest.imageEdit!.sourceImageDataUrl,
            )
        : provider === "openai"
          ? await studioGenerationDeps.generateInvitationImageWithOpenAi(
              imagePrompt,
              referenceImages.length > 0 ? referenceImages : undefined,
              product,
            )
          : await studioGenerationDeps.generateInvitationImageWithGemini(
              imagePrompt,
              referenceImages.length > 0 ? referenceImages : undefined,
              product,
            );
      warnings.push(...imageResult.warnings);
      if (imageResult.ok) {
        let artwork = imageResult.imageDataUrl;
        let checked: ArtworkCheck = editingExistingImage && product === "live_card"
          ? { status: "unavailable", issues: [] }
          : await studioGenerationDeps.verifyStudioArtwork(artwork, normalizedRequest.event, product);
        if (checked.status === "failed") {
          const repairPrompt = [imagePrompt, `Targeted quality repair: ${checked.issues.join(", ")}. Fix only these observed defects, retaining the approved facts, subject and design.`].join("\n");
          const repaired = provider === "openai"
            ? await studioGenerationDeps.editInvitationImageWithOpenAi(repairPrompt, artwork)
            : await studioGenerationDeps.editInvitationImageWithGemini(repairPrompt, artwork);
          if (repaired.ok) {
            artwork = repaired.imageDataUrl;
            checked = await studioGenerationDeps.verifyStudioArtwork(artwork, normalizedRequest.event, product);
            // A failed image cannot be accepted merely because the repair verifier timed out.
            if (checked.status === "unavailable") checked = { status: "failed", issues: ["repair_unverified"] };
          }
        }
        qualityCheck = checked.status;
        if (checked.status === "failed") {
          errors.image = { code: "image_quality_failed", message: "The artwork did not pass its text and layout checks after one repair. Please regenerate it.", provider, retryable: true };
        } else {
          if (checked.status === "unavailable") warnings.push("Automatic artwork verification was unavailable; review the preview before sharing.");
          try {
            imageDataUrl = await studioGenerationDeps.composeFlyerExport(artwork, normalizedRequest.event, liveCard, product);
          } catch (error) {
            errors.image = { code: "export_failed", message: error instanceof Error ? error.message : "Flyer export failed.", provider, retryable: false };
          }
        }
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
        : hasTextSuccess && hasImageSuccess;

  return {
    ok,
    mode,
    product,
    qualityCheck,
    liveCard,
    invitation,
    imageDataUrl,
    themeNormalization,
    warnings: uniqueWarnings(warnings),
    errors: hasErrors ? errors : undefined,
  };
}

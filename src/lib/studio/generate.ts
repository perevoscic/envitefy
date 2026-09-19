import { composeFlyerExport } from "./flyer-export.ts";
import { compileArtworkContract, artworkContractConflictMessage, STUDIO_ARTWORK_PROMPT_MAX_CHARACTERS } from "./artwork-copy.ts";
import { prepareStudioImageGeometry, validateStudioImageGeometry, type StudioImageGeometry } from "./image-geometry.ts";
import { resolveProductEditPlan } from "./product-edit-plan.ts";
import { requestedStudioPalette } from "./palette.ts";
import { createGenerationTracker, type GenerationOptions } from "./generation-progress.ts";
import { applyVerifiedCopy, verifyStudioArtwork, type ArtworkCheck } from "./output-checks.ts";
import { buildProductCopyPrompt, buildProductArtworkPrompt } from "./product-prompts.ts";
import { validateCreativePlan, resolveStudioProduct, productContract } from "./product-contract.ts";
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

function isLayoutReview(check: ArtworkCheck, product: StudioGenerateResponse["product"]): boolean {
  return product === "live_card" && check.status === "failed" &&
    check.issues.length > 0 && check.issues.every((issue) => issue === "unsafe_placement");
}

function artworkFailureMessage(check: ArtworkCheck, editing: boolean): string {
  const visualChangeFailed = check.issues.some((issue) =>
    ["requested_change_not_applied", "style_mismatch", "reference_mismatch"].includes(issue),
  );
  const problem = visualChangeFailed
    ? editing
      ? "The artwork did not match the requested visual changes after one repair attempt."
      : "The artwork did not match the requested design after one repair attempt."
    : "The artwork did not pass its lettering and layout checks after one repair attempt.";
  return `${problem} ${editing ? "Your previous image is unchanged. Retry the artwork edit." : "Please try generating again."}`;
}

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
  prepareStudioImageGeometry,
  validateStudioImageGeometry,
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
  options: GenerationOptions = {},
): Promise<StudioGenerateResponse> {
  const tracker = createGenerationTracker(options);
  const provider = studioGenerationDeps.resolveStudioProvider();
  const mode = request.mode || "both";
  const surface = request.surface || (mode === "both" || mode === "text" ? "page" : "image");
  const product = resolveStudioProduct(request.product, surface);
  const imageOptions = {
    signal: options.signal,
    size: (product === "event_page" ? "1536x1024" : "1024x1536") as StudioImageGeometry["size"],
    onPartialImage: options.onProgress ? (url: string) => tracker.preview(url, true) : undefined,
  };
  let artworkContract = compileArtworkContract(request.event, product);
  if (mode !== "text" && buildProductArtworkPrompt(request.event, request.guidance, null, product, 0).length > STUDIO_ARTWORK_PROMPT_MAX_CHARACTERS) artworkContract.blockedIssues.push("artwork_prompt_too_long");
  const diagnostics: NonNullable<StudioGenerateResponse["diagnostics"]> = {
    version: 1, contractId: artworkContract.id, operation: request.imageEdit ? "edit" : "initial", outcome: "provider_failed", checks: [],
  };
  if (artworkContract.blockedIssues.length) {
    diagnostics.outcome = "contract_blocked";
    return { ok: false, mode, product, liveCard: null, invitation: null, imageDataUrl: null, warnings: [], artworkContract, diagnostics,
      errors: { image: { code: "invalid_artwork_contract", message: artworkContractConflictMessage(artworkContract.blockedIssues), retryable: false, provider } }, timings: tracker.finish() };
  }
  const requestedEditPlan = resolveProductEditPlan(product, request.imageEdit?.editInstruction || "");
  if (requestedEditPlan.unsupportedPageChanges.length) {
    diagnostics.outcome = "contract_blocked";
    return { ok: false, mode, product, liveCard: null, invitation: null, imageDataUrl: null, warnings: [], artworkContract, diagnostics,
      errors: { image: { code: "unsupported_page_change", message: "That event-page font or layout change is not supported in chat yet. You can request larger lettering, readable contrast, or dark/light text. Your page and artwork are unchanged.", retryable: false, provider } }, timings: tracker.finish() };
  }
  if (request.imageEdit && !requestedEditPlan.hasRasterChanges && Object.keys(requestedEditPlan.pageTypography).length) {
    diagnostics.outcome = "contract_blocked";
    return { ok: false, mode, product, liveCard: null, invitation: null, imageDataUrl: null, warnings: [], artworkContract, diagnostics,
      errors: { image: { code: "page_typography_only", message: "Apply this lettering change to the event page; its artwork does not need regeneration.", retryable: false, provider } }, timings: tracker.finish() };
  }
  let qualityCheck: StudioGenerateResponse["qualityCheck"] = "unavailable";
  let expectedGeometry: StudioImageGeometry;
  try {
    expectedGeometry = await tracker.measure("preparing", () => studioGenerationDeps.prepareStudioImageGeometry(product, request.imageEdit?.sourceImageDataUrl));
    imageOptions.size = expectedGeometry.size;
  } catch (error) {
    diagnostics.outcome = "contract_blocked";
    return { ok: false, mode, product, liveCard: null, invitation: null, imageDataUrl: null, warnings: [], artworkContract, diagnostics,
      errors: { image: { code: "invalid_source_geometry", message: error instanceof Error ? error.message : "The source image could not be verified. Reattach it before editing.", retryable: false, provider } }, timings: tracker.finish() };
  }
  const themeNormalization = await tracker.measure("preparing", () => studioGenerationDeps.normalizeStudioTheme({
    provider,
    event: request.event,
    guidance: request.guidance,
  }));
  const normalizedBase =
    themeNormalization.riskLevel === "block"
      ? request
      : studioGenerationDeps.applyStudioThemeNormalization(request, themeNormalization);
  const normalizedRequest = { ...normalizedBase };
  if (normalizedRequest.imageEdit && product === "event_page") {
    const editPlan = resolveProductEditPlan(product, normalizedRequest.imageEdit.editInstruction || "");
    normalizedRequest.imageEdit = { ...normalizedRequest.imageEdit, editInstruction: editPlan.rasterInstruction };
  }
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
      timings: tracker.finish(),
    };
  }

  if (wantsText) {
    const textPrompt = buildProductCopyPrompt(normalizedRequest.event, normalizedRequest.guidance, product);
    const textResult = await tracker.measure("planning", () =>
      provider === "openai"
        ? studioGenerationDeps.generateStudioLiveCardWithOpenAi(textPrompt)
        : studioGenerationDeps.generateStudioLiveCardWithGemini(textPrompt));
    warnings.push(...textResult.warnings);
    if (textResult.ok) {
      liveCard = applyVerifiedCopy(normalizedRequest.event, sanitizeStudioLiveCardVisibleCopy(normalizedRequest.event, textResult.liveCard));
      const explicitPalette = requestedStudioPalette(normalizedRequest.guidance?.colorPalette);
      if (explicitPalette) liveCard.palette = explicitPalette;
      liveCard.creativePlan = validateCreativePlan(normalizedRequest.event, product, liveCard.creativePlan);
      invitation = liveCard.invitation;
    } else {
      errors.text = textResult.error;
      warnings.push("Invitation text generation failed.");
    }
  }

  if (wantsImage) {
    artworkContract = compileArtworkContract(normalizedRequest.event, product, liveCard);
    diagnostics.contractId = artworkContract.id;
    const editingExistingImage = Boolean(normalizedRequest.imageEdit?.sourceImageDataUrl);
    const orderedReferenceImageUrls = editingExistingImage
      ? undefined
      : getOrderedStudioReferenceImageUrls(normalizedRequest.event);
    const requestedRefCount = orderedReferenceImageUrls?.length ?? 0;
    const referenceImages = await tracker.measure("preparing", () =>
      studioGenerationDeps.resolveStudioReferenceImages(orderedReferenceImageUrls));
    if (requestedRefCount > 0 && referenceImages.length !== requestedRefCount) {
      errors.image = buildReferenceImageError(provider);
    } else {
      const artworkPrompt = buildProductArtworkPrompt(normalizedRequest.event, normalizedRequest.guidance, liveCard, product, referenceImages.length);
      const imagePrompt = editingExistingImage
        ? product === "live_card"
          ? [buildExistingInvitationImageEditPrompt(normalizedRequest.imageEdit?.editInstruction), `Required approved artwork lines must be present even if missing in the source: ${JSON.stringify(artworkContract.requiredText)}. Content contract: ${artworkContract.id}.`].join("\n")
          : product === "event_page"
            ? ["Edit the supplied text-free event-page hero. Only apply these image changes; page typography is rendered separately.", normalizedRequest.imageEdit?.editInstruction, artworkPrompt].filter(Boolean).join("\n")
          : ["Edit the complete supplied invitation. Update lettering to the current approved wording, preserving the design and unrelated artwork. Apply the requested visual changes.", normalizedRequest.imageEdit?.editInstruction, artworkPrompt].filter(Boolean).join("\n")
        : artworkPrompt;
      if (artworkContract.blockedIssues.length || imagePrompt.length > STUDIO_ARTWORK_PROMPT_MAX_CHARACTERS) {
        if (imagePrompt.length > STUDIO_ARTWORK_PROMPT_MAX_CHARACTERS) artworkContract.blockedIssues.push("artwork_prompt_too_long");
        diagnostics.outcome = "contract_blocked";
        return { ok: false, mode, product, liveCard, invitation, imageDataUrl: null, warnings: [], artworkContract, diagnostics,
          errors: { image: { code: "invalid_artwork_contract", message: artworkContractConflictMessage(artworkContract.blockedIssues), retryable: false, provider } }, timings: tracker.finish() };
      }
      const imageResult = await tracker.measure("generating", async () => editingExistingImage
        ? provider === "openai"
          ? await studioGenerationDeps.editInvitationImageWithOpenAi(
              imagePrompt,
              normalizedRequest.imageEdit!.sourceImageDataUrl,
              undefined,
              imageOptions,
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
              imageOptions,
            )
          : await studioGenerationDeps.generateInvitationImageWithGemini(
              imagePrompt,
              referenceImages.length > 0 ? referenceImages : undefined,
              product,
            ));
      warnings.push(...imageResult.warnings);
      if (imageResult.ok) {
        let artwork = imageResult.imageDataUrl;
        const checkContext = { imageEdit: normalizedRequest.imageEdit, references: referenceImages, liveCard, guidance: normalizedRequest.guidance };
        const checkCandidate = async (candidate: string): Promise<ArtworkCheck> => {
          const geometry = await studioGenerationDeps.validateStudioImageGeometry(candidate, expectedGeometry);
          options.signal?.throwIfAborted();
          if (!geometry.ok) return { status: "failed", issues: [geometry.issue], repairInstructions: [geometry.message] };
          tracker.preview(candidate, false);
          return tracker.measure("checking", () => studioGenerationDeps.verifyStudioArtwork(candidate, normalizedRequest.event, product, checkContext));
        };
        let checked: ArtworkCheck = await checkCandidate(artwork);
        const recordCheck = (attempt: "initial" | "repair", check: ArtworkCheck) => diagnostics.checks.push({
          attempt, status: check.status, issues: check.issues.slice(0, 24),
          repairInstructions: (check.repairInstructions || []).slice(0, 24).map((line) => line.slice(0, 1200)),
          ...(check.unavailableReason ? { unavailableReason: check.unavailableReason } : {}),
        });
        recordCheck("initial", checked);
        if (checked.status === "failed" && !checked.issues.includes("invalid_image") && !isLayoutReview(checked, product)) {
          const repairPrompt = [
            imagePrompt,
            `Targeted quality repair: ${checked.issues.join(", ")}.`,
            ...(checked.repairInstructions || []),
            editingExistingImage
              ? "The attached image is the original approved card. Apply the requested edit again, avoiding the defects observed in the previous attempt as described above. Preserve original wording unless its change was requested."
              : "Fix only these observed defects, retaining the approved facts, subject and design.",
          ].join("\n");
          const repairSource = normalizedRequest.imageEdit?.sourceImageDataUrl || artwork;
          if (repairPrompt.length > STUDIO_ARTWORK_PROMPT_MAX_CHARACTERS) {
            artworkContract.blockedIssues.push("artwork_prompt_too_long");
            diagnostics.outcome = "contract_blocked";
            return { ok: false, mode, product, liveCard, invitation, imageDataUrl: null, warnings: [], artworkContract, diagnostics,
              errors: { image: { code: "invalid_artwork_contract", message: artworkContractConflictMessage(artworkContract.blockedIssues), retryable: false, provider } }, timings: tracker.finish() };
          }
          const repaired = await tracker.measure("repairing", () => provider === "openai"
            ? studioGenerationDeps.editInvitationImageWithOpenAi(repairPrompt, repairSource, undefined, imageOptions)
            : studioGenerationDeps.editInvitationImageWithGemini(repairPrompt, repairSource));
          if (repaired.ok) {
            artwork = repaired.imageDataUrl;
            checked = await checkCandidate(artwork);
            recordCheck("repair", checked);
            // A failed image cannot be accepted merely because the repair verifier timed out.
            if (checked.status === "unavailable") checked = { status: "failed", issues: ["repair_unverified"] };
          }
        }
        const layoutReview = isLayoutReview(checked, product);
        qualityCheck = layoutReview ? "needs_review" : checked.status;
        diagnostics.outcome = layoutReview ? "needs_review" : checked.status === "passed" ? "accepted" : checked.status === "unavailable" ? "unverified" : "rejected";
        if (layoutReview) warnings.push("Preview ready. Check the artwork framing before saving.");
        if (checked.status === "failed" && !layoutReview) {
          errors.image = { code: "image_quality_failed", message: checked.issues.includes("invalid_image") ? "The generated image could not be decoded. Retry generation; your previously accepted image is unchanged." : artworkFailureMessage(checked, editingExistingImage), provider, retryable: true };
        } else {
          if (checked.status === "unavailable") warnings.push("Automatic artwork verification was unavailable; review the preview before sharing.");
          try {
            imageDataUrl = await tracker.measure("exporting", () => studioGenerationDeps.composeFlyerExport(artwork, normalizedRequest.event, liveCard, product));
          } catch (error) {
            diagnostics.outcome = "provider_failed";
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
    artworkContract,
    diagnostics,
    artworkTextMode: !request.imageEdit ? productContract(product).imageText : undefined,
    liveCard,
    invitation,
    imageDataUrl,
    themeNormalization,
    warnings: uniqueWarnings(warnings),
    errors: hasErrors ? errors : undefined,
    timings: tracker.finish(),
  };
}

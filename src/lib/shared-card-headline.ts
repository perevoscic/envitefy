import { prepareIntegratedLettering } from "./card-integrated-lettering";
import sharp from "sharp";
import type { LiveCardForm } from "./livecard-builder";
import { LiveCardGenerationFailure, recordLiveCardGeneration } from "./livecard-generation-failure";
import { encodeScanArtworkWebp } from "./ocr/artwork-webp";
import { hasGeneratedCardHeadlineForForm, type SharedCardDesign } from "./shared-card-design";
import { renderCardFontLettering } from "./card-font-lettering";
import { verifyStudioArtwork } from "./studio/output-checks";
import { resolveStudioReferenceImages } from "./studio/reference-image-url";

export const headlineGenerationDeps = {
  render: renderCardFontLettering,
  references: resolveStudioReferenceImages,
  verify: verifyStudioArtwork,
  encode: encodeScanArtworkWebp,
};

/** New backgrounds stay in memory until an explicit save; do not fetch or upload data URLs. */
export async function resolveHeadlineBackground(backgroundUrl: string, signal?: AbortSignal) {
  if (!backgroundUrl.startsWith("data:"))
    return headlineGenerationDeps.references([backgroundUrl], signal);
  const maxBytes = 12 * 1024 * 1024;
  if (backgroundUrl.length > Math.ceil(maxBytes / 3) * 4 + 32) return [];
  const match = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(backgroundUrl);
  if (!match) return [];
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > maxBytes) return [];
  try {
    const metadata = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
    if (metadata.format !== match[1] || !metadata.width || !metadata.height) return [];
    return [{ mimeType: `image/${match[1]}`, data: bytes.toString("base64") }];
  } catch {
    return [];
  }
}

export async function generateCardHeadline(
  form: LiveCardForm,
  design: SharedCardDesign,
  signal?: AbortSignal,
  onStage?: (stage: "lettering" | "checking") => void | Promise<void>,
  verificationOnly = false,
  requestContext?: { jobId: string; revision: string; attempt: number },
): Promise<NonNullable<SharedCardDesign["headline"]>> {
  signal?.throwIfAborted();
  const integrated = design.composition === "integrated-v1";
  const references = await resolveHeadlineBackground(integrated ? design.headline?.imageUrl || design.backgroundUrl : design.backgroundUrl, signal);
  if (!references.length) throw new LiveCardGenerationFailure("The background could not be opened. Please try again.", "lettering", "invalid_artwork");
  const backgroundMetadata = await sharp(Buffer.from(references[0].data, "base64")).metadata();
  if (!backgroundMetadata.width || !backgroundMetadata.height || Math.abs(backgroundMetadata.width / backgroundMetadata.height - 2 / 3) > 0.01)
    throw new LiveCardGenerationFailure("The saved background does not fit a 2:3 card.", "lettering", "invalid_artwork");
  if (integrated) {
    await onStage?.("checking");
    return prepareIntegratedLettering(form, design, references[0], signal, verificationOnly, requestContext?.attempt || 1, requestContext);
  }
  let letteringReferences: Awaited<ReturnType<typeof resolveHeadlineBackground>> = [];
  const checkCandidate = (imageDataUrl: string) => headlineGenerationDeps.verify(
    imageDataUrl,
    {
      title: form.title.trim(),
      category: form.eventType,
      requiredArtworkLines: form.headlineIntro.trim() ? [form.headlineIntro.trim()] : [],
      userIdea: "Check the exact supplied wording and readability. Typography is composed locally over the unchanged background.",
    },
    "live_card",
    { references: letteringReferences, letteringOnly: true, layeredLettering: true, signal },
  );
  const encodeCandidate = async (imageDataUrl: string) => {
    const original = Buffer.from(
      imageDataUrl.slice(imageDataUrl.indexOf(",") + 1),
      "base64",
    );
    const metadata = await sharp(original).metadata().catch(() => {
      throw new LiveCardGenerationFailure("The title artwork could not be read. Please retry.", "lettering", "invalid_artwork");
    });
    if (
      !metadata.width ||
      !metadata.height ||
      Math.abs(metadata.width / metadata.height - 2 / 3) > 0.01
    )
      throw new LiveCardGenerationFailure("The title artwork did not fit your card. Please try again.", "lettering", "invalid_artwork");
    const webp = await headlineGenerationDeps.encode(original).catch(() => {
      throw new LiveCardGenerationFailure("The title artwork could not be prepared. Please retry.", "lettering", "invalid_artwork");
    });
    signal?.throwIfAborted();
    return webp;
  };
  const startedAt = Date.now();
  let composition: Awaited<ReturnType<typeof renderCardFontLettering>> | null = null;
  let webp: Buffer;
  let check: NonNullable<NonNullable<SharedCardDesign["headline"]>["validation"]>;
  try {
    const existing = design.headline;
    if (verificationOnly) {
      if (!existing || !hasGeneratedCardHeadlineForForm(form, design))
        throw new LiveCardGenerationFailure("There is no matching lettering to verify. Update card text first.", "lettering", "invalid_artwork");
      await onStage?.("checking");
      const saved = await resolveHeadlineBackground(existing.imageUrl, signal);
      if (!saved.length) throw new LiveCardGenerationFailure("The saved title could not be opened.", "lettering", "invalid_artwork");
      webp = await encodeCandidate(`data:${saved[0].mimeType};base64,${saved[0].data}`);
      letteringReferences = existing.layerUrl ? await resolveHeadlineBackground(existing.layerUrl, signal) : [];
      // Deterministic font lettering already has measured fit and contrast. Legacy
      // artwork keeps its same-image verification path without any image generation.
      check = existing.renderer === "font-v1" ? existing.validation || { status: "passed", issues: [] }
        : await checkCandidate(`data:image/webp;base64,${webp.toString("base64")}`);
    } else {
      await onStage?.("lettering");
      signal?.throwIfAborted();
      const material = design.letteringStyle?.textureUrl
        ? await resolveHeadlineBackground(design.letteringStyle.textureUrl, signal) : [];
      if (design.letteringStyle?.textureUrl && !material.length)
        throw new Error("The saved decorative material could not be opened. Please retry.");
      signal?.throwIfAborted();
      composition = await headlineGenerationDeps.render(Buffer.from(references[0].data, "base64"), form, design,
        material[0] ? Buffer.from(material[0].data, "base64") : undefined);
      signal?.throwIfAborted();
      await onStage?.("checking");
      webp = composition.composite;
      check = { status: "passed", issues: [] };
    }
    recordLiveCardGeneration({ stage: "lettering", startedAt, attempt: requestContext?.attempt || 1,
      outcome: check.status === "unavailable" ? "verification_unavailable" : "success", issues: check.issues });
  } catch (error) {
    recordLiveCardGeneration({ stage: "lettering", startedAt, attempt: requestContext?.attempt || 1,
      outcome: signal?.aborted ? "cancelled" : "invalid_artwork", issues: [] });
    if (signal?.aborted || error instanceof LiveCardGenerationFailure) throw error;
    throw new LiveCardGenerationFailure(error instanceof Error ? error.message : "The title could not be prepared.", "lettering", "invalid_artwork");
  }
  signal?.throwIfAborted();
  return {
    imageUrl: verificationOnly ? design.headline!.imageUrl : `data:image/webp;base64,${webp.toString("base64")}`,
    title: form.title.trim(),
    intro: form.headlineIntro.trim(),
    validation: check,
    ...(verificationOnly ? design.headline?.renderer ? { renderer: design.headline.renderer } : {} : { renderer: "font-v1" as const }),
    ...(composition ? { layerUrl: `data:image/webp;base64,${composition.layer.toString("base64")}`, layout: composition.layout }
      : { layerUrl: design.headline?.layerUrl, layout: design.headline?.layout }),
  };
}

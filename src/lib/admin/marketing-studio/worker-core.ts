import { StudioProviderError } from "./provider-errors.ts";
import type { StudioCreativeInput, StudioImageRequest, StudioImageResponse, StudioMediaInput, StudioVideoRequest, StudioVideoResponse } from "./providers.ts";
import type { StudioFinishedMedia } from "./media.ts";
import type { StudioAsset, StudioConversation, StudioResult, StudioSettings, StudioVersion, StudioVersionPatch } from "./types.ts";

export type StudioWorkerDependencies = {
  getVersion(id: string): Promise<StudioVersion | null>;
  getConversation(id: string): Promise<StudioConversation | null>;
  claimVersion(id: string): Promise<{ version: StudioVersion; leaseToken: string } | null>;
  updateClaimedVersion(id: string, token: string, patch: StudioVersionPatch, release?: boolean): Promise<boolean>;
  readAsset(id: string): Promise<{ asset: StudioAsset; bytes: Buffer } | null>;
  saveAsset(input: { conversationId: string; versionId: string | null; name: string; mimeType: string; bytes: Buffer }): Promise<StudioAsset>;
  developIdea(input: StudioCreativeInput): Promise<StudioResult>;
  generateImage(input: StudioImageRequest): Promise<StudioImageResponse>;
  submitVideo(input: StudioVideoRequest): Promise<StudioVideoResponse>;
  pollVideo(id: string): Promise<StudioVideoResponse>;
  downloadVideo(uri: string): Promise<Buffer | null>;
  finishImage(bytes: Buffer, settings: StudioSettings): Promise<StudioFinishedMedia>;
  finishVideo(bytes: Buffer, settings: StudioSettings): Promise<StudioFinishedMedia>;
  now?(): number;
};

class LeaseLost extends Error {}
const NEXT_POLL_MS = 15_000;

export async function runStudioVersion(id: string, dependencies: StudioWorkerDependencies): Promise<void> {
  const claim = await dependencies.claimVersion(id);
  if (!claim) return;
  let version = claim.version;
  const now = dependencies.now || Date.now;
  async function update(patch: StudioVersionPatch, release = false): Promise<void> {
    if (!await dependencies.updateClaimedVersion(id, claim!.leaseToken, patch, release)) throw new LeaseLost();
    version = { ...version, ...patch };
  }
  async function save(bytes: Buffer, name: string, mimeType: string): Promise<StudioAsset> {
    return dependencies.saveAsset({ conversationId: version.conversationId, versionId: id, bytes, name, mimeType });
  }
  async function read(id: string): Promise<StudioMediaInput> {
    const result = await dependencies.readAsset(id);
    if (!result || result.asset.conversationId !== version.conversationId) throw new StudioProviderError("A reference is no longer available. Remove it or upload it again before creating another version.", "rejected");
    return { bytes: result.bytes, mimeType: result.asset.mimeType, name: result.asset.name };
  }
  async function acceptVideo(response: StudioVideoResponse): Promise<void> {
    // Commit the interaction ID BEFORE any media IO so a download failure can be resumed.
    await update({ provider: { ...version.provider, interactionId: response.id, model: response.model, ...(response.videoUri ? { videoUri: response.videoUri } : {}), attempts: 0 }, status: response.status === "completed" ? "finalizing" : "running", error: null });
    if (response.status === "failed") throw new StudioProviderError(response.error || "Google could not complete this video. Revise the idea and create a new version.", "rejected");
    if (response.videoBytes) {
      const asset = await save(response.videoBytes, "original.mp4", "video/mp4");
      await update({ status: "finalizing", result: { ...requireResult(), rawAssetId: asset.id } });
    }
  }
  function requireResult(): StudioResult {
    if (!version.result) throw new StudioProviderError("This version has no saved prompt. Create a new version from your idea.", "rejected");
    return version.result;
  }
  try {
    if (["queued", "developing"].includes(version.status)) {
      const parent = version.parentVersionId ? await dependencies.getVersion(version.parentVersionId) : null;
      if (version.parentVersionId && (!parent || parent.conversationId !== version.conversationId)) throw new StudioProviderError("The selected version is unavailable. Select another version before trying again.", "rejected");
      const conversation = await dependencies.getConversation(version.conversationId);
      if (!conversation) throw new StudioProviderError("This creation is no longer available.", "rejected");
      await update({ status: "developing", error: null });
      if (!version.result) {
        // A manually edited prompt is an immutable instruction, including its whitespace.
        const result = version.input.promptOverride !== undefined
          ? { prompt: version.input.promptOverride, direction: "Your edited prompt, saved as a new version.", caption: parent?.result?.caption || "", headline: parent?.result?.headline || "" }
          : await dependencies.developIdea({ version, parent, conversation });
        await update({ result });
      }
      if (version.output === "prompt") { await update({ status: "ready", nextPollAt: null }, true); return; }

      // All local validation and asset loading occurs before the non-repeatable submission.
      const referenceIds = [...version.input.referenceAssetIds];
      if (parent?.output === "image" && parent.result?.rawAssetId) referenceIds.unshift(parent.result.rawAssetId);
      const references = await Promise.all([...new Set(referenceIds)].map(read));
      if (references.some(reference => !reference.mimeType.startsWith("image/"))) throw new StudioProviderError("Choose image files for the visual references.", "rejected");
      const request: StudioImageRequest = { prompt: requireResult().prompt, format: version.input.settings.format, references };
      await update({ status: "submitting" });
      if (version.output === "image") {
        const image = await dependencies.generateImage(request);
        // Any failure before this raw asset is committed is ambiguous: never regenerate it automatically.
        const raw = await save(image.bytes, "original.png", image.mimeType);
        await update({ status: "finalizing", provider: { model: image.model, attempts: 0 }, result: { ...requireResult(), rawAssetId: raw.id } });
      } else {
        const previousInteractionId = parent?.output === "video" ? parent.provider.interactionId : undefined;
        try { await acceptVideo(await dependencies.submitVideo({ ...request, ...(previousInteractionId ? { previousInteractionId } : {}) })); }
        catch (error) {
          if (!(error instanceof StudioProviderError) || error.outcome !== "expired_context" || !previousInteractionId || !parent?.result?.rawAssetId || version.provider.interactionId) throw error;
          if ((parent.result.durationSec || 0) > 10.1) throw new StudioProviderError("Google's editing context expired and this clip is longer than the upload editing limit. Start a new video from an image or a shorter clip.", "rejected");
          const restoredVideo = await read(parent.result.rawAssetId);
          await update({ provider: { ...version.provider, usedRestoredContext: true } });
          // Safe only after an explicit expired-context rejection; never after timeouts or 5xx responses.
          try { await acceptVideo(await dependencies.submitVideo({ ...request, restoredVideo })); }
          catch (restorationError) {
            if (restorationError instanceof StudioProviderError && restorationError.outcome === "rejected") throw new StudioProviderError(`${restorationError.message} Restoring uploaded clips may be unavailable in your region. Start a new video from a reference image.`, "rejected");
            throw restorationError;
          }
        }
      }
    }
    if (version.status === "running") {
      if (!version.provider.interactionId) throw new StudioProviderError("The video interaction ID is missing. Check provider usage before starting another version.", "ambiguous");
      await acceptVideo(await dependencies.pollVideo(version.provider.interactionId));
      if (version.status === "running") { await update({ nextPollAt: new Date(now() + NEXT_POLL_MS).toISOString() }, true); return; }
    }
    if (version.status === "finalizing") {
      if (!version.result?.rawAssetId && version.output === "video") {
        if (version.provider.videoUri) {
          let bytes: Buffer | null;
          try { bytes = await dependencies.downloadVideo(version.provider.videoUri); }
          catch (error) {
            if (!(error instanceof StudioProviderError) || ![404, 410].includes(error.httpStatus || 0) || !version.provider.interactionId) throw error;
            // File URIs can expire independently of stored interactions. Recover the SAME result.
            await update({ provider: { ...version.provider, videoUri: undefined } });
            await acceptVideo(await dependencies.pollVideo(version.provider.interactionId));
            if (!version.result?.rawAssetId) { await update({ nextPollAt: new Date(now() + NEXT_POLL_MS).toISOString() }, true); return; }
            bytes = null;
          }
          if (!bytes && !version.result?.rawAssetId) { await update({ nextPollAt: new Date(now() + NEXT_POLL_MS).toISOString() }, true); return; }
          if (bytes) {
            const raw = await save(bytes, "original.mp4", "video/mp4");
            await update({ result: { ...requireResult(), rawAssetId: raw.id } });
          }
        } else if (version.provider.interactionId) {
          await acceptVideo(await dependencies.pollVideo(version.provider.interactionId));
          if (!version.result?.rawAssetId) { await update({ nextPollAt: new Date(now() + NEXT_POLL_MS).toISOString() }, true); return; }
        }
      }
      const rawId = requireResult().rawAssetId;
      if (!rawId) throw new StudioProviderError("Generated media is unavailable. Check generation details before creating another version.", "rejected");
      const raw = await read(rawId);
      const media = version.output === "video" ? await dependencies.finishVideo(raw.bytes, version.input.settings) : await dependencies.finishImage(raw.bytes, version.input.settings);
      const mimeType = version.output === "video" ? "video/mp4" : "image/png";
      const asset = await save(media.bytes, version.output === "video" ? "content.mp4" : "content.png", mimeType);
      await update({ status: "ready", result: { ...requireResult(), assetId: asset.id, mimeType, width: media.width, height: media.height, ...(media.durationSec !== undefined ? { durationSec: media.durationSec } : {}) }, provider: { ...version.provider, attempts: 0 }, error: null, nextPollAt: null }, true);
    }
  } catch (error) {
    if (error instanceof LeaseLost) return;
    const message = error instanceof Error ? error.message.slice(0, 1_500) : "Generation was interrupted. Retry this version.";
    const providerError = error instanceof StudioProviderError ? error : null;
    const ambiguous = providerError?.outcome === "ambiguous" || version.status === "submitting" && !providerError;
    const recoverable = !ambiguous && ["running", "finalizing"].includes(version.status) && providerError?.outcome !== "rejected";
    const attempts = (version.provider.attempts || 0) + 1;
    try {
      if (recoverable && attempts <= 8) {
        await update({ error: message, provider: { ...version.provider, attempts }, nextPollAt: new Date(now() + Math.min(300_000, 15_000 * 2 ** attempts)).toISOString() }, true);
      } else {
        await update({ status: ambiguous ? "submission_unknown" : "failed", error: message, nextPollAt: null }, true);
      }
    } catch (persistenceError) {
      if (!(persistenceError instanceof LeaseLost)) throw persistenceError;
    }
  }
}

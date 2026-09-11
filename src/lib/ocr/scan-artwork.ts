import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { query } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { uploadPublicBinaryAsset } from "@/lib/media-upload";
import { normalizeScanPersonalization } from "./personalization";
import type { ScanArtworkState } from "./scan-artwork-state";
import { resolveScanMediaPolicy } from "./scan-media";
import {
  renderScanArtwork,
  ScanArtworkRenderError,
  type ScanArtworkImages,
} from "./scan-artwork-render";
import { verifyScanArtworkTicket } from "./scan-artwork-ticket";

/** Reserve an ID in memory only. The caller creates its row only on explicit save. */
export function adoptEarlyScanArtwork(
  data: Record<string, unknown>,
  userId: string,
  ticket: unknown,
): string | undefined {
  const profile = normalizeScanPersonalization(data.scanPersonalization);
  if (!profile || data.scanHeroMode !== "generated") return undefined;
  const claim = verifyScanArtworkTicket(ticket, userId, profile);
  if (!claim) return undefined;
  data.scanArtwork = {
    version: 1,
    status: "generating",
    token: claim.token,
    updatedAt: new Date().toISOString(),
    earlyExpiresAt: new Date(claim.expiresAt).toISOString(),
  };
  return claim.eventId;
}

export async function finishClaimedScanArtwork(
  eventId: string,
  userId: string,
  token: string,
  images: ScanArtworkImages | null,
): Promise<void> {
  let state: ScanArtworkState = {
    version: 1,
    status: "failed",
    updatedAt: new Date().toISOString(),
  };
  if (images) {
    try {
      const upload = (bytes: Buffer, suffix: string) =>
        uploadPublicBinaryAsset({
          pathname: `event-media/${eventId}/scan-artwork/${token}${suffix}.webp`,
          bytes,
          contentType: "image/webp",
        });
      const [background, hero] = await Promise.all([
        upload(images.background, ""),
        images.hero ? upload(images.hero, "-hero") : Promise.resolve(null),
      ]);
      state = {
        version: 1,
        status: "ready",
        imageUrl: background.url,
        ...(hero ? { heroImageUrl: hero.url } : {}),
        updatedAt: new Date().toISOString(),
      };
    } catch {
      console.error("[scan-artwork] upload failed", { eventId });
    }
  }
  await query(
    `UPDATE event_history SET data = jsonb_set(data, '{scanArtwork}', $3::jsonb)
     WHERE id = $1 AND user_id = $2 AND data->'scanArtwork'->>'token' = $4`,
    [eventId, userId, JSON.stringify(state), token],
  );
  invalidateUserHistory(userId);
  invalidateUserDashboard(userId);
  revalidatePath("/event/[id]", "page");
}

export function prepareSavedScanArtwork(data: Record<string, unknown>): boolean {
  if (!/^ocr(?:-|$)/.test(String(data.createdVia || "")) && data.createdVia !== "scan-event-page")
    return false;
  const profile = normalizeScanPersonalization(data.scanPersonalization);
  if (!profile) return false;
  data.scanPersonalization = profile;
  const policy = resolveScanMediaPolicy(data, String(data.title || ""));
  data.scanSourceKind = policy?.sourceKind || "unknown";
  data.scanHeroMode = policy?.heroMode || "original";
  if (data.scanHeroMode !== "generated") {
    delete data.scanArtwork;
    return false;
  }
  // Client input cannot choose an image-generation state or a prompt.
  data.scanArtwork = {
    version: 1,
    status: "pending",
    updatedAt: new Date().toISOString(),
  } satisfies ScanArtworkState;
  return true;
}

/** Claim a single saved event atomically; simultaneous saves/retries cannot duplicate generation. */
export async function generateSavedScanArtwork(
  eventId: string,
  userId: string,
  retry = false,
): Promise<void> {
  const token = randomUUID();
  const claimed = await query<{ data: Record<string, unknown> }>(
    `UPDATE event_history SET data = jsonb_set(data, '{scanArtwork}', $3::jsonb)
     WHERE id = $1 AND user_id = $2 AND (data->>'createdVia' LIKE 'ocr%' OR data->>'createdVia' = 'scan-event-page')
       AND data->'scanPersonalization'->>'version' = '1'
       AND (data->'scanArtwork'->>'status' = 'pending'
         OR ($4 AND data->'scanArtwork'->>'status' = 'failed')
         OR ($4 AND data->'scanArtwork'->>'status' = 'generating'
             AND (data->'scanArtwork'->>'updatedAt' < $5
               OR data->'scanArtwork'->>'earlyExpiresAt' < $6)))
     RETURNING data`,
    [
      eventId,
      userId,
      JSON.stringify({
        version: 1,
        status: "generating",
        token,
        updatedAt: new Date().toISOString(),
      }),
      retry,
      new Date(Date.now() - 330_000).toISOString(),
      new Date().toISOString(),
    ],
  );
  const data = claimed.rows[0]?.data;
  if (!data) return;
  const profile = normalizeScanPersonalization(data.scanPersonalization);
  const startedAt = Date.now();
  let images: ScanArtworkImages | null = null;
  try {
    if (!profile) throw new ScanArtworkRenderError("context");
    const policy = resolveScanMediaPolicy(data, String(data.title || ""));
    images = await renderScanArtwork(profile, token, undefined, policy?.heroMode !== "original");
  } catch (error) {
    // Log no source text, patient details, model prompt or provider response.
    console.error("[scan-artwork] generation failed", {
      eventId,
      stage: error instanceof ScanArtworkRenderError ? error.stage : "generation",
      durationMs: Date.now() - startedAt,
      ...(error instanceof ScanArtworkRenderError && error.providerStatus
        ? { providerStatus: error.providerStatus }
        : {}),
    });
  }
  await finishClaimedScanArtwork(eventId, userId, token, images);
}

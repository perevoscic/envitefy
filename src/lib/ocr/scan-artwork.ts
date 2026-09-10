import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { query } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { uploadPublicBinaryAsset } from "@/lib/media-upload";
import { generateInvitationImageWithOpenAi } from "@/lib/studio/openai";
import { encodeScanArtworkWebp } from "./artwork-webp";
import {
  buildScanArtworkPrompt,
  buildScanHeroPrompt,
  normalizeScanPersonalization,
} from "./personalization";
import type { ScanArtworkState } from "./scan-artwork-state";
import { resolveScanMediaPolicy } from "./scan-media";

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
             AND data->'scanArtwork'->>'updatedAt' < $5))
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
    ],
  );
  const data = claimed.rows[0]?.data;
  if (!data) return;
  const profile = normalizeScanPersonalization(data.scanPersonalization);
  const startedAt = Date.now();
  let stage = "context";
  let providerStatus: number | undefined;
  let state: ScanArtworkState = {
    version: 1,
    status: "failed",
    updatedAt: new Date().toISOString(),
  };
  try {
    if (!profile) throw new Error("Missing scan context");
    stage = "generation";
    const prompt = buildScanArtworkPrompt(profile, token);
    const options = { signal: AbortSignal.timeout(120_000) };
    const [result, heroResult] = await Promise.all([
      generateInvitationImageWithOpenAi(prompt, undefined, "event_page", options),
      generateInvitationImageWithOpenAi(
        buildScanHeroPrompt(profile, token),
        undefined,
        "event_page",
        { ...options, size: "1024x1536" },
      ),
    ]);
    if (!result.ok || !heroResult.ok) {
      providerStatus = !result.ok ? result.error?.status : !heroResult.ok ? heroResult.error?.status : undefined;
      throw new Error("Artwork generation failed");
    }
    stage = "background-payload";
    const base64 = result.imageDataUrl.match(
      /^data:image\/(?:png|jpeg|webp);base64,([\s\S]+)$/,
    )?.[1];
    if (!base64) throw new Error("Invalid artwork payload");
    stage = "background-conversion";
    const webp = await encodeScanArtworkWebp(Buffer.from(base64, "base64"));
    stage = "background-upload";
    const uploaded = await uploadPublicBinaryAsset({
      pathname: `event-media/${eventId}/scan-artwork/${token}.webp`,
      bytes: webp,
      contentType: "image/webp",
    });
    stage = "hero-payload";
    const heroBase64 = heroResult.imageDataUrl.match(/^data:image\/(?:png|jpeg|webp);base64,([\s\S]+)$/)?.[1];
    if (!heroBase64) throw new Error("Hero generation failed");
    stage = "hero-conversion";
    const heroWebp = await encodeScanArtworkWebp(Buffer.from(heroBase64, "base64"));
    stage = "hero-upload";
    const heroUpload = await uploadPublicBinaryAsset({
      pathname: `event-media/${eventId}/scan-artwork/${token}-hero.webp`,
      bytes: heroWebp,
      contentType: "image/webp",
    });
    state = {
      version: 1,
      status: "ready",
      imageUrl: uploaded.url,
      heroImageUrl: heroUpload.url,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    // Log no source text, patient details, model prompt or provider response.
    console.error("[scan-artwork] generation failed", {
      eventId,
      stage,
      durationMs: Date.now() - startedAt,
      ...(providerStatus ? { providerStatus } : {}),
    });
  }
  state.updatedAt = new Date().toISOString();
  await query(
    `UPDATE event_history SET data = jsonb_set(data, '{scanArtwork}', $3::jsonb)
     WHERE id = $1 AND user_id = $2 AND data->'scanArtwork'->>'token' = $4`,
    [eventId, userId, JSON.stringify(state), token],
  );
  invalidateUserHistory(userId);
  invalidateUserDashboard(userId);
  revalidatePath("/event/[id]", "page");
}

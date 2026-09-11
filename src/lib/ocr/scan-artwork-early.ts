import { setTimeout as delay } from "node:timers/promises";
import { query } from "@/lib/db";
import { normalizeScanPersonalization, type ScanPersonalization } from "./personalization";
import { finishClaimedScanArtwork } from "./scan-artwork";
import {
  renderScanArtwork,
  ScanArtworkRenderError,
  type ScanArtworkImages,
} from "./scan-artwork-render";
import {
  createScanArtworkTicket,
  scanArtworkBriefKey,
  type ScanArtworkTicket,
} from "./scan-artwork-ticket";
import { resolveScanMediaPolicy } from "./scan-media";

export type EarlyScanArtwork = { ticket: string; done: Promise<void>; cancel: () => void };
type ActiveArtwork = { key: string; work: EarlyScanArtwork };
const active = new Map<string, ActiveArtwork>();

/** No event row or upload exists until an explicit save redeems the signed ticket. */
async function generateUntilSaved(
  claim: ScanArtworkTicket,
  profile: ScanPersonalization,
  signal: AbortSignal,
): Promise<void> {
  let images: ScanArtworkImages | null = null;
  try {
    images = await renderScanArtwork(
      profile,
      claim.token,
      AbortSignal.any([signal, AbortSignal.timeout(120_000)]),
    );
    // Bound retained bytes while waiting for an explicit save.
    if (images.background.length + (images.hero?.length || 0) > 16 * 1024 * 1024) images = null;
  } catch (error) {
    if (!signal.aborted)
      console.error("[scan-artwork] early generation failed", {
        eventId: claim.eventId,
        stage: error instanceof ScanArtworkRenderError ? error.stage : "generation",
      });
    // Failure is isolated from OCR. A saved event receives the existing retry action.
  }
  while (!signal.aborted && Date.now() < claim.expiresAt) {
    const result = await query<{
      artwork: { token?: string; status?: string };
      profile: ScanPersonalization | null;
      hero_mode: string;
    }>(
      "SELECT data->'scanArtwork' AS artwork, data->'scanPersonalization' AS profile, data->>'scanHeroMode' AS hero_mode FROM event_history WHERE id = $1 AND user_id = $2",
      [claim.eventId, claim.userId],
    );
    const row = result.rows[0];
    if (row) {
      const artwork = row.artwork;
      const current = normalizeScanPersonalization(row.profile);
      if (artwork?.token !== claim.token || artwork.status !== "generating") return;
      const matches =
        current && scanArtworkBriefKey(current) === claim.brief && row.hero_mode === "generated";
      await finishClaimedScanArtwork(
        claim.eventId,
        claim.userId,
        claim.token,
        matches ? images : null,
      );
      return;
    }
    await delay(Math.min(3000, claim.expiresAt - Date.now()), undefined, { signal });
  }
}

export function startEarlyScanArtwork(params: {
  userId: string | null;
  scanAttemptId: string;
  title: string;
  sourceKind: string;
  profile: ScanPersonalization;
}): EarlyScanArtwork | null {
  if (
    !params.userId ||
    resolveScanMediaPolicy(
      {
        createdVia: "ocr",
        scanPersonalization: params.profile,
        scanSourceKind: params.sourceKind,
      },
      params.title,
    )?.heroMode !== "generated"
  )
    return null;
  // Ambiguous subjects wait for the final saved context. Do not speculate about identity/age.
  if (params.profile.subject === "event") return null;
  const key = `${params.scanAttemptId}:${scanArtworkBriefKey(params.profile)}`;
  const existing = active.get(params.userId);
  if (existing?.key === key) return existing.work;
  // At most one speculative pair per owner and four pairs per worker (64 MiB retained).
  if (existing || active.size >= 4) return null;
  const signed = createScanArtworkTicket(params.userId, params.profile);
  if (!signed) return null;
  const controller = new AbortController();
  const userId = params.userId;
  const work: EarlyScanArtwork = {
    ticket: signed.ticket,
    cancel: () => controller.abort(),
    done: generateUntilSaved(
      signed.claim,
      { ...params.profile, personFirstName: null },
      controller.signal,
    )
      .catch(() => {
        /* The saved claim remains retryable after an interrupted worker. */
      })
      .finally(() => {
        if (active.get(userId)?.work === work) active.delete(userId);
      }),
  };
  active.set(userId, { key, work });
  return work;
}

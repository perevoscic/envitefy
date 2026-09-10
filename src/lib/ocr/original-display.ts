import { randomUUID } from "node:crypto";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { query } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { uploadPublicBinaryAsset } from "@/lib/media-upload";
import { type ScanDisplayCopy, scanImageOriginal } from "./original-display-state";
import { encodeScanDisplayWebp } from "./original-display-webp";
import {
  decryptScanOriginal,
  encryptScanOriginal,
  readScanOriginalBytes,
} from "./private-original";

/** Background work with a durable claim; interrupted jobs may resume after five minutes. */
export async function generateSavedScanDisplay(eventId: string, userId: string): Promise<void> {
  const token = randomUUID();
  let sourceUrl: string | undefined;
  try {
    const claimed = await query<{ data: Record<string, unknown> }>(
      `UPDATE event_history SET data = jsonb_set(data, '{attachment,displayCopy}',
         $3::jsonb || jsonb_build_object('sourceUrl', data->'attachment'->>'dataUrl'))
       WHERE id = $1 AND user_id = $2
         AND data->'attachment'->>'type' IN ('image/jpeg', 'image/png', 'image/webp')
         AND (data->'attachment'->'displayCopy'->>'sourceUrl' IS DISTINCT FROM data->'attachment'->>'dataUrl'
           OR data->'attachment'->'displayCopy'->>'status' = 'pending'
           OR (data->'attachment'->'displayCopy'->>'status' IN ('generating', 'failed')
             AND data->'attachment'->'displayCopy'->>'updatedAt' < $4))
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
        new Date(Date.now() - 300_000).toISOString(),
      ],
    );
    const original = claimed.rows[0] && scanImageOriginal(claimed.rows[0].data);
    if (!original) return;
    sourceUrl = original.dataUrl;
    let bytes = await readScanOriginalBytes(sourceUrl);
    if (original.storageKind === "encrypted-blob") bytes = decryptScanOriginal(bytes, userId);
    const converted = await encodeScanDisplayWebp(bytes);
    let state: ScanDisplayCopy = {
      version: 1,
      status: "skipped",
      sourceUrl,
      updatedAt: new Date().toISOString(),
    };
    // A conversion must actually save bandwidth. The exact original is never replaced.
    if (converted.bytes.length < bytes.length) {
      const uploaded = await uploadPublicBinaryAsset({
        pathname: `private-scan-originals/${randomUUID()}-display.bin`,
        bytes: encryptScanOriginal(converted.bytes, userId),
        contentType: "application/octet-stream",
      });
      state = {
        ...state,
        status: "ready",
        dataUrl: uploaded.url,
        storageKind: "encrypted-blob",
        type: "image/webp",
        sizeBytes: converted.bytes.length,
        width: converted.width,
        height: converted.height,
      };
    }
    await finish(state);
  } catch {
    console.error("[scan-display] background conversion deferred", { eventId });
    if (sourceUrl) {
      try {
        await finish({
          version: 1,
          status: "failed",
          sourceUrl,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        /* A stale generating claim can be resumed by the next owner read. */
      }
    }
  }

  async function finish(state: ScanDisplayCopy) {
    await query(
      `UPDATE event_history SET data = jsonb_set(data, '{attachment,displayCopy}', $3::jsonb)
       WHERE id = $1 AND user_id = $2 AND data->'attachment'->'displayCopy'->>'token' = $4
         AND data->'attachment'->>'dataUrl' = $5`,
      [eventId, userId, JSON.stringify(state), token, sourceUrl],
    );
    invalidateUserHistory(userId);
    invalidateUserDashboard(userId);
  }
}

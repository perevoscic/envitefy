import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  decryptScanOriginal,
  readScanOriginalBytes,
  scanOriginalKeyId,
} from "@/lib/ocr/private-original";
import { withQueryRoute } from "@/lib/query-egress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const baseHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Event-Media-Version": "1",
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Medical source images remain encrypted in Blob and require the current owner. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; assetId: string }> },
) {
  return withQueryRoute("GET /api/events/:id/private-media/:assetId", async () => {
    let keyId: string;
    try {
      keyId = scanOriginalKeyId();
    } catch {
      return new Response("Private image storage unavailable", {
        status: 503,
        headers: baseHeaders,
      });
    }
    const headers = { ...baseHeaders, "X-Event-Media-Key-Id": keyId };
    const userId = await resolveSessionUserId(await getServerSession(authOptions));
    if (!userId) return new Response("Sign in required", { status: 401, headers });
    const { id, assetId } = await context.params;
    if (!uuid.test(id) || !uuid.test(assetId))
      return new Response("Not found", { status: 404, headers });
    // Fetch only one reference. The full event JSON never crosses the pooler here.
    const row = (
      await query<{ asset: { dataUrl?: string; type?: string; storageKind?: string } }>(
        "SELECT data->'privateMedia'->$3::text AS asset FROM event_history WHERE id=$1::uuid AND user_id=$2",
        [id, userId, assetId],
      )
    ).rows[0];
    const asset = row?.asset;
    if (
      !asset?.dataUrl ||
      asset.storageKind !== "encrypted-blob" ||
      !/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(asset.type || "")
    ) {
      return new Response("Not found", { status: 404, headers });
    }
    try {
      const bytes = decryptScanOriginal(await readScanOriginalBytes(asset.dataUrl), userId);
      return new Response(new Uint8Array(bytes), {
        headers: { ...headers, "Content-Type": asset.type!, "Content-Security-Policy": "sandbox" },
      });
    } catch {
      return new Response("Image unavailable", { status: 502, headers });
    }
  });
}

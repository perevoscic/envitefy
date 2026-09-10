import { after } from "next/server";
import { getServerSession } from "next-auth";
import sharp from "sharp";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryById } from "@/lib/db";
import { canReadEventDraft } from "@/lib/event-draft-access";
import { readyScanDisplayCopy, scanImageOriginal } from "@/lib/ocr/original-display-state";
import { decryptScanOriginal, readScanOriginalBytes } from "@/lib/ocr/private-original";
import { resolveScanMediaPolicy } from "@/lib/ocr/scan-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [row, userId] = await Promise.all([
    getEventHistoryById(id),
    getServerSession(authOptions).then(resolveSessionUserId),
  ]);
  if (!row) return new Response("Not found", { status: 404 });
  const owner = Boolean(userId && userId === row.user_id);
  const policy = resolveScanMediaPolicy(row.data, row.title);
  // Medical originals and passcode-protected source files require their owner.
  if (!owner && (policy?.medical || row.data?.accessControl?.requirePasscode))
    return new Response("Not found", { status: 404 });
  if (!canReadEventDraft(row.data, row.user_id, userId))
    return new Response("Not found", { status: 404 });
  const original = row.data?.attachment;
  if (!original || typeof original.dataUrl !== "string")
    return new Response("Original unavailable", { status: 404 });
  if (original.storageKind === "encrypted-blob" && !owner)
    return new Response("Not found", { status: 404 });
  const searchParams = new URL(request.url).searchParams;
  const download = searchParams.get("download") === "1";
  if (owner && !download && searchParams.get("display") === "1") {
    const imageOriginal = scanImageOriginal(row.data);
    const copy = imageOriginal && readyScanDisplayCopy(imageOriginal);
    if (copy?.dataUrl) {
      try {
        const bytes = decryptScanOriginal(
          await readScanOriginalBytes(copy.dataUrl),
          row.user_id || "",
        );
        return new Response(new Uint8Array(bytes), {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "X-Document-Variant": "display",
            "Content-Security-Policy": "sandbox",
          },
        });
      } catch {
        /* A missing derivative must never prevent opening the original. */
      }
    } else if (imageOriginal) {
      // Also upgrades older saved scans and resumes interrupted work without delaying this response.
      after(async () => {
        const { generateSavedScanDisplay } = await import("@/lib/ocr/original-display");
        await generateSavedScanDisplay(id, row.user_id || "");
      });
    }
  }
  try {
    let bytes = await readScanOriginalBytes(original.dataUrl);
    if (original.storageKind === "encrypted-blob")
      bytes = decryptScanOriginal(bytes, row.user_id || "");
    const type = /^(image\/(jpeg|png|webp)|application\/pdf)$/.test(original.type)
      ? original.type
      : "application/octet-stream";
    if (searchParams.get("preview") === "1" && !download) {
      if (type === "application/pdf") {
        const { rasterizePdfPageToPng } = await import("@/lib/pdf-raster");
        const firstPage = await rasterizePdfPageToPng(bytes, 0);
        if (!firstPage) return new Response("Preview unavailable", { status: 422 });
        bytes = firstPage;
      } else if (!type.startsWith("image/")) {
        return new Response("Preview unavailable", { status: 415 });
      }
      const preview = await sharp(bytes)
        .rotate()
        .resize({ width: 640, height: 800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      return new Response(new Uint8Array(preview), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const name = String(original.name || "Original document").replace(/[\r\n/\\]/g, "_");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `${download || type === "application/octet-stream" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(name).replace(/'/g, "%27")}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
        "X-Document-Variant": "original",
      },
    });
  } catch {
    return new Response("Original unavailable", { status: 502 });
  }
}

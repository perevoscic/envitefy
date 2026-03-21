import { NextRequest } from "next/server";
import {
  getEventHistoryMediaDataUrlById,
  resolveEventHistoryIdentityBySlugOrId,
  type EventHistoryMediaVariant,
} from "@/lib/db";
import { parseDataUrlBase64 } from "@/utils/data-url";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params;
    const identity = await resolveEventHistoryIdentityBySlugOrId({
      value: awaitedParams.id,
    });
    if (!identity) {
      return new Response("No thumbnail found", { status: 404 });
    }

    const variantParam = String(
      req.nextUrl.searchParams.get("variant") || ""
    ).trim();
    const variant: EventHistoryMediaVariant | null =
      variantParam === "attachment" ||
      variantParam === "thumbnail" ||
      variantParam === "profile" ||
      variantParam === "hero" ||
      variantParam === "signup-header"
        ? (variantParam as EventHistoryMediaVariant)
        : null;

    const imageDataUrl = await getEventHistoryMediaDataUrlById(
      identity.id,
      variant
    );

    if (!imageDataUrl) {
      return new Response("No thumbnail found", { status: 404 });
    }

    const parsed = parseDataUrlBase64(imageDataUrl);
    if (!parsed || !parsed.mimeType.startsWith("image/")) {
      return new Response("Invalid image format", { status: 400 });
    }
    const imageBuffer = Buffer.from(parsed.base64Payload, "base64");
    if (!imageBuffer.length) {
      return new Response("Invalid image format", { status: 400 });
    }

    const mediaType = parsed.mimeType.split(";")[0].trim();
    const contentType = /^image\/[\w.+-]+$/i.test(mediaType)
      ? mediaType
      : "image/jpeg";

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Thumbnail API error:", error);
    return new Response("Error loading thumbnail", { status: 500 });
  }
}

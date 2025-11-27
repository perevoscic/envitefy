import { NextRequest } from "next/server";
import { getEventHistoryBySlugOrId } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const awaitedParams = await (params as any);
    const row = await getEventHistoryBySlugOrId({ value: awaitedParams.id });
    const data: any = row?.data || {};
    const variant = req.nextUrl.searchParams.get("variant");
    const preferAttachment = variant === "attachment";
    const preferThumbnail = variant === "thumbnail";

    const hasThumbnail =
      typeof data?.thumbnail === "string" && data.thumbnail.length > 0;
    const hasAttachment =
      data?.attachment &&
      typeof data.attachment === "object" &&
      typeof data.attachment.dataUrl === "string" &&
      data.attachment.dataUrl.length > 0;

    let imageDataUrl: string | null = null;

    if (preferAttachment && hasAttachment) {
      imageDataUrl = data.attachment.dataUrl;
    } else if (preferThumbnail && hasThumbnail) {
      imageDataUrl = data.thumbnail;
    } else if (hasThumbnail) {
      imageDataUrl = data.thumbnail;
    } else if (hasAttachment) {
      imageDataUrl = data.attachment.dataUrl;
    }

    if (!imageDataUrl) {
      return new Response("No thumbnail found", { status: 404 });
    }

    const base64Match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return new Response("Invalid image format", { status: 400 });
    }

    const [, mimeType, base64Data] = base64Match;
    const imageBuffer = Buffer.from(base64Data, "base64");

    const contentType =
      mimeType === "png"
        ? "image/png"
        : mimeType === "jpeg" || mimeType === "jpg"
        ? "image/jpeg"
        : mimeType === "webp"
        ? "image/webp"
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

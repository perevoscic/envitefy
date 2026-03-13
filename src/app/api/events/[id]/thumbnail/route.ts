import { NextRequest } from "next/server";
import {
  getEventHistoryMediaDataUrlById,
  resolveEventHistoryIdentityBySlugOrId,
  type EventHistoryMediaVariant,
} from "@/lib/db";

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

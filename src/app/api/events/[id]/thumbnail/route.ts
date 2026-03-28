import { NextRequest } from "next/server";
import {
  getEventHistoryMediaDataUrlById,
  resolveEventHistoryIdentityBySlugOrId,
  type EventHistoryMediaVariant,
} from "@/lib/db";
import { buildMediaResponse } from "@/lib/media-response";

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

    return buildMediaResponse(imageDataUrl);
  } catch (error) {
    console.error("Thumbnail API error:", error);
    return new Response("Error loading thumbnail", { status: 500 });
  }
}

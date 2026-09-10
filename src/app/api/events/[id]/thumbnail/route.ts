import { guardDraftRequest } from "@/lib/event-draft-access-server";
import { NextRequest } from "next/server";
import {
  getEventHistoryMediaDataUrlById,
  resolveEventHistoryIdentityBySlugOrId,
  type EventHistoryMediaVariant,
} from "@/lib/db";
import { buildMediaResponse } from "@/lib/media-response";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryById } from "@/lib/db";
import { resolveScanMediaPolicy } from "@/lib/ocr/scan-media";

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

    const draftDenied = await guardDraftRequest(identity.id);
    if (draftDenied) return draftDenied;
    const row = await getEventHistoryById(identity.id);
    if (row && (resolveScanMediaPolicy(row.data, row.title)?.medical || row.data?.attachment?.storageKind === "encrypted-blob")) {
      const userId = await resolveSessionUserId(await getServerSession(authOptions));
      if (!userId || userId !== row.user_id) return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
      return new Response(null, { status: 307, headers: { Location: `/api/events/${identity.id}/original`, "Cache-Control": "private, no-store" } });
    }
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

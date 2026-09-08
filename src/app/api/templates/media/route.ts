import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryOwnerById } from "@/lib/db";
import { processPublicUpload } from "@/lib/media-upload";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const userId = await resolveSessionUserId(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: "Sign in to upload event photos" }, { status: 401 });
  try {
    const body = await request.formData();
    const file = body.get("file");
    const eventId = String(body.get("eventId") || "") || null;
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo" }, { status: 400 });
    if (eventId) {
      const row = await getEventHistoryOwnerById(eventId);
      if (!row || row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const upload = await processPublicUpload({ file, usage: "header", eventId, uploadToken: eventId ? undefined : `template-${userId}` });
    return NextResponse.json({ url: upload.stored.display?.url || upload.eventMedia.thumbnail });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Photo upload failed" }, { status: 400 });
  }
}

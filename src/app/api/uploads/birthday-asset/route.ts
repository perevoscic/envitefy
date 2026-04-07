import { NextResponse } from "next/server";
import { processPublicUpload } from "@/lib/media-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const eventId = String(formData.get("eventId") || "").trim() || null;
    const uploadToken = String(formData.get("uploadToken") || "").trim() || null;
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const upload = await processPublicUpload({
      file,
      usage: "header",
      eventId,
      uploadToken,
    });
    const url = upload.stored.display?.url || upload.eventMedia.thumbnail || null;
    if (!url) {
      throw new Error("Upload did not return a stored image URL");
    }

    return NextResponse.json({
      ok: true,
      url,
      storageKind: "blob",
    });
  } catch (err: any) {
    console.error("[birthday asset] upload failed", err);
    return NextResponse.json(
      { error: String(err?.message || "internal error") },
      { status: 500 }
    );
  }
}

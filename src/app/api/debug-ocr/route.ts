export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file field" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    let processed = 0;
    try {
      const out = await sharp(buf).resize(1200).grayscale().toBuffer();
      processed = out.length;
    } catch (e) {
      // sharp can fail on HEIC/odd formats; we still report the raw size
    }
    return NextResponse.json({
      ok: true,
      receivedBytes: buf.length,
      processedBytes: processed,
      mime: file.type || null,
      name: (file as any).name || null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

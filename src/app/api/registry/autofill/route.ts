import { NextRequest, NextResponse } from "next/server";
import { extractAmazonMetadata } from "@/lib/amazon-metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url =
      typeof body.url === "string" && body.url.trim() ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const meta = await extractAmazonMetadata(url);
    return NextResponse.json(meta);
  } catch (err: any) {
    try {
      console.error("[registry/autofill] POST error", err);
    } catch {
      // ignore
    }
    return NextResponse.json(
      { error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { listRegistryItemsByEventId } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const eventId = (url.searchParams.get("eventId") || "").trim();
    if (!eventId) {
      return NextResponse.json(
        { error: "Missing eventId" },
        { status: 400 }
      );
    }

    const items = await listRegistryItemsByEventId(eventId);
    return NextResponse.json(items);
  } catch (err: any) {
    try {
      console.error("[registry/list] GET error", err);
    } catch {
      // ignore
    }
    return NextResponse.json(
      { error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}


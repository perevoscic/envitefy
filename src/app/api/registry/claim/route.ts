import { NextRequest, NextResponse } from "next/server";
import { claimRegistryItem } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemId =
      typeof body.itemId === "string" && body.itemId.trim()
        ? body.itemId.trim()
        : "";
    const guestName =
      typeof body.guestName === "string" && body.guestName.trim()
        ? body.guestName.trim()
        : null;
    const quantity =
      typeof body.quantity === "number" || typeof body.quantity === "string"
        ? Number(body.quantity)
        : 1;
    const message =
      typeof body.message === "string" && body.message.trim()
        ? body.message.trim()
        : null;

    if (!itemId || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid item or quantity" },
        { status: 400 }
      );
    }

    const { item, claim } = await claimRegistryItem({
      itemId,
      guestName,
      quantity,
      message,
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found or already fully claimed" },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, item, claim });
  } catch (err: any) {
    try {
      console.error("[registry/claim] POST error", err);
    } catch {
      // ignore
    }
    return NextResponse.json(
      { error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}


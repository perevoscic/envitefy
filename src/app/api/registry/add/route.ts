import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { upsertRegistryItem } from "@/lib/db";
import { decorateAmazonUrl } from "@/utils/affiliates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const email: string | undefined =
      (session?.user?.email as string | undefined) || undefined;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;
    const eventId =
      typeof body.eventId === "string" && body.eventId.trim()
        ? body.eventId.trim()
        : "";
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "";
    const rawAffiliateUrl =
      typeof body.affiliateUrl === "string" && body.affiliateUrl.trim()
        ? body.affiliateUrl.trim()
        : "";
    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : "";
    const price =
      typeof body.price === "string" && body.price.trim()
        ? body.price.trim()
        : null;
    const quantity =
      typeof body.quantity === "number" || typeof body.quantity === "string"
        ? Number(body.quantity)
        : 1;
    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : null;
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    if (!eventId || !title || !rawAffiliateUrl || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const affiliateUrl = decorateAmazonUrl(rawAffiliateUrl, {
      category: "wedding",
      viewer: "guest",
      strictCategoryOnly: false,
    });

    const item = await upsertRegistryItem({
      id,
      eventId,
      title,
      affiliateUrl,
      imageUrl,
      price,
      quantity,
      category,
      notes,
    });

    return NextResponse.json(item);
  } catch (err: any) {
    try {
      console.error("[registry/add] POST error", err);
    } catch {
      // ignore
    }
    return NextResponse.json(
      { error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}


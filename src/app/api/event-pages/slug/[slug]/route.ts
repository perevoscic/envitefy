import { NextResponse } from "next/server";
import { getEventPageBySlug } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getEventPageBySlug(slug);
  if (!page) return NextResponse.json({ ok: false, error: "Event page not found." }, { status: 404 });
  return NextResponse.json({ ok: true, page });
}

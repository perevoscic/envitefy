import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const r = await fetch("https://vision.googleapis.com", { method: "HEAD" });
    return NextResponse.json({ ok: r.ok, status: r.status });
  } catch (error) {
    console.warn("[net] Diagnostic network check failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}


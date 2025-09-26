import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminOverviewStats, getTopUsersByScans, getIsAdminByEmail } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any);
    const email: string | undefined = (session?.user?.email as string | undefined) || undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isAdmin = await getIsAdminByEmail(email);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [overview, topUsers] = await Promise.all([
      getAdminOverviewStats(),
      getTopUsersByScans(20),
    ]);

    return NextResponse.json({ ok: true, overview, topUsers });
  } catch (err: any) {
    try { console.error("[admin stats] GET error", err); } catch {}
    return NextResponse.json({ error: String(err?.message || err || "unknown error") }, { status: 500 });
  }
}



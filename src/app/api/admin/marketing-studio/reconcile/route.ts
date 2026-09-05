import { NextResponse } from "next/server";
import { requireStudioCron, studioErrorResponse } from "@/lib/admin/marketing-studio/http";
import { reconcileStudioVersions } from "@/lib/admin/marketing-studio/worker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

async function reconcile(request: Request) {
  try {
    requireStudioCron(request);
    const result = await reconcileStudioVersions();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return studioErrorResponse(error);
  }
}

export const GET = reconcile;
export const POST = reconcile;

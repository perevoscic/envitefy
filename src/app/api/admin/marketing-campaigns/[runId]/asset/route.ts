export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { readMarketingRunAsset } from "@/lib/admin/marketing-campaigns";

export async function GET(
  request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    await requireAdminSession();
    const { runId } = await context.params;
    const file = new URL(request.url).searchParams.get("file") || "";
    const asset = await readMarketingRunAsset(runId, file);
    if (!asset) {
      return NextResponse.json({ error: "Run asset not found" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(asset.bytes), {
      headers: {
        "Content-Type": asset.contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return NextResponse.json({ error: "Run asset not found" }, { status: 404 });
    }
    return adminErrorResponse(error, "Failed to read run asset");
  }
}

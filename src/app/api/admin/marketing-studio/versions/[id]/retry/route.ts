import { after, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { studioErrorResponse } from "@/lib/admin/marketing-studio/http";
import { retryVersion } from "@/lib/admin/marketing-studio/repository";
import { processStudioVersion } from "@/lib/admin/marketing-studio/worker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const version = await retryVersion(id);
    after(async () => {
      try {
        await processStudioVersion(id);
      } catch (error) {
        console.error("[marketing-studio] recovery failed", {
          versionId: id,
          message: error instanceof Error ? error.message : "Unexpected recovery failure",
        });
      }
    });
    return NextResponse.json({ version }, { status: 202 });
  } catch (error) {
    return studioErrorResponse(error);
  }
}

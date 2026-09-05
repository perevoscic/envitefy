import { after, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { readStudioJson, studioErrorResponse } from "@/lib/admin/marketing-studio/http";
import { createTurn } from "@/lib/admin/marketing-studio/repository";
import { parseStudioTurn } from "@/lib/admin/marketing-studio/validation";
import { processStudioVersion } from "@/lib/admin/marketing-studio/worker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { email } = await requireAdminSession();
    const { id } = await context.params;
    const version = await createTurn(id, email, parseStudioTurn(await readStudioJson(request)));
    after(async () => {
      try {
        await processStudioVersion(version.id);
      } catch (error) {
        console.error("[marketing-studio] background creation failed", {
          versionId: version.id,
          message: error instanceof Error ? error.message : "Unexpected generation failure",
        });
      }
    });
    return NextResponse.json({ version }, { status: 202 });
  } catch (error) {
    return studioErrorResponse(error);
  }
}

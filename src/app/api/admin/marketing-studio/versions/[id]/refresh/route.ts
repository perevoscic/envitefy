import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { studioErrorResponse } from "@/lib/admin/marketing-studio/http";
import { getVersion } from "@/lib/admin/marketing-studio/repository";
import { StudioRequestError } from "@/lib/admin/marketing-studio/validation";
import { processStudioVersion } from "@/lib/admin/marketing-studio/worker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    if (!(await getVersion(id))) throw new StudioRequestError("Version not found.", 404);
    await processStudioVersion(id);
    return NextResponse.json({ version: await getVersion(id) });
  } catch (error) {
    return studioErrorResponse(error);
  }
}

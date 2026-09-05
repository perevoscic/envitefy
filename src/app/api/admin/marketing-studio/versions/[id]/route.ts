import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { studioErrorResponse } from "@/lib/admin/marketing-studio/http";
import { getVersion } from "@/lib/admin/marketing-studio/repository";
import { StudioRequestError } from "@/lib/admin/marketing-studio/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const version = await getVersion(id);
    if (!version) throw new StudioRequestError("Version not found.", 404);
    return NextResponse.json({ version });
  } catch (error) {
    return studioErrorResponse(error);
  }
}

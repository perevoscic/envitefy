import { requireAdminSession } from "@/lib/admin/require-admin";
import { readAsset, studioAssetResponse } from "@/lib/admin/marketing-studio/assets";
import { studioErrorResponse } from "@/lib/admin/marketing-studio/http";
import { StudioRequestError } from "@/lib/admin/marketing-studio/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const found = await readAsset(id);
    if (!found) throw new StudioRequestError("Media not found.", 404);
    return studioAssetResponse(
      found.asset,
      found.bytes,
      request.headers.get("range"),
      new URL(request.url).searchParams.get("download") === "1",
    );
  } catch (error) {
    return studioErrorResponse(error);
  }
}

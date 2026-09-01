import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { getAdminScanAttemptPreview } from "@/lib/admin/scans";
import { recordPrivateDataAccess } from "@/lib/private-data-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { email } = await requireAdminSession();
    const { id } = await context.params;
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: "Valid scan attempt id is required" }, { status: 400 });
    }

    const preview = await getAdminScanAttemptPreview(id);
    if (!preview) {
      return NextResponse.json({ error: "Scan preview not found" }, { status: 404 });
    }
    await recordPrivateDataAccess({
      actorEmail: email,
      action: "view_scan_preview",
      resourceId: id,
      headers: request.headers,
    });

    return new Response(new Uint8Array(preview.bytes), {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Type": preview.mimeType,
        "Content-Disposition": `inline; filename="scan-attempt-${id}.jpg"`,
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (error) {
    return adminErrorResponse(error, "Failed to load scan preview");
  }
}

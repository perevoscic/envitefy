export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import {
  getAdminUserDebugLinks,
  type AdminUserDebugLinkKind,
} from "@/lib/admin/users";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readKind(value: string | null): AdminUserDebugLinkKind | null {
  return value === "events" || value === "scans" ? value : null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: "Valid user id is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const kind = readKind(searchParams.get("kind"));
    if (!kind) {
      return NextResponse.json({ error: "kind must be events or scans" }, { status: 400 });
    }

    const links = await getAdminUserDebugLinks(id, kind);
    return NextResponse.json({
      ok: true,
      eventLinks: kind === "events" ? links : [],
      scanLinks: kind === "scans" ? links : [],
    });
  } catch (error) {
    return adminErrorResponse(error, "Failed to load user debug links");
  }
}

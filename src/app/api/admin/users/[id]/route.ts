export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { deleteUserForAdmin, getUserById } from "@/lib/db";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { email } = await requireAdminSession();
    const { id } = await context.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const targetUser = await getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.email.toLowerCase() === email.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account from this screen" },
        { status: 400 },
      );
    }

    const result = await deleteUserForAdmin(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return adminErrorResponse(error, "Failed to delete user");
  }
}

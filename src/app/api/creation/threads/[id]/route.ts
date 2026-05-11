import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { conciergeApiErrorMessage } from "@/lib/concierge/api-errors";
import { deleteCreationSession } from "@/lib/concierge/event-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Sign in to use Envitefy Concierge." },
        { status: 401 },
      );
    }

    const params = await context.params;
    const sessionId = typeof params.id === "string" ? params.id.trim() : "";
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Thread id is required." }, { status: 400 });
    }

    const deleted = await deleteCreationSession({ userId, sessionId });
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Thread not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: conciergeApiErrorMessage(error, "Unable to delete AI thread."),
      },
      { status: 500 },
    );
  }
}

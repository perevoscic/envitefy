import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { handleCreationIntake } from "@/lib/concierge/intake";
import type { CreationIntakeRequest, ConciergeMessageResponse } from "@/lib/concierge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Sign in to use Envitefy Concierge." } satisfies ConciergeMessageResponse,
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as CreationIntakeRequest;
    const message = typeof body.message === "string" ? body.message.slice(0, 12000) : "";
    const action = body.action || "message";
    if (!message.trim() && !body.ocrContext && action !== "save") {
      return NextResponse.json(
        { ok: false, error: "Send a message or upload context." } satisfies ConciergeMessageResponse,
        { status: 400 },
      );
    }

    const result = await handleCreationIntake({
      userId,
      request: {
        ...body,
        message,
        action,
      },
    });

    return NextResponse.json(result satisfies ConciergeMessageResponse);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Creation intake failed.",
      } satisfies ConciergeMessageResponse,
      { status: 500 },
    );
  }
}


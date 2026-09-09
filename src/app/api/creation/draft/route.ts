import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { saveCreationDraft } from "@/lib/concierge/intake";

export const runtime = "nodejs";

/** Explicit draft saves do not invoke extraction, generation, or publishing. */
export async function PUT(request: Request) {
  const user = await getAuthenticatedRequestUser(request);
  if (!user.ok)
    return NextResponse.json(
      { ok: false, error: "Sign in to save your progress." },
      { status: 401 },
    );
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      return NextResponse.json(
        { ok: false, error: "Draft progress is required." },
        { status: 400 },
      );
    const session = await saveCreationDraft(user.userId, body as Record<string, unknown>);
    return NextResponse.json({ ok: true, creationSessionId: session.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to save your progress.",
      },
      { status: 400 },
    );
  }
}

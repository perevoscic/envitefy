import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { sanitizeMediaItems } from "@/app/studio/studio-workspace-sanitize";
import { authOptions } from "@/lib/auth";
import { getStudioLibraryByEmail, updateStudioLibraryByEmail } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stay under typical serverless body limits (e.g. Vercel ~4.5MB). */
const MAX_BODY_CHARS = 2_500_000;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email || typeof email !== "string") {
    return jsonError("Unauthorized", 401);
  }

  const row = await getStudioLibraryByEmail(email);
  const items = sanitizeMediaItems(row?.items ?? []);
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email || typeof email !== "string") {
    return jsonError("Unauthorized", 401);
  }

  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) {
    return jsonError("Library payload too large", 413);
  }

  let body: unknown;
  try {
    body = text.length ? JSON.parse(text) : {};
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const itemsRaw =
    body != null && typeof body === "object" && !Array.isArray(body) && "items" in body
      ? (body as { items: unknown }).items
      : null;
  if (!Array.isArray(itemsRaw)) {
    return jsonError("Expected { items: array }", 400);
  }

  const items = sanitizeMediaItems(itemsRaw);
  await updateStudioLibraryByEmail({
    email,
    payload: { v: 1, items },
  });

  return NextResponse.json({ ok: true, items });
}

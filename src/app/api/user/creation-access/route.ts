import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { CREATION_CATEGORY_LABELS, CREATION_PRODUCT_LABELS } from "@/lib/creation-access";
import { getCreationAccess, listCreationAccessRequests, requestCreationAccess } from "@/lib/creation-access-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const user = await getAuthenticatedRequestUser(request);
    if (!user.ok) return NextResponse.json({ error: "Sign in to view your event access." }, { status: 401, headers });
    // Navigation and creation need only the current grants. Access-request
    // history and the settings catalog must not delay their availability.
    if (new URL(request.url).searchParams.get("summary") === "1") {
      return NextResponse.json({ access: await getCreationAccess(user.userId) }, { headers });
    }
    const [access, requests] = await Promise.all([
      getCreationAccess(user.userId),
      listCreationAccessRequests(user.userId),
    ]);
    return NextResponse.json({ access, requests, catalog: { categories: CREATION_CATEGORY_LABELS, products: CREATION_PRODUCT_LABELS } }, { headers });
  } catch {
    return NextResponse.json({ error: "Could not load your event access. Please retry." }, { status: 503, headers });
  }
}
export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Open Envitefy to request access." }, { status: 403 });
  const user = await getAuthenticatedRequestUser(request);
  if (!user.ok) return NextResponse.json({ error: "Sign in to request access." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try { await requestCreationAccess(user.userId, body.kind, body.capability); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not request access." }, { status: 400 }); }
}

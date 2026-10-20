import { NextResponse } from "next/server";
import { requireAdminSession, adminErrorResponse } from "@/lib/admin/require-admin";
import { getUserByEmail } from "@/lib/db";
import { getCreationAccess, listCreationAccessRequests, reviewCreationAccessRequest, updateCreationAccountAccess } from "@/lib/creation-access-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const email = new URL(request.url).searchParams.get("email")?.trim();
    const user = email ? await getUserByEmail(email) : null;
    return NextResponse.json({ account: user ? { email: user.email, access: await getCreationAccess(user.id) } : null, requests: await listCreationAccessRequests() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return adminErrorResponse(error); }
}
export async function PATCH(request: Request) {
  try {
    const { email: reviewer } = await requireAdminSession();
    if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Open Envitefy to manage account access." }, { status: 403 });
    const body = await request.json();
    if (typeof body.email !== "string" || !body.email.trim()) return NextResponse.json({ error: "Enter an account email." }, { status: 400 });
    await updateCreationAccountAccess(body.email.trim(), body.policy, body.categories, body.products, reviewer);
    return NextResponse.json({ ok: true });
  } catch (error) { return adminErrorResponse(error); }
}
export async function POST(request: Request) {
  try {
    const { email } = await requireAdminSession();
    if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Open Envitefy to review requests." }, { status: 403 });
    const body = await request.json();
    if (typeof body.requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.requestId)) return NextResponse.json({ error: "Choose an access request." }, { status: 400 });
    await reviewCreationAccessRequest(body.requestId, body.decision, email);
    return NextResponse.json({ ok: true });
  } catch (error) { return adminErrorResponse(error); }
}

import { NextResponse } from "next/server";
import { getEventHistoryById } from "@/lib/db";
import { allowsPublicSignup } from "@/lib/signup-access";
import {
  managedSignupResponseId,
  SIGNUP_MANAGEMENT_MAX_AGE,
  signupManagementCookieName,
} from "@/lib/signup-management";
import { readStoredSignup } from "@/lib/signup-mutations";
import { hasSameSignupOrigin } from "@/lib/signup-request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSameSignupOrigin(request))
    return NextResponse.json(
      { error: "Open your private signup link to continue." },
      { status: 403 },
    );
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const token =
    body && typeof body === "object" && "token" in body && typeof body.token === "string"
      ? body.token
      : null;
  try {
    const row = await getEventHistoryById(id);
    if (
      !token ||
      !row ||
      !allowsPublicSignup(row.data) ||
      !managedSignupResponseId(token, id, readStoredSignup(row.data.signupForm))
    )
      return NextResponse.json(
        {
          error:
            "This link has expired or is no longer available. Request a new link from the signup form.",
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    const result = NextResponse.json(
      { ok: true, href: `/smart-signup-form/${encodeURIComponent(id)}#my-signup` },
      { headers: { "Cache-Control": "no-store" } },
    );
    result.cookies.set(signupManagementCookieName(id), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SIGNUP_MANAGEMENT_MAX_AGE,
    });
    return result;
  } catch {
    return NextResponse.json(
      { error: "We couldn’t open your signup. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

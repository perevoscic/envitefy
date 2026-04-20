import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  updateUserNamesByEmail,
  getUserByEmail,
  updatePreferredProviderByEmail,
} from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const email = session.user.email as string;
  const user = await getUserByEmail(email);
  return NextResponse.json({
    email: user?.email || email,
    firstName: user?.first_name || null,
    lastName: user?.last_name || null,
    preferredProvider: user?.preferred_provider || null,
    name: session.user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || null,
    isAdmin: Boolean(user?.is_admin),
    primarySignupSource: user?.primary_signup_source || "legacy",
    productScopes: Array.isArray(user?.product_scopes) ? user.product_scopes : ["snap"],
  });
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    // Only include keys that were actually present in the request body.
    const hasFirst = Object.hasOwn(body, "firstName");
    const hasLast = Object.hasOwn(body, "lastName");
    const firstName = hasFirst
      ? body.firstName === ""
        ? null
        : String(body.firstName)
      : undefined;
    const lastName = hasLast
      ? body.lastName === ""
        ? null
        : String(body.lastName)
      : undefined;
    const rawPref =
      body.preferredProvider == null || body.preferredProvider === ""
        ? null
        : String(body.preferredProvider).toLowerCase();
    const preferredProvider: "google" | "microsoft" | "apple" | null =
      rawPref === "google" || rawPref === "microsoft" || rawPref === "apple"
        ? (rawPref as "google" | "microsoft" | "apple")
        : null;
    const hasPreferredProvider = Object.hasOwn(
      body,
      "preferredProvider"
    );
    let updatedUser = await getUserByEmail(email);
    if (!updatedUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (hasFirst || hasLast) {
      const namePayload: any = { email };
      if (hasFirst) namePayload.firstName = firstName;
      if (hasLast) namePayload.lastName = lastName;
      updatedUser = await updateUserNamesByEmail(namePayload);
    }

    if (
      hasPreferredProvider &&
      preferredProvider !== (updatedUser.preferred_provider || null)
    ) {
      updatedUser = await updatePreferredProviderByEmail({ email, preferredProvider });
    }

    return NextResponse.json({
      ok: true,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      preferredProvider: updatedUser.preferred_provider || null,
      primarySignupSource: updatedUser.primary_signup_source || "legacy",
      productScopes: Array.isArray(updatedUser.product_scopes)
        ? updatedUser.product_scopes
        : ["snap"],
    });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

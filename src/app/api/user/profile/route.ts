import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateUserNamesByEmail, getUserByEmail, updatePreferredProviderByEmail, getSubscriptionPlanByEmail, updateSubscriptionPlanByEmail, initFreeCreditsIfMissing, getCreditsByEmail, getCategoryColorsByEmail, updateCategoryColorsByEmail, getIsAdminByEmail } from "@/lib/db";
import { sendSubscriptionChangeEmail } from "@/lib/email";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const email = session.user.email as string;
  const user = await getUserByEmail(email);
  const plan = await getSubscriptionPlanByEmail(email);
  // Backfill free users who never received initial credits (legacy rows)
  const init = await (async () => {
    const current = await getCreditsByEmail(email);
    if ((plan === "free" || plan == null) && current == null) {
      return await initFreeCreditsIfMissing(email, 3);
    }
    return current ?? 0;
  })();
  const responsePlan = plan || "free";
  const creditsCount = typeof init === "number" ? init : (await getCreditsByEmail(email)) ?? 0;
  return NextResponse.json({
    email: user?.email || email,
    firstName: user?.first_name || null,
    lastName: user?.last_name || null,
    preferredProvider: user?.preferred_provider || null,
    subscriptionPlan: responsePlan,
    credits: responsePlan === "FF" ? null : Number.isFinite(creditsCount as any) ? creditsCount : 0,
    name: session.user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || null,
    isAdmin: Boolean(user?.is_admin),
    categoryColors: await getCategoryColorsByEmail(email),
  });
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    // Only include keys that were actually present in the request body.
    const hasFirst = Object.prototype.hasOwnProperty.call(body, "firstName");
    const hasLast = Object.prototype.hasOwnProperty.call(body, "lastName");
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

    const namePayload: any = { email };
    if (hasFirst) namePayload.firstName = firstName;
    if (hasLast) namePayload.lastName = lastName;
    const updatedNames = await updateUserNamesByEmail(namePayload);
    const updated = await updatePreferredProviderByEmail({ email, preferredProvider });
    if (typeof body.categoryColors !== "undefined") {
      const map = body.categoryColors && typeof body.categoryColors === "object" ? (body.categoryColors as Record<string, string>) : null;
      await updateCategoryColorsByEmail({ email, categoryColors: map });
    }
    
    // Track subscription plan changes for email notification
    const oldPlan = typeof body.subscriptionPlan !== "undefined" ? (await getSubscriptionPlanByEmail(email)) || "free" : null;
    
    if (typeof body.subscriptionPlan !== "undefined") {
      const rawPlan = body.subscriptionPlan == null ? null : String(body.subscriptionPlan);
      const norm = rawPlan && (rawPlan === "free" || rawPlan === "monthly" || rawPlan === "yearly" || rawPlan === "FF") ? (rawPlan as any) : null;
      await updateSubscriptionPlanByEmail({ email, plan: norm });
    }
    const nextPlan = (await getSubscriptionPlanByEmail(email)) || null;
    
    // Send subscription change email if plan changed
    if (oldPlan && nextPlan && oldPlan !== nextPlan) {
      try {
        const user = await getUserByEmail(email);
        const userName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || null : null;
        await sendSubscriptionChangeEmail({
          toEmail: email,
          userName,
          oldPlan,
          newPlan: nextPlan,
        });
      } catch (emailErr) {
        // Log but don't fail the request if email fails
        console.error("[profile] Failed to send subscription change email:", emailErr);
      }
    }
    const isAdmin = await getIsAdminByEmail(email);
    return NextResponse.json({
      email: updated.email,
      firstName: updated.first_name,
      lastName: updated.last_name,
      preferredProvider: updated.preferred_provider || null,
      subscriptionPlan: nextPlan,
      isAdmin,
      categoryColors: await getCategoryColorsByEmail(email),
    });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}



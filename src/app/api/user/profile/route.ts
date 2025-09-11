import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateUserNamesByEmail, getUserByEmail, updatePreferredProviderByEmail, getSubscriptionPlanByEmail, updateSubscriptionPlanByEmail, getScansRemainingByEmail, initFreeScansIfMissing } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const email = session.user.email as string;
  const user = await getUserByEmail(email);
  const plan = await getSubscriptionPlanByEmail(email);
  // Backfill free users who never received scans_remaining
  const scans = await (async () => {
    const current = await getScansRemainingByEmail(email);
    if (current == null && (plan === "free" || plan == null)) {
      return await initFreeScansIfMissing(email, 3);
    }
    return current ?? 0;
  })();
  const responsePlan = plan || "free";
  return NextResponse.json({
    email: user?.email || email,
    firstName: user?.first_name || null,
    lastName: user?.last_name || null,
    preferredProvider: user?.preferred_provider || null,
    subscriptionPlan: responsePlan,
    scanCredits: responsePlan === "free" ? (typeof scans === "number" ? scans : 0) : null,
    name: session.user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || null,
  });
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const firstName = body.firstName == null || body.firstName === "" ? null : String(body.firstName);
    const lastName = body.lastName == null || body.lastName === "" ? null : String(body.lastName);
    const rawPref =
      body.preferredProvider == null || body.preferredProvider === ""
        ? null
        : String(body.preferredProvider).toLowerCase();
    const preferredProvider: "google" | "microsoft" | "apple" | null =
      rawPref === "google" || rawPref === "microsoft" || rawPref === "apple"
        ? (rawPref as "google" | "microsoft" | "apple")
        : null;

    const updatedNames = await updateUserNamesByEmail({ email, firstName, lastName });
    const updated = await updatePreferredProviderByEmail({ email, preferredProvider });
    if (typeof body.subscriptionPlan !== "undefined") {
      const rawPlan = body.subscriptionPlan == null ? null : String(body.subscriptionPlan).toLowerCase();
      const normalizedPlan = rawPlan === "free" || rawPlan === "monthly" || rawPlan === "yearly" ? rawPlan : null;
      await updateSubscriptionPlanByEmail({ email, plan: normalizedPlan });
    }
    return NextResponse.json({
      email: updated.email,
      firstName: updated.first_name,
      lastName: updated.last_name,
      preferredProvider: updated.preferred_provider || null,
      subscriptionPlan: (await getSubscriptionPlanByEmail(email)) || null,
    });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}



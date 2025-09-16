import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import { getAppBaseUrl, getStripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    const user = await getUserByEmail(session.user.email as string);
    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer on file" }, { status: 400 });
    }
    const stripe = getStripeClient();
    const baseUrl = getAppBaseUrl(req.nextUrl?.origin);
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${baseUrl}/subscription?checkout=portal-return`,
    });
    return NextResponse.json({ ok: true, url: portal.url });
  } catch (err: any) {
    console.error("[billing/stripe/portal] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create billing portal session" }, { status: 500 });
  }
}


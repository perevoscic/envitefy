import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubscriptionPlanByEmail, updateSubscriptionPlanByEmail } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const plan = await getSubscriptionPlanByEmail(session.user.email as string);
  return NextResponse.json({ plan: plan || null });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { plan?: string | null };
  const raw = (body?.plan ?? null) as string | null;
  const plan = raw === "free" || raw === "monthly" || raw === "yearly" ? raw : null;
  await updateSubscriptionPlanByEmail({ email: session.user.email as string, plan });
  return NextResponse.json({ ok: true, plan });
}



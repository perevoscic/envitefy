import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateUserNamesByEmail, getUserByEmail } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const user = await getUserByEmail(session.user.email as string);
  return NextResponse.json({
    email: user?.email || session.user.email,
    firstName: user?.first_name || null,
    lastName: user?.last_name || null,
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

    const updated = await updateUserNamesByEmail({ email, firstName, lastName });
    return NextResponse.json({
      email: updated.email,
      firstName: updated.first_name,
      lastName: updated.last_name,
    });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}



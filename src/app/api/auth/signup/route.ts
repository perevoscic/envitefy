import { NextResponse } from "next/server";
import { createUserWithEmailPassword } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email as string) || "";
    const password = (body.password as string) || "";
    const firstName = (body.firstName as string) || undefined;
    const lastName = (body.lastName as string) || undefined;
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    await createUserWithEmailPassword({ email, password, firstName, lastName });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Failed to create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}



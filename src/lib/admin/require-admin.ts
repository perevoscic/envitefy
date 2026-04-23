import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIsAdminByEmail } from "@/lib/db";

export class AdminRouteError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email || typeof email !== "string") {
    throw new AdminRouteError(401, "Unauthorized");
  }

  const isAdmin = await getIsAdminByEmail(email);
  if (!isAdmin) {
    throw new AdminRouteError(403, "Forbidden");
  }

  return { email };
}

export function adminErrorResponse(error: unknown, fallback = "Request failed") {
  if (error instanceof AdminRouteError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message || fallback }, { status: 500 });
}

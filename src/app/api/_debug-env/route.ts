export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    has_NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    has_AUTH_SECRET: !!process.env.AUTH_SECRET,
    url: process.env.NEXTAUTH_URL || process.env.AUTH_URL || null,
  });
}

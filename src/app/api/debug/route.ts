import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const b64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    if (!b64) return NextResponse.json({ base64: false }, { status: 500 });
    const creds = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return NextResponse.json({ base64: true, client_email: creds.client_email });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

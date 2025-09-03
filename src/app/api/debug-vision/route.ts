export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getVisionClient } from "@/lib/gcp";

export async function GET() {
  try {
    const b64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64 || null;
    const client = getVisionClient();
    const [proj] = await client.getProjectId();
    return NextResponse.json({
      ok: true,
      projectId: proj,
      hasGOOGLE_B64: !!b64,
      b64Length: b64 ? b64.length : 0,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

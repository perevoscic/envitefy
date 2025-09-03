export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getVisionClient } from "@/lib/gcp";

export async function GET() {
  try {
    const client = getVisionClient();
    const [proj] = await client.getProjectId();
    return NextResponse.json({ ok: true, projectId: proj });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

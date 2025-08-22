import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const tokenData = await getToken({ req: request as any });
  const resp = {
    google: false,
    microsoft: false,
  };
  if (tokenData) {
    const providers = (tokenData as any).providers || {};
    resp.google = Boolean(providers.google);
    resp.microsoft = Boolean(providers.microsoft);
  }
  return NextResponse.json(resp);
}



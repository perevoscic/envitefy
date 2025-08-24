import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getGoogleRefreshToken, getMicrosoftRefreshToken } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const tokenData = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    const email = (tokenData as any)?.email as string | undefined;
    const providers = (tokenData as any)?.providers || {};

    let googleStored: boolean | null = null;
    let microsoftStored: boolean | null = null;
    let supabaseError: string | null = null;

    if (email) {
      try {
        const g = await getGoogleRefreshToken(email);
        googleStored = Boolean(g);
        const m = await getMicrosoftRefreshToken(email);
        microsoftStored = Boolean(m);
      } catch (err: unknown) {
        supabaseError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json({
      email: email || null,
      jwtProviders: {
        google: Boolean(providers?.google?.connected || providers?.google?.refreshToken || providers?.google?.accessToken),
        microsoft: Boolean(providers?.microsoft?.connected || providers?.microsoft?.refreshToken),
      },
      supabase: {
        configured: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        error: supabaseError,
        googleStored,
        microsoftStored,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



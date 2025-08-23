import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using service role for secure writes
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  // Do not throw at import time in case of build-time env issues; callers should handle failures
  console.warn("Supabase env not set: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
}

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : (null as any);

type MicrosoftTokenRow = {
  id: string;
  email: string;
  provider: "microsoft";
  refresh_token: string;
  updated_at?: string;
};

const TABLE = "oauth_tokens";

export async function saveMicrosoftRefreshToken(email: string, refreshToken: string): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const row: Partial<MicrosoftTokenRow> = {
    email: email.toLowerCase(),
    provider: "microsoft",
    refresh_token: refreshToken,
  };
  const { error } = await supabaseAdmin
    .from(TABLE)
    .upsert(row, { onConflict: "email,provider" });
  if (error) throw error;
}

export async function getMicrosoftRefreshToken(email: string): Promise<string | null> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("refresh_token")
    .eq("email", email.toLowerCase())
    .eq("provider", "microsoft")
    .maybeSingle();
  if (error) throw error;
  return (data as any)?.refresh_token || null;
}



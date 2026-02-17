import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

type SupabaseAdminClient = ReturnType<typeof createClient>;

function readEnv(name: string): string {
  return (process.env[name] || "").trim();
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(readEnv("SUPABASE_URL") && readEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

function getSupabaseAdminClient(): SupabaseAdminClient {
  const url = readEnv("SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase auth is not configured");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function buildResetRedirectUrl(baseResetUrl: string): string {
  const url = new URL(baseResetUrl);
  url.searchParams.set("provider", "supabase");
  return url.toString();
}

export async function createSupabaseRecoveryLink(params: {
  email: string;
  baseResetUrl: string;
}): Promise<string> {
  const email = params.email.trim().toLowerCase();
  const supabase = getSupabaseAdminClient();
  const redirectTo = buildResetRedirectUrl(params.baseResetUrl);

  const tryGenerate = async (): Promise<string> => {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error) throw error;
    const link = data?.properties?.action_link || "";
    if (!link) throw new Error("Supabase did not return a recovery link");
    return link;
  };

  try {
    return await tryGenerate();
  } catch (err: any) {
    const message = String(err?.message || "");
    const isUserMissing = /user.*not found|not.*found|invalid email/i.test(message);
    if (!isUserMissing) throw err;

    // For existing app accounts that predate Supabase Auth, seed an auth user
    // so recovery links can be generated without forcing a full auth migration.
    const randomPassword = randomBytes(24).toString("base64url");
    const created = await supabase.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    return await tryGenerate();
  }
}

export async function getEmailFromSupabaseAccessToken(accessToken: string): Promise<string | null> {
  const token = accessToken.trim();
  if (!token) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw error;
  const email = (data.user?.email || "").trim().toLowerCase();
  return email || null;
}


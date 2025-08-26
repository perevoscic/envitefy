import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
const scrypt = promisify(nodeScrypt);

// Server-only Supabase client using service role for secure writes
const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  // Do not throw at import time in case of build-time env issues; callers should handle failures
  console.warn("Supabase env not set: VITE_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
}

export const supabaseAdmin: SupabaseClient | null = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

type MicrosoftTokenRow = {
  id: string;
  email: string;
  provider: "microsoft";
  refresh_token: string;
  updated_at?: string;
  user_id?: string;
};

const TABLE = "oauth_tokens";

export async function saveMicrosoftRefreshToken(email: string, refreshToken: string): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const lowerEmail = email.toLowerCase();
  const existingUser = await getUserByEmail(lowerEmail).catch(() => null);
  const row: Partial<MicrosoftTokenRow> = {
    email: lowerEmail,
    provider: "microsoft",
    refresh_token: refreshToken,
    user_id: existingUser?.id,
  };
  const { error } = await supabaseAdmin
    .from(TABLE)
    .upsert(row, { onConflict: "email,provider" });
  if (error) throw error;
}

export async function getMicrosoftRefreshToken(email: string): Promise<string | null> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const lowerEmail = email.toLowerCase();
  const existingUser = await getUserByEmail(lowerEmail).catch(() => null);
  // Prefer querying by user_id when available; fall back to email for legacy rows
  let q = supabaseAdmin
    .from(TABLE)
    .select("refresh_token")
    .eq("provider", "microsoft");
  if (existingUser?.id) {
    q = q.eq("user_id", existingUser.id);
  } else {
    q = q.eq("email", lowerEmail);
  }
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return (data as any)?.refresh_token || null;
}

type GoogleTokenRow = {
  id: string;
  email: string;
  provider: "google";
  refresh_token: string;
  updated_at?: string;
  user_id?: string;
};

export async function saveGoogleRefreshToken(email: string, refreshToken: string): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const lowerEmail = email.toLowerCase();
  const existingUser = await getUserByEmail(lowerEmail).catch(() => null);
  const row: Partial<GoogleTokenRow> = {
    email: lowerEmail,
    provider: "google",
    refresh_token: refreshToken,
    user_id: existingUser?.id,
  };
  const { error } = await supabaseAdmin
    .from(TABLE)
    .upsert(row, { onConflict: "email,provider" });
  if (error) throw error;
}

export async function getGoogleRefreshToken(email: string): Promise<string | null> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const lowerEmail = email.toLowerCase();
  const existingUser = await getUserByEmail(lowerEmail).catch(() => null);
  // Prefer querying by user_id when available; fall back to email for legacy rows
  let q = supabaseAdmin
    .from(TABLE)
    .select("refresh_token")
    .eq("provider", "google");
  if (existingUser?.id) {
    q = q.eq("user_id", existingUser.id);
  } else {
    q = q.eq("email", lowerEmail);
  }
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return (data as any)?.refresh_token || null;
}


// Basic user table helpers for email/password auth
// Expected table schema `users` with columns:
// id (uuid, default gen), email (text, unique), first_name (text), last_name (text), password_hash (text), created_at (timestamptz)
const USERS_TABLE = "users";

export type AppUserRow = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  password_hash: string;
  created_at?: string;
};

export async function getUserByEmail(email: string): Promise<AppUserRow | null> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { data, error } = await supabaseAdmin
    .from(USERS_TABLE)
    .select("id,email,first_name,last_name,password_hash,created_at")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return (data as AppUserRow | null) || null;
}

export async function createUserWithEmailPassword(params: {
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
}): Promise<AppUserRow> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { email, firstName, lastName, password } = params;
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("Account already exists for this email");
  const password_hash = await hashPassword(password);
  const insertRow = {
    email: email.toLowerCase(),
    first_name: firstName || null,
    last_name: lastName || null,
    password_hash,
  } as Partial<AppUserRow>;
  const { data, error } = await supabaseAdmin
    .from(USERS_TABLE)
    .insert(insertRow)
    .select("id,email,first_name,last_name,password_hash,created_at")
    .single();
  if (error) throw error;
  return data as AppUserRow;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [saltHex, keyHex] = passwordHash.split(":");
  if (!saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const storedKey = Buffer.from(keyHex, "hex");
  const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;
  return timingSafeEqual(storedKey, derivedKey);
}


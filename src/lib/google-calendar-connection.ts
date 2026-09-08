import { createHash } from "node:crypto";
import { getGoogleRefreshToken } from "@/lib/db";
import { hasGoogleCalendarEventWriteScope } from "@/lib/google-calendar-oauth";

// Legacy Google sign-ins wrote identity-only tokens into oauth_tokens. Validate the
// actual grant without deleting records or revoking another account's Google grant.
const grants = new Map<string, { connected: boolean; expiresAt: number }>();
const pending = new Map<string, Promise<boolean>>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function validateGrant(refreshToken: string): Promise<boolean> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google Calendar is not configured");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body: { scope?: string; error?: string } = await response.json();
  if (!response.ok) {
    if (body.error === "invalid_grant") return false;
    throw new Error("Google Calendar permissions could not be verified");
  }
  return hasGoogleCalendarEventWriteScope(body.scope);
}

export async function getGoogleCalendarRefreshToken(email: string): Promise<string | null> {
  // Always check account storage first: disconnect must override even a cached grant.
  const refreshToken = await getGoogleRefreshToken(email);
  if (!refreshToken) return null;
  const key = createHash("sha256")
    .update(`${process.env.GOOGLE_CLIENT_ID || ""}:${refreshToken}`)
    .digest("hex");
  const cached = grants.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.connected ? refreshToken : null;
  let check = pending.get(key);
  if (!check) {
    check = validateGrant(refreshToken)
      .then((connected) => {
        if (grants.size >= 500) grants.clear();
        grants.set(key, { connected, expiresAt: Date.now() + CACHE_TTL_MS });
        return connected;
      })
      .finally(() => pending.delete(key));
    pending.set(key, check);
  }
  if (!(await check)) return null;
  // A disconnect or reconnect may complete while Google's permission check runs.
  return (await getGoogleRefreshToken(email)) === refreshToken ? refreshToken : null;
}

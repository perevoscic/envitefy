import { createHash } from "node:crypto";

type CalendarProvider = "google" | "microsoft";
type JsonRecord = Record<string, unknown>;

const emails = new Map<string, { email: string; expiresAt: number }>();
const pending = new Map<string, Promise<string | null>>();
const CACHE_TTL_MS = 5 * 60 * 1_000;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

async function lookupEmail(provider: CalendarProvider, refreshToken: string): Promise<string | null> {
  const isGoogle = provider === "google";
  const clientId = isGoogle ? process.env.GOOGLE_CLIENT_ID : process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = isGoogle ? process.env.GOOGLE_CLIENT_SECRET : process.env.OUTLOOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const tokenUrl = isGoogle
    ? "https://oauth2.googleapis.com/token"
    : `https://login.microsoftonline.com/${encodeURIComponent(process.env.OUTLOOK_TENANT_ID || "common")}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  if (!isGoogle) body.set("scope", "https://graph.microsoft.com/Calendars.ReadWrite");

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenResponse.ok) return null;
  const tokens = asRecord(await tokenResponse.json());
  if (typeof tokens.access_token !== "string" || !tokens.access_token) return null;

  // Google connections already request email permission. Outlook's default calendar
  // exposes its owner with the existing Calendar scope; no extra profile grant is needed.
  const response = await fetch(
    isGoogle
      ? "https://openidconnect.googleapis.com/v1/userinfo"
      : "https://graph.microsoft.com/v1.0/me/calendar?$select=owner",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) return null;
  const account = asRecord(await response.json());
  const email = isGoogle ? account.email : asRecord(account.owner).address;
  return typeof email === "string" && /^[^\s@]+@[^\s@]+$/.test(email.trim())
    ? email.trim()
    : null;
}

// The caller must use the signed-in owner's currently stored calendar token.
// Never fall back to the Envitefy login email: it may be a different account.
export async function getCalendarAccountEmail(
  provider: CalendarProvider,
  refreshToken: string,
): Promise<string | null> {
  const clientId = provider === "google" ? process.env.GOOGLE_CLIENT_ID : process.env.OUTLOOK_CLIENT_ID;
  const key = createHash("sha256").update(`${provider}:${clientId}:${refreshToken}`).digest("hex");
  const cached = emails.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.email;
  let lookup = pending.get(key);
  if (!lookup) {
    lookup = lookupEmail(provider, refreshToken)
      .then((email) => {
        if (email) {
          if (emails.size >= 500) emails.clear();
          emails.set(key, { email, expiresAt: Date.now() + CACHE_TTL_MS });
        }
        return email;
      })
      // A profile lookup failure must not mark a working calendar disconnected.
      .catch(() => null)
      .finally(() => pending.delete(key));
    pending.set(key, lookup);
  }
  return lookup;
}

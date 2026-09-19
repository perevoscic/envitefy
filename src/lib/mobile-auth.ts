import { createHash, randomBytes } from "node:crypto";
import { query } from "@/lib/db";
import {
  isMobileAuthRandom,
  MOBILE_AUTH_TTL_SECONDS,
  mobileReturnPath,
} from "./mobile-auth-contract";

export const mobileAuthEnabled = () => process.env.IOS_AUTH_ENABLED === "1";
export const mobileAuthHash = (value: string) =>
  createHash("sha256").update(value).digest("base64url");

export function mobileAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Mobile sign-in requires the configured authentication secret");
  return secret;
}

export function mobileAuthOrigin(): string {
  const url = new URL(process.env.NEXTAUTH_URL || "https://envitefy.com");
  if (
    url.protocol !== "https:" &&
    !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")
  ) {
    throw new Error("Mobile sign-in requires HTTPS");
  }
  return url.origin;
}

export function validMobilePost(request: Request, requireOrigin: boolean): boolean {
  const origin = request.headers.get("origin");
  return (
    request.headers.get("content-type")?.split(";")[0].trim() === "application/json" &&
    (origin ? origin === mobileAuthOrigin() : !requireOrigin) &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}

export async function readMobileAuthBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  // Bound the body even when Content-Length is missing or inaccurate.
  if (!request.body) return null;
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8192) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export async function issueMobileAuthCode(input: {
  userId: string;
  challenge: string;
  sessionToken: string;
  sessionExpires: Date;
  returnTo: string;
}): Promise<string | null> {
  if (!isMobileAuthRandom(input.challenge)) return null;
  const code = randomBytes(32).toString("base64url");
  // An atomic upsert enforces the quota across server instances and concurrent requests.
  const result = await query<{ code_hash: string }>(
    `
    WITH limited AS (
      INSERT INTO mobile_auth_rate_limits (user_id, window_start, attempts)
      VALUES ($1, to_timestamp(floor(extract(epoch from now()) / 600) * 600), 1)
      ON CONFLICT (user_id, window_start) DO UPDATE
        SET attempts = mobile_auth_rate_limits.attempts + 1
        WHERE mobile_auth_rate_limits.attempts < 20
      RETURNING user_id
    )
    INSERT INTO mobile_auth_codes (code_hash, user_id, challenge, session_token, session_expires, return_to, expires_at)
    SELECT $2, limited.user_id, $3, $4, $5, $6, now() + ($7 * interval '1 second')
    FROM limited RETURNING code_hash
  `,
    [
      input.userId,
      mobileAuthHash(code),
      input.challenge,
      input.sessionToken,
      input.sessionExpires,
      mobileReturnPath(input.returnTo),
      MOBILE_AUTH_TTL_SECONDS,
    ],
  );
  return result.rowCount ? code : null;
}

export async function consumeMobileAuthCode(code: string, verifier: string) {
  if (!isMobileAuthRandom(code) || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return null;
  // Atomically consume the code and erase its stored bearer credential.
  const result = await query<{
    session_token: string;
    session_expires: Date;
    return_to: string;
    user_id: string;
  }>(
    `
    WITH claimed AS (
      SELECT c.code_hash, c.session_token, c.session_expires, c.return_to, c.user_id
      FROM mobile_auth_codes c JOIN users u ON u.id = c.user_id
      WHERE c.code_hash = $1 AND c.challenge = $2 AND c.consumed_at IS NULL
        AND c.expires_at > now() AND c.session_expires > now()
      FOR UPDATE OF c
    ), consumed AS (
      UPDATE mobile_auth_codes c SET consumed_at = now(), session_token = NULL
      FROM claimed WHERE c.code_hash = claimed.code_hash AND c.consumed_at IS NULL RETURNING c.code_hash
    ) SELECT claimed.* FROM claimed JOIN consumed USING (code_hash)
  `,
    [mobileAuthHash(code), mobileAuthHash(verifier)],
  );
  return result.rows[0] || null;
}

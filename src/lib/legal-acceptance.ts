import { createHash } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/lib/legal-versions";

export const LEGAL_ACCEPTANCE_COOKIE_NAME = "envitefy_legal_acceptance";
const LEGAL_ACCEPTANCE_AUDIENCE = "envitefy-signup";
const LEGAL_ACCEPTANCE_ISSUER = "envitefy";
const LEGAL_ACCEPTANCE_MAX_AGE_SECONDS = 2 * 60 * 60;

export type LegalAcceptanceRecord = {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: string;
  source: "email_signup" | "google_signup";
  ipHash: string | null;
  userAgent: string | null;
};

function signingSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? "" : "envitefy-dev-legal-acceptance-secret");
  if (!secret) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required for legal acceptance");
  return new TextEncoder().encode(secret);
}

function hashIp(headers: Headers): string | null {
  const raw =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "";
  if (!raw) return null;
  return createHash("sha256")
    .update(`${raw}:${process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development"}`)
    .digest("hex");
}

function cleanUserAgent(value: string | null): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned.slice(0, 500) : null;
}

export async function createLegalAcceptanceToken(params: {
  headers: Headers;
  source: LegalAcceptanceRecord["source"];
}): Promise<{ token: string; record: LegalAcceptanceRecord }> {
  const acceptedAt = new Date().toISOString();
  const record: LegalAcceptanceRecord = {
    termsVersion: CURRENT_TERMS_VERSION,
    privacyVersion: CURRENT_PRIVACY_VERSION,
    acceptedAt,
    source: params.source,
    ipHash: hashIp(params.headers),
    userAgent: cleanUserAgent(params.headers.get("user-agent")),
  };

  const token = await new SignJWT(record)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(LEGAL_ACCEPTANCE_ISSUER)
    .setAudience(LEGAL_ACCEPTANCE_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${LEGAL_ACCEPTANCE_MAX_AGE_SECONDS}s`)
    .sign(signingSecret());

  return { token, record };
}

export async function verifyLegalAcceptanceToken(
  token: string | null | undefined,
): Promise<LegalAcceptanceRecord | null> {
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, signingSecret(), {
      issuer: LEGAL_ACCEPTANCE_ISSUER,
      audience: LEGAL_ACCEPTANCE_AUDIENCE,
    });
    const payload = verified.payload;
    if (
      payload.termsVersion !== CURRENT_TERMS_VERSION ||
      payload.privacyVersion !== CURRENT_PRIVACY_VERSION ||
      typeof payload.acceptedAt !== "string" ||
      (payload.source !== "email_signup" && payload.source !== "google_signup")
    ) {
      return null;
    }
    return {
      termsVersion: payload.termsVersion,
      privacyVersion: payload.privacyVersion,
      acceptedAt: payload.acceptedAt,
      source: payload.source,
      ipHash: typeof payload.ipHash === "string" ? payload.ipHash : null,
      userAgent: typeof payload.userAgent === "string" ? payload.userAgent : null,
    };
  } catch {
    return null;
  }
}

export function readCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const pair of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rawValue.join("="));
  }
  return null;
}

export const legalAcceptanceCookieMaxAge = LEGAL_ACCEPTANCE_MAX_AGE_SECONDS;

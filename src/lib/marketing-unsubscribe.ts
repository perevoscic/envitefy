import { jwtVerify, SignJWT } from "jose";

const ISSUER = "envitefy";
const AUDIENCE = "envitefy-marketing-unsubscribe";

function signingSecret(): Uint8Array {
  const secret =
    process.env.MARKETING_UNSUBSCRIBE_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "MARKETING_UNSUBSCRIBE_SECRET, AUTH_SECRET, or NEXTAUTH_SECRET is required for unsubscribe links",
    );
  }
  return new TextEncoder().encode(secret);
}

function publicOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export async function createMarketingUnsubscribeUrl(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const token = await new SignJWT({ email: normalizedEmail })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(signingSecret());
  return `${publicOrigin()}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export async function verifyMarketingUnsubscribeToken(token: string): Promise<string | null> {
  try {
    const verified = await jwtVerify(token, signingSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const email = typeof verified.payload.email === "string"
      ? verified.payload.email.trim().toLowerCase()
      : "";
    return email || null;
  } catch {
    return null;
  }
}

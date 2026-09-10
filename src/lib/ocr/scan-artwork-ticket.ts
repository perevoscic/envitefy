import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { ScanPersonalization } from "./personalization";

export const EARLY_ARTWORK_LIFETIME_MS = 180_000;

export type ScanArtworkTicket = {
  version: 1;
  eventId: string;
  token: string;
  userId: string;
  brief: string;
  expiresAt: number;
};

/** Match the image brief only; names and document text never enter the ticket. */
export function scanArtworkBriefKey(profile: ScanPersonalization): string {
  return createHash("sha256")
    .update(
      JSON.stringify([profile.subject, profile.medical, profile.age, [...profile.motifs].sort()]),
    )
    .digest("hex");
}

export function createScanArtworkTicket(userId: string, profile: ScanPersonalization) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  const claim: ScanArtworkTicket = {
    version: 1,
    eventId: randomUUID(),
    token: randomUUID(),
    userId,
    brief: scanArtworkBriefKey(profile),
    expiresAt: Date.now() + EARLY_ARTWORK_LIFETIME_MS,
  };
  const body = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const signature = createHmac("sha256", secret).update(`scan-artwork:${body}`).digest("base64url");
  return { claim, ticket: `${body}.${signature}` };
}

export function verifyScanArtworkTicket(
  value: unknown,
  userId: string,
  profile: ScanPersonalization,
): ScanArtworkTicket | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || typeof value !== "string" || value.length > 2048) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  const expected = createHmac("sha256", secret).update(`scan-artwork:${body}`).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const claim: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!claim || typeof claim !== "object") return null;
    const row = claim as Record<string, unknown>;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (
      row.version !== 1 ||
      row.userId !== userId ||
      row.brief !== scanArtworkBriefKey(profile) ||
      typeof row.eventId !== "string" ||
      !uuid.test(row.eventId) ||
      typeof row.token !== "string" ||
      !uuid.test(row.token) ||
      typeof row.expiresAt !== "number" ||
      row.expiresAt <= Date.now() ||
      row.expiresAt > Date.now() + EARLY_ARTWORK_LIFETIME_MS
    )
      return null;
    return {
      version: 1,
      eventId: row.eventId,
      token: row.token,
      userId,
      brief: row.brief,
      expiresAt: row.expiresAt,
    };
  } catch {
    return null;
  }
}

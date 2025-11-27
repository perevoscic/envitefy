import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(nodeScrypt);

export const EVENT_ACCESS_COOKIE_PREFIX = "event_access_";
export const EVENT_ACCESS_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const DEFAULT_SECRET = "envitefy-event-access-dev";

const toBuffer = (value: string) => Buffer.from(value, "hex");

export async function hashAccessCode(code: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(code, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyAccessCode(
  code: string,
  hashed: string | null | undefined
): Promise<boolean> {
  if (!hashed || typeof hashed !== "string") return false;
  const [saltHex, hashHex] = hashed.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = toBuffer(saltHex);
  const stored = toBuffer(hashHex);
  const derived = (await scrypt(code, salt, stored.length)) as Buffer;
  if (stored.length !== derived.length) return false;
  return timingSafeEqual(stored, derived);
}

export function getEventAccessCookieName(eventId: string): string {
  return `${EVENT_ACCESS_COOKIE_PREFIX}${eventId}`;
}

function resolveAccessSecret(): string {
  return (
    process.env.EVENT_ACCESS_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    DEFAULT_SECRET
  );
}

function signPayload(payload: string, passcodeHash: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(payload)
    .update(":")
    .update(passcodeHash)
    .digest("hex");
}

export function createEventAccessCookieValue(
  eventId: string,
  passcodeHash: string,
  secret: string = resolveAccessSecret()
): string {
  const issuedAt = Date.now();
  const payload = `${eventId}:${issuedAt}`;
  const signature = signPayload(payload, passcodeHash, secret);
  return `${issuedAt}.${signature}`;
}

export function verifyEventAccessCookieValue(
  value: string | undefined,
  eventId: string,
  passcodeHash: string,
  secret: string = resolveAccessSecret(),
  maxAgeMs: number = EVENT_ACCESS_COOKIE_MAX_AGE_MS
): boolean {
  if (!value || typeof value !== "string") return false;
  const [issuedAtStr, signature] = value.split(".");
  if (!issuedAtStr || !signature) return false;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return false;
  const age = Date.now() - issuedAt;
  if (age < 0 || age > maxAgeMs) return false;
  const expected = signPayload(`${eventId}:${issuedAtStr}`, passcodeHash, secret);
  try {
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export type StoredAccessControl = {
  mode?: string;
  requirePasscode?: boolean;
  passcodeHash?: string | null;
  passcodeHint?: string | null;
  passcodeUpdatedAt?: string | null;
  lockCopyVersion?: string | null;
};

export async function normalizeAccessControlPayload(
  incoming: any,
  existing?: StoredAccessControl | null
): Promise<StoredAccessControl | null> {
  if (!incoming || typeof incoming !== "object") {
    return existing || null;
  }
  const mode =
    typeof incoming.mode === "string"
      ? incoming.mode
      : existing?.mode || "access-code";
  const lockCopyVersion =
    typeof incoming.lockCopyVersion === "string"
      ? incoming.lockCopyVersion
      : existing?.lockCopyVersion || null;
  const passcodeHintRaw =
    typeof incoming.passcodeHint === "string"
      ? incoming.passcodeHint.trim()
      : undefined;
  const passcodeHint =
    passcodeHintRaw !== undefined
      ? passcodeHintRaw || null
      : existing?.passcodeHint || null;
  const passcodePlain =
    typeof incoming.passcodePlain === "string"
      ? incoming.passcodePlain.trim()
      : "";

  let requirePasscode = mode === "access-code";
  let passcodeHash = existing?.passcodeHash || null;
  let passcodeUpdatedAt = existing?.passcodeUpdatedAt || null;

  if (!requirePasscode) {
    passcodeHash = null;
    passcodeUpdatedAt = null;
  } else if (passcodePlain) {
    passcodeHash = await hashAccessCode(passcodePlain);
    passcodeUpdatedAt = new Date().toISOString();
  } else if (!passcodeHash) {
    requirePasscode = false;
  }

  return {
    mode,
    requirePasscode,
    passcodeHash,
    passcodeHint,
    passcodeUpdatedAt,
    lockCopyVersion,
  };
}

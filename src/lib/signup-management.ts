import { createHmac, timingSafeEqual } from "node:crypto";
import type { SignupForm, SignupResponse } from "@/types/signup";

export const SIGNUP_MANAGEMENT_MAX_AGE = 60 * 60 * 24 * 30;
export const signupManagementCookieName = (eventId: string) => `envitefy_signup_manage_${eventId}`;

function secret(): string {
  const value =
    process.env.SIGNUP_MANAGEMENT_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!value) throw new Error("Signup management requires an authentication secret.");
  return value;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(`signup-management:v1:${value}`).digest("base64url");
}

export function normalizeSignupContact(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254) return trimmed;
  if (!/^[+\d\s().-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  // Normalize US numbers with or without their country code; require full numbers.
  return digits.length === 10
    ? `1${digits}`
    : digits.length >= 11 && digits.length <= 15
      ? digits
      : null;
}

function contactSignature(response: SignupResponse): string {
  return sign(
    JSON.stringify([
      response.id,
      response.createdAt,
      response.email?.trim().toLowerCase(),
      response.phone || "",
    ]),
  );
}

/** Scoped to one response; changing its contacts revokes earlier emailed links. */
export function createSignupManagementToken(
  eventId: string,
  response: SignupResponse,
  now = Date.now(),
): string {
  const payload = Buffer.from(
    JSON.stringify([
      eventId,
      response.id,
      contactSignature(response),
      Math.floor(now / 1000) + SIGNUP_MANAGEMENT_MAX_AGE,
    ]),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function managedSignupResponseId(
  token: string | null | undefined,
  eventId: string,
  form: SignupForm,
  now = Date.now(),
): string | null {
  if (!token || token.length > 2048) return null;
  const parts = token.split(".");
  if (
    parts.length !== 2 ||
    !/^[A-Za-z0-9_-]+$/.test(parts[0]) ||
    !/^[A-Za-z0-9_-]{43}$/.test(parts[1])
  )
    return null;
  try {
    const expected = Buffer.from(sign(parts[0]));
    const actual = Buffer.from(parts[1]);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const payload: unknown = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (
      !Array.isArray(payload) ||
      payload.length !== 4 ||
      payload[0] !== eventId ||
      typeof payload[1] !== "string" ||
      typeof payload[3] !== "number" ||
      payload[3] <= Math.floor(now / 1000)
    )
      return null;
    const response = form.responses.find(
      (entry) => entry.id === payload[1] && entry.status !== "cancelled",
    );
    return response && payload[2] === contactSignature(response) ? response.id : null;
  } catch {
    return null;
  }
}

export function readSignupManagementToken(request: Request, eventId: string): string | null {
  const prefix = `${signupManagementCookieName(eventId)}=`;
  return (
    request.headers
      .get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix))
      ?.slice(prefix.length) || null
  );
}

/** Never derive email recovery URLs from an untrusted Host/forwarded-host header. */
export function signupManagementUrl(eventId: string, response: SignupResponse): string {
  const configured =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://envitefy.com";
  const url = new URL(`/smart-signup-form/${encodeURIComponent(eventId)}/manage`, configured);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Invalid signup management origin.");
  url.hash = `token=${createSignupManagementToken(eventId, response)}`;
  return url.toString();
}

export const signupRecoveryLimitKey = (value: string): string => sign(`rate:${value}`);

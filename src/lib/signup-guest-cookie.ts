import { createHash, randomBytes } from "node:crypto";

export const signupGuestCookieName = (eventId: string) => `envitefy_signup_${eventId}`;
export const createSignupGuestToken = () => randomBytes(32).toString("base64url");

/** Possession of an unguessable HttpOnly cookie, never an email or response ID, authorizes edits. */
export function signupGuestId(token?: string | null): string | null {
  return token && /^[A-Za-z0-9_-]{43}$/.test(token)
    ? createHash("sha256").update(token).digest("hex")
    : null;
}

export function readSignupGuestToken(request: Request, eventId: string): string | null {
  const name = signupGuestCookieName(eventId);
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return signupGuestId(token) ? token || null : null;
}

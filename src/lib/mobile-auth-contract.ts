/** Shared wire contract for the iOS system-browser sign-in handoff. */
export const MOBILE_AUTH_SCHEME = "envitefy";
export const MOBILE_AUTH_TTL_SECONDS = 90;
export const MOBILE_AUTH_RANDOM_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function mobileReturnPath(value: string | null | undefined): string {
  if (!value || value.length > 2048 || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (/[\\\u0000-\u0020]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://envitefy.com");
    if (url.origin !== "https://envitefy.com" || /^\/(?:api|mobile)(?:\/|$)/.test(url.pathname))
      return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function isMobileAuthRandom(value: unknown): value is string {
  return typeof value === "string" && MOBILE_AUTH_RANDOM_PATTERN.test(value);
}

export function mobileAuthCallback(code: string, state: string): string {
  if (!isMobileAuthRandom(code) || !isMobileAuthRandom(state))
    throw new Error("Invalid sign-in handoff");
  return `${MOBILE_AUTH_SCHEME}://auth/callback?${new URLSearchParams({ code, state })}`;
}

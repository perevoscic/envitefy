// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_UNAUTH_PATHS = new Set([
  "/",
  "/landing",
  "/open",
  "/about",
  "/how-it-works",
  "/who-its-for",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/verify-request",
  "/forgot",
  "/reset",
  "/snap",
]);

const RESERVED_EVENT_PATHS = new Set([
  "new",
  "appointments",
  "baby-showers",
  "birthdays",
  "sport-events",
  "weddings",
]);

const stripTrailingSlash = (pathname: string) => {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
};

const isEventSharePath = (pathname: string) => {
  const normalized = stripTrailingSlash(pathname);
  if (!normalized.startsWith("/event/")) return false;
  const segments = normalized.split("/").filter(Boolean);
  return (
    segments.length === 2 &&
    segments[0] === "event" &&
    !RESERVED_EVENT_PATHS.has(segments[1])
  );
};

const isSmartSignupSharePath = (pathname: string) => {
  const normalized = stripTrailingSlash(pathname);
  return /^\/smart-signup-form\/[^/]+$/.test(normalized);
};

const isAllowedForUnauth = (pathname: string) => {
  const normalized = stripTrailingSlash(pathname);
  if (PUBLIC_UNAUTH_PATHS.has(normalized)) return true;
  if (isEventSharePath(normalized)) return true;
  if (isSmartSignupSharePath(normalized)) return true;
  return false;
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // helper to return with a marker header
  const ok = () => {
    const res = NextResponse.next();
    res.headers.set("x-mw-version", "v2");  // <<< marker
    return res;
  };
  const redirectWithMarker = (url: URL, status = 302) => {
    const res = NextResponse.redirect(url, status);
    res.headers.set("x-mw-version", "v2");
    return res;
  };

  // // Redirect legacy www.envitefy.com to envitefy.com
  // const host = req.headers.get("host");
  // if (host === "www.envitefy.com") {
  //   const url = req.nextUrl.clone();
  //   url.hostname = "envitefy.com";
  //   url.protocol = "https:";
  //   return redirectWithMarker(url, 301);
  // }

  // NEW 10/29/25 Redirect legacy www.envitefy.com to envitefy.com
  const rawHost =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "";
  const cleanHost = rawHost.split(":")[0];
  const forwardedProto =
    req.headers.get("x-forwarded-proto") ??
    req.nextUrl.protocol.replace(/:$/, "");

  if (cleanHost === "www.envitefy.com") {
    const target = new URL(
      `https://envitefy.com${req.nextUrl.pathname}${req.nextUrl.search}`,
    );
    return redirectWithMarker(target, 301);
  }

  if (forwardedProto === "http" && cleanHost === "envitefy.com") {
    const target = new URL(
      `https://envitefy.com${req.nextUrl.pathname}${req.nextUrl.search}`,
    );
    return redirectWithMarker(target, 301);
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return ok();
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: req as any, secret });
  let hasSession = Boolean(token);

  if (!hasSession) {
    // Fallback: some browsers omit the JWT when the secret mismatches or during race conditions.
    // Checking for the session cookie prevents flashing the public landing page for signed-in users.
    const sessionCookie =
      req.cookies.get("__Secure-next-auth.session-token") ??
      req.cookies.get("__Host-next-auth.session-token") ??
      req.cookies.get("next-auth.session-token");
    hasSession = Boolean(sessionCookie?.value);
  }

  if (!hasSession) {
    if (!isAllowedForUnauth(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return redirectWithMarker(url, 302);
    }
  }

  // Allow direct access to /landing without redirecting back to /
  if (pathname === "/landing") {
    return ok();
  }

  if (pathname === "/verify-request") {
    return ok();
  }

  if (pathname === "/snap" || pathname.startsWith("/snap/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return redirectWithMarker(url, 308);
  }

  // Protect calendar/subscription pages when not signed in
  const protectedPrefixes = ["/calendar", "/subscription"];
  for (const prefix of protectedPrefixes) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      if (!hasSession) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return redirectWithMarker(url, 302);
      }
      break;
    }
  }

  // Public homepage at "/":
  // - authenticated users stay on "/"
  // - unauthenticated users see landing content (rewrite)
  if (pathname === "/") {
    if (!hasSession) {
      // Render landing content at "/" without changing the URL
      const url = req.nextUrl.clone();
      url.pathname = "/landing";
      const res = NextResponse.rewrite(url);
      res.headers.set("x-mw-version", "v2");
      return res;
    }
    // Signed-in users stay on "/" without a redirect
    return ok();
  }

  // Optional: redirect legacy /signup to the public homepage
  if (pathname === "/signup") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return redirectWithMarker(url, 308);
  }

  return ok();
}

export const config = { matcher: ["/((?!_next|api|public|icons|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|webmanifest)).*)"] };

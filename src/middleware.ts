// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { DISABLED_EVENT_ROUTE_PREFIXES } from "@/config/feature-visibility";
import { hasProductScope } from "@/lib/product-scopes";

const PUBLIC_UNAUTH_PATHS = new Set([
  "/",
  "/studio",
  "/landing",
  "/gymnastics",
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
  "/showcase",
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
  return segments.length === 2 && segments[0] === "event" && !RESERVED_EVENT_PATHS.has(segments[1]);
};

const isSmartSignupSharePath = (pathname: string) => {
  const normalized = stripTrailingSlash(pathname);
  return /^\/smart-signup-form\/[^/]+$/.test(normalized);
};

const isStudioCardSharePath = (pathname: string) => {
  const normalized = stripTrailingSlash(pathname);
  return /^\/card\/[^/]+$/.test(normalized);
};

const isLandingShowcasePath = (pathname: string) => {
  const normalized = stripTrailingSlash(pathname);
  return /^\/showcase\/[^/]+$/.test(normalized);
};

const isAllowedForUnauth = (pathname: string) => {
  const normalized = stripTrailingSlash(pathname);
  if (PUBLIC_UNAUTH_PATHS.has(normalized)) return true;
  if (isEventSharePath(normalized)) return true;
  if (isSmartSignupSharePath(normalized)) return true;
  if (isStudioCardSharePath(normalized)) return true;
  if (isLandingShowcasePath(normalized)) return true;
  return false;
};

const matchesPathPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const getSessionCookie = (req: NextRequest) =>
  req.cookies.get("__Secure-next-auth.session-token") ??
  req.cookies.get("__Host-next-auth.session-token") ??
  req.cookies.get("next-auth.session-token");

const attachSignupSourceCookie = (res: NextResponse, source: "snap" | "gymnastics") => {
  res.cookies.set("envitefy_signup_source", source, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const normalizedPathname = stripTrailingSlash(pathname);

  // helper to return with a marker header
  const ok = () => {
    const res = NextResponse.next();
    res.headers.set("x-mw-version", "v2"); // <<< marker
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
  const rawHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const cleanHost = rawHost.split(":")[0];
  const forwardedProto =
    req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(/:$/, "");

  if (cleanHost === "www.envitefy.com") {
    const target = new URL(`https://envitefy.com${req.nextUrl.pathname}${req.nextUrl.search}`);
    return redirectWithMarker(target, 301);
  }

  if (forwardedProto === "http" && cleanHost === "envitefy.com") {
    const target = new URL(`https://envitefy.com${req.nextUrl.pathname}${req.nextUrl.search}`);
    return redirectWithMarker(target, 301);
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/videos/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return ok();
  }

  const queryAuthMode = req.nextUrl.searchParams.get("auth");

  if (
    queryAuthMode === "signup" &&
    normalizedPathname !== "/snap" &&
    normalizedPathname !== "/gymnastics"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/snap";
    url.searchParams.delete("auth");
    return redirectWithMarker(url, 308);
  }

  if (
    normalizedPathname === "/football" ||
    normalizedPathname === "/event/football" ||
    normalizedPathname.startsWith("/event/football/") ||
    normalizedPathname.startsWith("/event/football-season")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/gymnastics";
    url.search = "";
    return redirectWithMarker(url, 308);
  }

  if (
    normalizedPathname === "/event/new" ||
    DISABLED_EVENT_ROUTE_PREFIXES.some((prefix) =>
      matchesPathPrefix(normalizedPathname, prefix)
    )
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/event/gymnastics";
    url.search = "";
    return redirectWithMarker(url, 308);
  }

  if (pathname === "/signup") {
    const url = req.nextUrl.clone();
    url.pathname = "/snap";
    return redirectWithMarker(url, 308);
  }

  // The snap landing itself does not expose private data, so the route only
  // needs a session cookie presence check instead of full JWT parsing.
  if (normalizedPathname === "/event") {
    if (!getSessionCookie(req)?.value) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return redirectWithMarker(url, 302);
    }
    return ok();
  }

  const resolveAuthState = async () => {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie?.value) return { hasSession: false, token: null as any };

    const secret =
      process.env.AUTH_SECRET ??
      process.env.NEXTAUTH_SECRET ??
      (process.env.NODE_ENV === "production" ? undefined : "dev-build-secret");

    try {
      const token = await getToken({ req, secret });
      if (token) return { hasSession: true, token };
    } catch {
      // fall through to cookie fallback
    }

    // Fallback: some browsers omit the JWT when the secret mismatches or during races.
    return { hasSession: Boolean(sessionCookie.value), token: null as any };
  };

  if (
    normalizedPathname === "/landing" ||
    normalizedPathname === "/snap" ||
    normalizedPathname === "/gymnastics"
  ) {
    const authState = await resolveAuthState();
    if (authState.hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return redirectWithMarker(url, 302);
    }
    if (normalizedPathname === "/snap" || normalizedPathname === "/gymnastics") {
      const response = ok();
      return attachSignupSourceCookie(
        response,
        normalizedPathname === "/gymnastics" ? "gymnastics" : "snap",
      );
    }
    return ok();
  }

  if (pathname === "/") {
    const authState = await resolveAuthState();
    if (!authState.hasSession) {
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

  // Public unauth routes bypass token parsing entirely.
  if (isAllowedForUnauth(pathname)) {
    return ok();
  }

  const authState = await resolveAuthState();
  if (!authState.hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return redirectWithMarker(url, 302);
  }

  if (
    normalizedPathname === "/event/gymnastics" ||
    normalizedPathname.startsWith("/event/gymnastics/")
  ) {
    if (!hasProductScope(authState.token?.productScopes, "gymnastics")) {
      const url = req.nextUrl.clone();
      url.pathname = "/event";
      url.search = "";
      return redirectWithMarker(url, 302);
    }
  }

  return ok();
}

export const config = {
  matcher: [
    "/((?!_next|api|public|icons|videos|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|webmanifest|mp4|webm)).*)",
  ],
};

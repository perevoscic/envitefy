// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // helper to return with a marker header
  const ok = () => {
    const res = NextResponse.next();
    res.headers.set("x-mw-version", "v2");  // <<< marker
    return res;
  };

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return ok();
  }

  const hasSession =
    req.cookies.has("__Secure-next-auth.session-token") ||
    req.cookies.has("next-auth.session-token");

  // Hide landing from authenticated users
  if (pathname === "/landing") {
    if (hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url, 308);
    }
    return ok();
  }

  if (pathname === "/verify-request") {
    return ok();
  }

  // Redirect signed-out users who visit the homepage to the public landing page
  if (pathname === "/") {
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/landing";
      return NextResponse.redirect(url, 308);
    }
    return ok();
  }

  // Optional: redirect legacy /signup to the public landing page
  if (pathname === "/signup") {
    const url = req.nextUrl.clone();
    url.pathname = "/landing";
    return NextResponse.redirect(url, 308);
  }

  return ok();
}

export const config = { matcher: ["/((?!_next|api|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map)).*)"] };

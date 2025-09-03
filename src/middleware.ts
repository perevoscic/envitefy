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
    if (pathname === "/signup") {
      const url = req.nextUrl.clone();
      url.pathname = "/landing";
      return NextResponse.redirect(url);
    }
    return ok();
  }

  if (pathname === "/landing" || pathname === "/verify-request") {
    return ok();
  }

  if (pathname === "/") {
    const hasSession =
      req.cookies.has("__Secure-next-auth.session-token") ||
      req.cookies.has("next-auth.session-token");

    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/landing";
      return NextResponse.redirect(url);
    }
  }

  return ok();
}

export const config = { matcher: ["/", "/signup"] };

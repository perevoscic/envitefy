import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow APIs and static
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    // Legacy /signup -> /landing
    if (pathname === "/signup") {
      const url = req.nextUrl.clone();
      url.pathname = "/landing";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Public pages
  if (pathname === "/landing" || pathname === "/verify-request") {
    return NextResponse.next();
  }

  // Only protect "/"
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/signup"],
};

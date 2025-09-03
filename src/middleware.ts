import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow static and APIs
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/public/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    // Legacy /signup -> /landing redirect (kept from your version)
    if (pathname === "/signup") {
      const url = req.nextUrl.clone();
      url.pathname = "/landing";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Public pages
  const publicPaths = new Set<string>(["/landing", "/verify-request"]);
  if (publicPaths.has(pathname)) return NextResponse.next();

  // Only protect the home page "/"
  if (pathname === "/") {
    // NextAuth JWT cookie names:
    //  - production (secure): "__Secure-next-auth.session-token"
    //  - dev/non-https: "next-auth.session-token"
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
  // Only run on "/" and "/signup" (your original intent)
  matcher: ["/", "/signup"],
};

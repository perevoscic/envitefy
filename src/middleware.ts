// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: req as any, secret });
  const hasSession = Boolean(token);

  // Allow direct access to /landing without redirecting back to /
  if (pathname === "/landing") {
    return ok();
  }

  if (pathname === "/verify-request") {
    return ok();
  }

  // Require authentication for the snap experience
  if (pathname.startsWith("/snap") && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/landing";
    return NextResponse.redirect(url, 302);
  }

  // Public homepage at "/":
  // - authenticated users go to "/snap"
  // - unauthenticated users see landing content (rewrite)
  if (pathname === "/") {
    if (hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/subscription";
      return NextResponse.redirect(url, 302);
    }
    // Render landing content at "/" without changing the URL
    const url = req.nextUrl.clone();
    url.pathname = "/landing";
    const res = NextResponse.rewrite(url);
    res.headers.set("x-mw-version", "v2");
    return res;
  }

  // Optional: redirect legacy /signup to the public homepage
  if (pathname === "/signup") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url, 308);
  }

  return ok();
}

export const config = { matcher: ["/((?!_next|api|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map)).*)"] };

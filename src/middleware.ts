import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Public paths: allow access without auth
  const publicPaths = new Set([
    "/login",
    "/signup",
    "/verify-request",
    "/favicon.ico",
  ]);
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/public/") ||
    publicPaths.has(pathname)
  ) {
    return NextResponse.next();
  }

  // Only handle the home page: unauthenticated users go to public landing
  const shouldProtect = pathname === "/";
  if (!shouldProtect) return NextResponse.next();

  const token = await getToken({ req });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/landing";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};



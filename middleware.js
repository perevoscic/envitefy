// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host');
  // Redirect any "www" traffic to non-www
  if (host === 'www.envitefy.com') {
    return NextResponse.redirect(
      `https://envitefy.com${request.nextUrl.pathname}${request.nextUrl.search}`,
      301
    );
  }
  return NextResponse.next();
}

// Optional: limit to specific paths
export const config = {
  matcher: '/:path*',
};

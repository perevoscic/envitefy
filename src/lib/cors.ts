import { NextResponse } from "next/server";

const FALLBACK_ORIGIN = "https://envitefy.com";
const STATIC_ALLOWED_ORIGINS = buildAllowedOrigins();

function normalizeOrigin(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    try {
      return new URL(`https://${trimmed}`).origin;
    } catch {
      return null;
    }
  }
}

function buildAllowedOrigins(): string[] {
  const candidates = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.PUBLIC_BASE_URL,
    process.env.APP_URL,
    process.env.NEXTAUTH_URL,
    "https://envitefy.com",
    "https://www.envitefy.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://10.0.2.2:3000",
    "http://10.0.2.2:3001",
  ];
  const unique = new Set<string>();
  for (const value of candidates) {
    const origin = normalizeOrigin(value);
    if (origin) unique.add(origin);
  }
  return Array.from(unique);
}

function resolveCorsOrigin(request: Request): string {
  const requestOrigin = normalizeOrigin(request.headers.get("origin"));
  if (requestOrigin) {
    if (STATIC_ALLOWED_ORIGINS.includes(requestOrigin)) {
      return requestOrigin;
    }
    try {
      const reqUrl = new URL(request.url);
      const sameOrigin = `${reqUrl.protocol}//${reqUrl.host}`;
      if (requestOrigin === sameOrigin) return requestOrigin;
    } catch {
      // ignore invalid request URLs
    }
  }
  return STATIC_ALLOWED_ORIGINS[0] || FALLBACK_ORIGIN;
}

function createCorsHeaderMap(request: Request): Record<string, string> {
  const origin = resolveCorsOrigin(request);
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function withCors<T>(response: NextResponse<T>, request: Request): NextResponse<T> {
  const headers = createCorsHeaderMap(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function corsJson<T>(
  request: Request,
  body: T,
  init?: ResponseInit
): NextResponse<T> {
  const response = NextResponse.json(body, init);
  return withCors(response, request);
}

export function corsPreflight(request: Request): NextResponse<null> {
  const headers = createCorsHeaderMap(request);
  return new NextResponse(null, { status: 204, headers });
}

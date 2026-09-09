import { randomUUID } from "node:crypto";
import { decode, encode } from "next-auth/jwt";
import { NextRequest, type NextResponse } from "next/server";

type CalendarProvider = "google" | "microsoft" | "google-analytics";
type CalendarAccount = { userId: string; email: string };
const MAX_AGE = 10 * 60;

function stateSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("Calendar authorization requires an authentication secret");
  }
  return `${secret || "dev-build-secret"}:calendar-oauth`;
}

export function calendarOAuthCookieName(provider: CalendarProvider): string {
  return `envitefy_calendar_oauth_${provider}`;
}

export async function createCalendarOAuthState(
  account: CalendarAccount,
  provider: CalendarProvider,
  payload: string | null,
) {
  const nonce = randomUUID();
  const state = await encode({
    secret: stateSecret(),
    maxAge: MAX_AGE,
    token: {
      kind: "calendar-connect",
      userId: account.userId,
      email: account.email,
      provider,
      payload,
      nonce,
    },
  });
  return { state, nonce };
}

export async function readCalendarOAuthState(
  request: Request,
  account: CalendarAccount,
  provider: CalendarProvider,
): Promise<{ payload: string | null } | null> {
  const state = new URL(request.url).searchParams.get("state");
  const nonce = new NextRequest(request.url, { headers: request.headers }).cookies.get(
    calendarOAuthCookieName(provider),
  )?.value;
  if (!state || !nonce) return null;
  try {
    const token = await decode({ token: state, secret: stateSecret() });
    if (
      token?.kind !== "calendar-connect" ||
      token.provider !== provider ||
      token.nonce !== nonce ||
      token.userId !== account.userId ||
      token.email !== account.email ||
      typeof token.exp !== "number" ||
      token.exp <= Date.now() / 1000 ||
      (token.payload !== null && typeof token.payload !== "string")
    ) {
      return null;
    }
    return { payload: token.payload };
  } catch {
    return null;
  }
}

export function setCalendarOAuthCookie(
  response: NextResponse,
  provider: CalendarProvider,
  nonce: string,
) {
  response.cookies.set(calendarOAuthCookieName(provider), nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function finishCalendarOAuth(response: NextResponse, provider: CalendarProvider) {
  for (const name of [
    calendarOAuthCookieName(provider),
    ...(provider === "google-analytics" ? [] : [provider === "google" ? "g_refresh" : "o_refresh"]),
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

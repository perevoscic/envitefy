import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  generateSignupTheme,
  parseSignupThemeRequest,
  SignupThemeRequestError,
  type SignupThemeGenerationRequest,
} from "@/lib/signup-theme-generation";

export const runtime = "nodejs";
export const maxDuration = 300;
const MAX_BODY_BYTES = 3_000_000;
// Match the app's bounded, per-instance request throttling. Never store editor drafts here.
const requests = new Map<string, { count: number; resetAt: number; active: boolean }>();
const json = (body: object, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return json({ error: "Open Envitefy to create your theme." }, 403);
  const userId = await resolveSessionUserId(await getServerSession(authOptions));
  if (!userId)
    return json(
      { error: "Sign in to generate a custom theme. Your idea stays in the editor." },
      401,
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ error: "Send a theme description." }, 415);
  if (!process.env.OPENAI_API_KEY)
    return json(
      { error: "Custom theme generation is temporarily unavailable. Please try again later." },
      503,
    );
  let input: SignupThemeGenerationRequest;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Describe your theme first." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return json({ error: "Choose an inspiration image smaller than 2 MB." }, 413);
      }
      chunks.push(value);
    }
    input = parseSignupThemeRequest(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (error) {
    return json(
      {
        error:
          error instanceof SignupThemeRequestError
            ? error.message
            : "The theme request could not be read. Please try again.",
      },
      400,
    );
  }
  const now = Date.now();
  for (const [key, entry] of requests)
    if (entry.resetAt <= now && !entry.active) requests.delete(key);
  const previous = requests.get(userId);
  if (previous?.active || (previous && previous.count >= 6))
    return json(
      {
        error: previous.active
          ? "Your theme is still being created. Please wait for it to finish."
          : "You've created several themes. Please try again in a few minutes.",
      },
      429,
      {
        "Retry-After": String(
          Math.max(1, Math.ceil(((previous?.resetAt || now + 60_000) - now) / 1000)),
        ),
      },
    );
  if (requests.size >= 10_000 && !previous)
    return json({ error: "Theme generation is busy. Please try again shortly." }, 503);
  const entry = previous || { count: 0, resetAt: now + 10 * 60_000, active: false };
  entry.count += 1;
  entry.active = true;
  requests.set(userId, entry);
  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(260_000)]);
    return json(await generateSignupTheme(input, signal));
  } catch (error) {
    if (error instanceof SignupThemeRequestError) return json({ error: error.message }, 400);
    return json(
      {
        error: "We couldn't finish your theme. Your current design is unchanged. Please try again.",
      },
      502,
    );
  } finally {
    entry.active = false;
  }
}

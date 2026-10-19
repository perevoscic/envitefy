import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { checkCreationAccess } from "@/lib/creation-access-server";
import {
  classifyCreateSource,
  CreateClassifyRequestError,
  type CreateClassifyInput,
  parseCreateClassifyInput,
} from "@/lib/create/classify-source";

export const runtime = "nodejs";
export const maxDuration = 60;
// Five 2 MB photos or one 8 MB PDF, base64 encoded, plus a description.
const MAX_BODY_BYTES = 15_000_000;
// Bounded, per-instance throttling; nothing about the request is stored.
const requests = new Map<string, { count: number; resetAt: number }>();
const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return json({ error: "Open Envitefy to create your event." }, 403);
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Sign in to create an event." }, 401);
  const userId = await resolveSessionUserId(session);
  if (!userId) return json({ error: "We couldn't verify your account right now. Please try again." }, 503);
  const denied = await checkCreationAccess(userId, { product: "event_page" });
  if (denied) return denied;
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ error: "Add a file, link or description first." }, 415);

  const now = Date.now();
  for (const [key, entry] of requests) if (entry.resetAt <= now) requests.delete(key);
  const entry = requests.get(userId) || { count: 0, resetAt: now + 10 * 60_000 };
  if (entry.count >= 30)
    return json({ error: "You've started several events. Please try again in a few minutes." }, 429);
  if (requests.size >= 10_000 && !requests.has(userId))
    return json({ error: "Envitefy is busy. Please try again shortly." }, 503);
  entry.count += 1;
  requests.set(userId, entry);

  let input: CreateClassifyInput;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Add a file, link or description first." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return json({ error: "Choose up to five photos under 2 MB each, or one PDF under 8 MB." }, 413);
      }
      chunks.push(value);
    }
    input = parseCreateClassifyInput(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (error) {
    return json(
      {
        error:
          error instanceof CreateClassifyRequestError
            ? error.message
            : "That request could not be read. Please try again.",
      },
      400,
    );
  }

  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(45_000)]);
    return json(await classifyCreateSource(input, signal));
  } catch (error) {
    if (error instanceof CreateClassifyRequestError) return json({ error: error.message }, 400);
    return json({ error: "We couldn't read that right now. Choose what you're planning below." }, 502);
  }
}

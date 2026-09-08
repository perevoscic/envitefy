import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAndPersistInvitation, invitationResponseStream } from "@/lib/studio/generation-response";
import { resolveStudioProvider } from "@/lib/studio/provider";
import { parseStudioGenerateRequest, type StudioGenerateFailureResponse } from "@/lib/studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Hobby with Fluid compute supports at most 300 seconds per function.
export const maxDuration = 300;

function buildFailureResponse(
  status: number,
  code: string,
  message: string,
  retryable: boolean,
): NextResponse<StudioGenerateFailureResponse> {
  const provider = resolveStudioProvider();
  return NextResponse.json(
    {
      ok: false,
      mode: "both",
      liveCard: null,
      invitation: null,
      imageDataUrl: null,
      imageUrl: null,
      warnings: [],
      errors: {
        text: {
          code,
          message,
          retryable,
          provider,
          status,
        },
      },
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions as any);
    if (!session?.user) {
      return buildFailureResponse(401, "unauthorized", "Unauthorized", false);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return buildFailureResponse(400, "invalid_json", "Invalid JSON body.", false);
    }

    const parsed = parseStudioGenerateRequest(body);
    if (!parsed.ok) {
      return buildFailureResponse(400, "invalid_request", parsed.error, false);
    }

    if (request.headers.get("accept")?.includes("application/x-ndjson")) {
      return new Response(invitationResponseStream(
        (options) => generateAndPersistInvitation(parsed.value, options), request.signal,
      ), { headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      } });
    }
    const result = await generateAndPersistInvitation(parsed.value, { signal: request.signal });
    return NextResponse.json(result);

  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return buildFailureResponse(500, "internal_error", message || "Internal server error", true);
  }
}

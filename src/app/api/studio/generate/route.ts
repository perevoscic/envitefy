import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateStudioInvitation } from "@/lib/studio/generate";
import { parseStudioGenerateRequest, type StudioGenerateFailureResponse } from "@/lib/studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildFailureResponse(
  status: number,
  code: string,
  message: string,
  retryable: boolean,
): NextResponse<StudioGenerateFailureResponse> {
  return NextResponse.json(
    {
      ok: false,
      mode: "both",
      liveCard: null,
      invitation: null,
      imageDataUrl: null,
      warnings: [],
      errors: {
        text: {
          code,
          message,
          retryable,
          provider: "gemini",
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

    const result = await generateStudioInvitation(parsed.value);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return buildFailureResponse(500, "internal_error", message || "Internal server error", true);
  }
}

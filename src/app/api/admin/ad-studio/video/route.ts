import { NextResponse } from "next/server";
import {
  AdminAdStudioGenerationError,
  adStudioFailure,
  generateAdminAdStudioVideo,
  parseAdminAdStudioVideoRequest,
} from "@/lib/admin/ad-studio";
import type { AdminAdStudioVideoResponse } from "@/lib/admin/ad-studio-types";
import { AdminRouteError, requireAdminSession } from "@/lib/admin/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failureResponse(
  status: number,
  code: string,
  message: string,
  retryable: boolean,
): NextResponse<AdminAdStudioVideoResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        retryable,
      },
    },
    { status },
  );
}

export async function POST(request: Request): Promise<NextResponse<AdminAdStudioVideoResponse>> {
  try {
    await requireAdminSession();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return failureResponse(400, "invalid_json", "Invalid JSON body.", false);
    }

    const parsed = parseAdminAdStudioVideoRequest(body);
    if (!parsed.ok) {
      return failureResponse(400, "invalid_request", parsed.error, false);
    }

    const result = await generateAdminAdStudioVideo(parsed.value);
    return NextResponse.json({
      ok: true,
      runId: result.runId,
      video: result.video,
      warnings: result.warnings,
    });
  } catch (error) {
    if (error instanceof AdminRouteError) {
      return failureResponse(
        error.status,
        error.status === 401 ? "unauthorized" : "forbidden",
        error.message,
        false,
      );
    }
    if (error instanceof AdminAdStudioGenerationError) {
      return NextResponse.json(adStudioFailure(error), { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to render ad video.";
    return failureResponse(500, "internal_error", message, true);
  }
}

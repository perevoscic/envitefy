import { NextResponse } from "next/server";
import {
  AdminAdStudioGenerationError,
  generateAdminAdStudioConfig,
  parseAdminAdStudioGenerateRequest,
} from "@/lib/admin/ad-studio";
import type { AdminAdStudioGenerateResponse } from "@/lib/admin/ad-studio-types";
import { AdminRouteError, requireAdminSession } from "@/lib/admin/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failureResponse(
  status: number,
  code: string,
  message: string,
  retryable: boolean,
): NextResponse<AdminAdStudioGenerateResponse> {
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

export async function POST(request: Request): Promise<NextResponse<AdminAdStudioGenerateResponse>> {
  try {
    await requireAdminSession();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return failureResponse(400, "invalid_json", "Invalid JSON body.", false);
    }

    const parsed = parseAdminAdStudioGenerateRequest(body);
    if (!parsed.ok) {
      return failureResponse(400, "invalid_request", parsed.error, false);
    }

    const result = await generateAdminAdStudioConfig(parsed.value);
    return NextResponse.json({
      ok: true,
      provider: "gemini",
      model: result.model,
      runId: result.runId,
      ad: result.ad,
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
      return failureResponse(error.status, error.code, error.message, error.retryable);
    }
    const message = error instanceof Error ? error.message : "Failed to generate ad";
    return failureResponse(500, "internal_error", message, true);
  }
}

import { NextResponse } from "next/server";
import {
  AdminAdStudioGenerationError,
  adStudioFailure,
  generateAdminAdStudioImages,
  parseAdminAdStudioImagesRequest,
} from "@/lib/admin/ad-studio";
import type { AdminAdStudioImagesResponse } from "@/lib/admin/ad-studio-types";
import { AdminRouteError, requireAdminSession } from "@/lib/admin/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failureResponse(
  status: number,
  code: string,
  message: string,
  retryable: boolean,
): NextResponse<AdminAdStudioImagesResponse> {
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

export async function POST(request: Request): Promise<NextResponse<AdminAdStudioImagesResponse>> {
  try {
    await requireAdminSession();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return failureResponse(400, "invalid_json", "Invalid JSON body.", false);
    }

    const parsed = parseAdminAdStudioImagesRequest(body);
    if (!parsed.ok) {
      return failureResponse(400, "invalid_request", parsed.error, false);
    }

    const result = await generateAdminAdStudioImages(parsed.value);
    return NextResponse.json({
      ok: true,
      runId: result.runId,
      provider: result.campaign.providerModels.imageProvider,
      model: result.model,
      campaign: result.campaign,
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
    const message = error instanceof Error ? error.message : "Failed to generate ad images.";
    return failureResponse(500, "internal_error", message, true);
  }
}

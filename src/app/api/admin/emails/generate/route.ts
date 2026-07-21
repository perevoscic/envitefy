import { NextResponse } from "next/server";
import {
  generateAdminEmailDraft,
  parseAdminEmailGenerationRequest,
} from "@/lib/admin/email-generator";
import { AdminRouteError, requireAdminSession } from "@/lib/admin/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminEmailGenerateResponse =
  | {
      ok: true;
      model: string;
      draft: Awaited<ReturnType<typeof generateAdminEmailDraft>>["draft"];
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        retryable: boolean;
      };
    };

function failureResponse(
  status: number,
  code: string,
  message: string,
  retryable: boolean,
): NextResponse<AdminEmailGenerateResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message, retryable },
    },
    { status },
  );
}

export async function POST(request: Request): Promise<NextResponse<AdminEmailGenerateResponse>> {
  try {
    await requireAdminSession();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return failureResponse(400, "invalid_json", "Invalid JSON body.", false);
    }

    const parsed = parseAdminEmailGenerationRequest(body);
    if (!parsed.ok) {
      return failureResponse(400, "invalid_request", parsed.error, false);
    }

    const result = await generateAdminEmailDraft(parsed.value);
    return NextResponse.json({
      ok: true,
      model: result.model,
      draft: result.draft,
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

    const message = error instanceof Error ? error.message : "Failed to generate email.";
    const openAiMissing = /OPENAI_API_KEY|OpenAI is not configured/i.test(message);
    const blobMissing = /BLOB_READ_WRITE_TOKEN|Vercel Blob|blob store/i.test(message);
    console.error("[admin-email] generate route failed", {
      message,
      code: openAiMissing
        ? "openai_not_configured"
        : blobMissing
          ? "blob_not_configured"
          : "generation_failed",
      name: error instanceof Error ? error.name : "Error",
    });
    return failureResponse(
      openAiMissing || blobMissing ? 503 : 500,
      openAiMissing
        ? "openai_not_configured"
        : blobMissing
          ? "blob_not_configured"
          : "generation_failed",
      message,
      !openAiMissing && !blobMissing,
    );
  }
}

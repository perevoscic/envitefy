import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateStudioInvitation } from "@/lib/studio/generate";
import { resolveStudioProvider } from "@/lib/studio/provider";
import { parseStudioGenerateRequest, type StudioGenerateFailureResponse } from "@/lib/studio/types";
import { processBufferUpload } from "@/lib/media-upload";
import { parseDataUrlBase64 } from "@/utils/data-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const result = await generateStudioInvitation(parsed.value);
    if (!result.imageDataUrl) {
      return NextResponse.json(result, { status: 200 });
    }

    const parsedImage = parseDataUrlBase64(result.imageDataUrl);
    if (!parsedImage) {
      return NextResponse.json(
        {
          ...result,
          warnings: [...result.warnings, "Generated image could not be persisted; using inline image."],
        },
        { status: 200 },
      );
    }

    try {
      const uploaded = await processBufferUpload({
        bytes: Buffer.from(parsedImage.base64Payload, "base64"),
        fileName: "studio-generated-image.png",
        mimeType: parsedImage.mimeType || "image/png",
        usage: "header",
      });

      return NextResponse.json(
        {
          ...result,
          imageUrl: uploaded.stored.display?.url || uploaded.stored.source?.url || null,
          imageDataUrl: null,
        },
        { status: 200 },
      );
    } catch {
      return NextResponse.json(
        {
          ...result,
          warnings: [...result.warnings, "Generated image persistence failed; using inline image."],
        },
        { status: 200 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return buildFailureResponse(500, "internal_error", message || "Internal server error", true);
  }
}

import { NextResponse } from "next/server";
import {
  generateMarketingPromptIdea,
  parseMarketingPromptIdeaRequest,
} from "@/lib/admin/marketing-prompt-agent";
import { AdminRouteError, requireAdminSession } from "@/lib/admin/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = parseMarketingPromptIdeaRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await generateMarketingPromptIdea(parsed.value);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof AdminRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message =
      error instanceof Error ? error.message : "Failed to generate a marketing prompt.";
    const unavailable = /OPENAI_API_KEY|OpenAI is not configured/i.test(message);
    console.error("[marketing-prompt-agent] generation failed", { message });
    return NextResponse.json({ error: message }, { status: unavailable ? 503 : 500 });
  }
}

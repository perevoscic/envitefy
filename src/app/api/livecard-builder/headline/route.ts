import { NextResponse } from "next/server";
import { builderApiAccess } from "@/lib/livecard-api-access";
import { readLiveCardForm, validateLiveCard } from "@/lib/livecard-builder";
import { readSharedCardDesign } from "@/lib/shared-card-design";
import { generateCardHeadline } from "@/lib/shared-card-headline";
import { liveCardGenerationErrorResponse } from "@/lib/livecard-generation-failure";

export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  const denied = await builderApiAccess("design");
  if (denied) return denied;
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return NextResponse.json({ error: "Open Envitefy to create your card." }, { status: 403 });
  const raw: unknown = await request.json().catch(() => null);
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const form = readLiveCardForm(input.form);
  const design = readSharedCardDesign(input.design);
  if (
    !form ||
    !design ||
    !form.title.trim() ||
    Object.keys(validateLiveCard(form, "design")).length
  )
    return NextResponse.json(
      { error: "Add a title and create your design first." },
      { status: 400 },
    );
  try {
    return NextResponse.json(
      { headline: await generateCardHeadline(form, design, request.signal) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      liveCardGenerationErrorResponse(error, "lettering"),
      { status: 503 },
    );
  }
}

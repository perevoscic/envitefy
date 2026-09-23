import { NextResponse } from "next/server";
import { builderApiAccess } from "@/lib/livecard-api-access";
import { readLiveCardForm, validateLiveCard } from "@/lib/livecard-builder";
import { generateSharedCard } from "@/lib/shared-card-generation";

export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  const denied = await builderApiAccess("design");
  if (denied) return denied;
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return NextResponse.json({ error: "Open Envitefy to create your design." }, { status: 403 });
  const input: unknown = await request.json().catch(() => null);
  const form =
    input && typeof input === "object" && "form" in input ? readLiveCardForm(input.form) : null;
  if (!form || Object.keys(validateLiveCard(form, "design")).length)
    return NextResponse.json(
      { error: "Choose an event type and describe how you would like your invitation to look." },
      { status: 400 },
    );
  try {
    return NextResponse.json(
      { design: await generateSharedCard(form, request.signal) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Your design could not be created. Please retry.",
      },
      { status: 503 },
    );
  }
}

import { NextResponse } from "next/server";
import { builderApiAccess } from "@/lib/livecard-api-access";
import { readLiveCardForm, validateLiveCard } from "@/lib/livecard-builder";
import { generateSharedCard } from "@/lib/shared-card-generation";
import { liveCardGenerationErrorResponse } from "@/lib/livecard-generation-failure";

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
  if (request.headers.get("accept")?.includes("application/x-ndjson")) {
    const encoder = new TextEncoder();
    const controller = new AbortController();
    const signal = AbortSignal.any([request.signal, controller.signal]);
    let cancelled = false;
    const stream = new ReadableStream({
      async start(output) {
        const send = (value: unknown) => {
          if (!cancelled && !signal.aborted) output.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
        };
        try {
          const design = await generateSharedCard(form, signal, (stage) => send({ type: "stage", stage: stage === "encoding" ? "exporting" : stage }));
          send({ type: "complete", result: { design } });
        } catch (error) {
          send({ type: "complete", result: liveCardGenerationErrorResponse(error, "design") });
        } finally {
          if (!cancelled) output.close();
        }
      },
      cancel() { cancelled = true; controller.abort(); },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
  }
  try {
    return NextResponse.json(
      { design: await generateSharedCard(form, request.signal) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      liveCardGenerationErrorResponse(error, "design"),
      { status: 503 },
    );
  }
}

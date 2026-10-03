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
  if (request.headers.get("accept")?.includes("application/x-ndjson")) {
    const encoder = new TextEncoder();
    const generationController = new AbortController();
    const signal = AbortSignal.any([request.signal, generationController.signal]);
    let cancelled = false;
    const stream = new ReadableStream({
      async start(controller) {
        const send = (value: unknown) => {
          if (!cancelled && !signal.aborted) controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
        };
        try {
          const headline = await generateCardHeadline(form, design, signal, (stage) => send({ stage }), input.mode === "verify");
          send({ headline });
        } catch (error) {
          send(liveCardGenerationErrorResponse(error, "lettering"));
        } finally {
          if (!cancelled) controller.close();
        }
      },
      cancel() {
        cancelled = true;
        generationController.abort();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
  }
  try {
    return NextResponse.json(
      { headline: await generateCardHeadline(form, design, request.signal, undefined, input.mode === "verify") },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      liveCardGenerationErrorResponse(error, "lettering"),
      { status: 503 },
    );
  }
}

import { processBufferUpload } from "../media-upload";
import { parseDataUrlBase64 } from "../../utils/data-url";
import { generateStudioInvitation } from "./generate.ts";
import type { GenerationOptions, GenerationStreamEvent } from "./generation-progress.ts";
import type { StudioGenerateRequest, StudioGenerateResponse } from "./types.ts";

export const generationResponseDeps = { generateStudioInvitation, processBufferUpload };

export async function generateAndPersistInvitation(
  request: StudioGenerateRequest,
  options: GenerationOptions = {},
): Promise<StudioGenerateResponse> {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const result = await generationResponseDeps.generateStudioInvitation(request, options);
  options.signal?.throwIfAborted();
  if (result.imageDataUrl) {
    const parsed = parseDataUrlBase64(result.imageDataUrl);
    if (parsed) {
      options.onProgress?.({ type: "stage", stage: "saving" });
      const uploadStartedAt = Date.now();
      try {
        const uploaded = await generationResponseDeps.processBufferUpload({
          bytes: Buffer.from(parsed.base64Payload, "base64"),
          fileName: "studio-generated-image.png",
          mimeType: parsed.mimeType || "image/png",
          usage: "header",
        });
        result.imageUrl =
          result.product === "digital_flyer" || result.product === "printable_flyer"
            ? uploaded.stored.source?.url || null
            : uploaded.stored.display?.url || uploaded.stored.source?.url || null;
        if (result.imageUrl) result.imageDataUrl = null;
      } catch {
        result.warnings.push("Generated image persistence failed; using inline image.");
      } finally {
        if (result.timings) result.timings.stagesMs.saving = Date.now() - uploadStartedAt;
      }
    } else result.warnings.push("Generated image could not be persisted; using inline image.");
  }
  if (result.timings) result.timings.totalMs = Date.now() - startedAt;
  // Timings contain no prompts, images, contact details or provider error bodies.
  console.info("studio_generation_run", {
    requestId,
    product: result.product,
    ok: result.ok,
    qualityCheck: result.qualityCheck,
    ...result.timings,
  });
  return result;
}

export function invitationResponseStream(
  run: (options: GenerationOptions) => Promise<StudioGenerateResponse>,
  requestSignal?: AbortSignal,
): ReadableStream<Uint8Array> {
  const cancellation = new AbortController();
  const signal = AbortSignal.any([
    cancellation.signal,
    AbortSignal.timeout(540_000),
    ...(requestSignal ? [requestSignal] : []),
  ]);
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: GenerationStreamEvent) => {
        if (!signal.aborted) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      void run({ signal, onProgress: send })
        .then((result) => send({ type: "complete", result }))
        .catch((error: Error) =>
          send({
            type: "error",
            message:
              error.name === "TimeoutError"
                ? "Generation took too long. Please retry."
                : error.message || "Generation failed.",
          }),
        )
        .finally(() => {
          try {
            controller.close();
          } catch {}
        });
    },
    cancel() {
      cancellation.abort();
    },
  });
}

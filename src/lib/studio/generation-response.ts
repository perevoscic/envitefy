import { processBufferUpload } from "../media-upload";
import { parseDataUrlBase64 } from "../../utils/data-url";
import { generateStudioInvitation } from "./generate.ts";
import type { GenerationOptions, GenerationStreamEvent, GenerationStage } from "./generation-progress.ts";
import type { StudioGenerateRequest, StudioGenerateResponse } from "./types.ts";

export type StudioGenerationRunRecord = {
  requestId: string;
  product?: string;
  ok: boolean;
  qualityCheck?: string;
  contractId?: string;
  contractVersion?: number;
  operation?: "initial" | "edit";
  outcome?: string;
  checkCount: number;
  issueCodes: string[];
  totalMs: number;
  stagesMs?: Partial<Record<GenerationStage, number>>;
  firstPreviewMs?: number;
  imageAttempts?: number;
};

const QUALITY_ISSUE_CODES = new Set(["unexpected_text", "incorrect_title", "unsafe_placement", "reference_mismatch", "unreadable_text", "missing_copy", "weak_composition", "style_mismatch", "requested_change_not_applied", "faux_controls", "device_frame", "forbidden_footer", "essential_clipping", "safety_mismatch", "repair_unverified", "invalid_image", "image_geometry_mismatch"]);

export const generationResponseDeps = {
  generateStudioInvitation,
  processBufferUpload,
  recordRun: (record: StudioGenerationRunRecord) => console.info("studio_generation_run", record),
};

export async function generateAndPersistInvitation(
  request: StudioGenerateRequest,
  options: GenerationOptions = {},
): Promise<StudioGenerateResponse> {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  let result: StudioGenerateResponse;
  try {
    result = await generationResponseDeps.generateStudioInvitation(request, options);
  } catch (error) {
    generationResponseDeps.recordRun({ requestId, product: request.product, ok: false, outcome: options.signal?.aborted ? "cancelled" : "error", operation: request.imageEdit ? "edit" : "initial", checkCount: 0, issueCodes: [], totalMs: Date.now() - startedAt });
    throw error;
  }
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
  // Only stable identifiers, bounded issue codes and timings enter general logs.
  generationResponseDeps.recordRun({
    requestId,
    product: result.product,
    ok: result.ok,
    qualityCheck: result.qualityCheck,
    contractId: result.artworkContract?.id,
    contractVersion: result.artworkContract?.version,
    operation: result.diagnostics?.operation,
    outcome: result.diagnostics?.outcome,
    checkCount: result.diagnostics?.checks.length || 0,
    issueCodes: [...new Set((result.diagnostics?.checks || []).flatMap((check) => check.issues).map((issue) => QUALITY_ISSUE_CODES.has(issue) ? issue : "other_quality_issue"))],
    totalMs: Date.now() - startedAt,
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

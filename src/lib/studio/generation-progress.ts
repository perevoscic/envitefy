import type { StudioGenerateApiResponse } from "./types.ts";

export const GENERATION_STAGE_LABELS = {
  preparing: "Preparing your design",
  planning: "Composing the invitation",
  generating: "Drawing your artwork",
  checking: "Checking artwork and wording",
  repairing: "Refining the artwork",
  exporting: "Preparing the final image",
  saving: "Saving your preview",
} as const;
export type GenerationStage = keyof typeof GENERATION_STAGE_LABELS;
export type GenerationTimings = {
  totalMs: number;
  stagesMs: Partial<Record<GenerationStage, number>>;
  firstPreviewMs?: number;
  imageAttempts: number;
};
export type GenerationProgress =
  | { type: "stage"; stage: GenerationStage }
  | { type: "preview"; imageDataUrl: string; partial: boolean };
export type GenerationStreamEvent =
  | GenerationProgress
  | { type: "complete"; result: StudioGenerateApiResponse }
  | { type: "error"; message: string };
export type GenerationOptions = {
  onProgress?: (event: GenerationProgress) => void;
  signal?: AbortSignal;
};

export function createGenerationTracker(options: GenerationOptions = {}) {
  const startedAt = Date.now();
  const timings: GenerationTimings = { totalMs: 0, stagesMs: {}, imageAttempts: 0 };
  return {
    async measure<T>(stage: GenerationStage, work: () => Promise<T>): Promise<T> {
      options.signal?.throwIfAborted();
      options.onProgress?.({ type: "stage", stage });
      if (stage === "generating" || stage === "repairing") timings.imageAttempts++;
      const start = Date.now();
      try {
        return await work();
      } finally {
        timings.stagesMs[stage] = (timings.stagesMs[stage] || 0) + Date.now() - start;
      }
    },
    preview(imageDataUrl: string, partial: boolean) {
      options.signal?.throwIfAborted();
      if (timings.firstPreviewMs === undefined) timings.firstPreviewMs = Date.now() - startedAt;
      options.onProgress?.({ type: "preview", imageDataUrl, partial });
    },
    finish(): GenerationTimings {
      return { ...timings, totalMs: Date.now() - startedAt };
    },
  };
}

/** Incremental NDJSON decoding; partial images are display-only, never a successful result. */
export async function readGenerationStream(
  stream: ReadableStream<Uint8Array>,
  onProgress?: (event: GenerationProgress) => void,
): Promise<unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  let result: unknown;
  function consume(line: string) {
    if (!line.trim()) return;
    const value: unknown = JSON.parse(line);
    if (!value || typeof value !== "object" || !("type" in value))
      throw new Error("Invalid generation update.");
    if (value.type === "error" && "message" in value)
      throw new Error(typeof value.message === "string" ? value.message : "Generation failed.");
    if (completed) throw new Error("Unexpected update after generation completed.");
    if (value.type === "complete" && "result" in value) {
      result = value.result;
      completed = true;
      return;
    }
    if (
      value.type === "stage" &&
      "stage" in value &&
      typeof value.stage === "string" &&
      Object.hasOwn(GENERATION_STAGE_LABELS, value.stage)
    ) {
      onProgress?.({ type: "stage", stage: value.stage as GenerationStage });
    } else if (
      value.type === "preview" &&
      "imageDataUrl" in value &&
      typeof value.imageDataUrl === "string" &&
      /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.imageDataUrl) &&
      "partial" in value &&
      typeof value.partial === "boolean"
    ) {
      onProgress?.({ type: "preview", imageDataUrl: value.imageDataUrl, partial: value.partial });
    } else throw new Error("Invalid generation update.");
  }
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      if (buffer.length > 32 * 1024 * 1024) throw new Error("Generation update is too large.");
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        consume(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf("\n");
      }
      if (chunk.done) break;
    }
    consume(buffer);
    if (!completed)
      throw new Error("Generation connection ended before the final result. Please retry.");
    return result;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

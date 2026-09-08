import sharp from "sharp";
import { parseDataUrlBase64 } from "../../utils/data-url.ts";

// Leave room for event metadata and JSON/base64 overhead in BOTH preview and save.
const MAX_PREVIEW_IMAGE_BYTES = 2 * 1024 * 1024;

export async function prepareCardEditPreviewImage(imageDataUrl: string): Promise<string> {
  const parsed = parseDataUrlBase64(imageDataUrl);
  if (!parsed || !parsed.mimeType.startsWith("image/")) {
    throw new Error("The card preview did not contain a valid image. Please try Preview again.");
  }
  const input = Buffer.from(parsed.base64Payload, "base64");
  for (const quality of [90, 80, 70]) {
    const bytes = await sharp(input)
      .rotate()
      .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    if (bytes.length <= MAX_PREVIEW_IMAGE_BYTES) {
      return `data:image/webp;base64,${bytes.toString("base64")}`;
    }
  }
  throw new Error("The card preview was too large. Please try Preview again.");
}

/** JSON whitespace keeps the connection active while the image provider works. */
export function streamCardEditPreview(
  createPreview: () => Promise<Response>,
  options: { heartbeatMs?: number; timeoutMs?: number } = {},
): Response {
  const encoder = new TextEncoder();
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const clearTimers = () => {
    clearInterval(heartbeat);
    clearTimeout(deadline);
  };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const finish = (body: string) => {
        if (closed) return;
        closed = true;
        clearTimers();
        controller.enqueue(encoder.encode(body));
        controller.close();
      };
      controller.enqueue(encoder.encode("\n"));
      heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode("\n"));
      }, options.heartbeatMs ?? 10_000);
      // End with readable JSON before the hosting runtime terminates the function.
      deadline = setTimeout(() => {
        finish(JSON.stringify({
          ok: false,
          error: "The card preview took too long. Your changes are still here. Please try Preview again.",
        }));
      }, options.timeoutMs ?? 270_000);
      void Promise.resolve()
        .then(createPreview)
        .then(async (response) => finish(await response.text()))
        .catch((error: unknown) => {
          console.error("[card-edit/preview] generation failed", error);
          finish(JSON.stringify({
            ok: false,
            error: "The card preview could not be completed. Your changes are still here. Please try Preview again.",
          }));
        });
    },
    cancel() {
      closed = true;
      clearTimers();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

import type OpenAI from "openai";
import { multipartFormRequestOptions, type Uploadable } from "openai/core";
import type { Stream } from "openai/streaming";

export type ImageGenerationOptions = {
  onPartialImage?: (imageDataUrl: string) => void;
  signal?: AbortSignal;
};

type ImageStreamBody = {
  model: string;
  prompt: string;
  size: string;
  quality: string;
  background: string;
  output_format: "png";
  n: number;
  stream: true;
  partial_images: number;
  image?: Uploadable[];
};

/** The installed SDK predates typed image streaming. Its public transport handles SSE. */
export async function streamOpenAiImage(
  client: OpenAI,
  body: Omit<ImageStreamBody, "stream" | "partial_images" | "output_format">,
  options: ImageGenerationOptions,
): Promise<string> {
  const requestBody: ImageStreamBody = {
    ...body,
    output_format: "png",
    stream: true,
    partial_images: 2,
  };
  const requestOptions = {
    body: requestBody,
    stream: true,
    signal: AbortSignal.any([AbortSignal.timeout(180_000), ...(options.signal ? [options.signal] : [])]),
    timeout: 180_000,
    maxRetries: 0,
  };
  const transportOptions = body.image
    ? await multipartFormRequestOptions(requestOptions)
    : requestOptions;
  const stream = await client.post<typeof transportOptions.body, Stream<unknown>>(
    body.image ? "/images/edits" : "/images/generations",
    transportOptions,
  );
  let finalImage = "";
  for await (const value of stream) {
    if (!value || typeof value !== "object") continue;
    // SDK 4 wraps named SSE events in { event, data }; newer transports yield data directly.
    const payload = "event" in value && "data" in value ? value.data : value;
    if (!payload || typeof payload !== "object") continue;
    const type = "type" in payload ? payload.type : "event" in value ? value.event : null;
    if (type === "error") throw new Error("Image generation failed while streaming.");
    if (!("b64_json" in payload) || typeof payload.b64_json !== "string" || !payload.b64_json)
      continue;
    const imageDataUrl = `data:image/png;base64,${payload.b64_json}`;
    if (type === "image_generation.partial_image" || type === "image_edit.partial_image")
      options.onPartialImage?.(imageDataUrl);
    if (type === "image_generation.completed" || type === "image_edit.completed")
      finalImage = imageDataUrl;
  }
  if (!finalImage) throw new Error("The image stream ended without a completed image.");
  return finalImage;
}

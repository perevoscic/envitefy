import type OpenAI from "openai";
import type { Uploadable } from "openai/uploads";

export type ImageGenerationOptions = {
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "1024x2176" | "auto";
  onPartialImage?: (imageDataUrl: string) => void;
  signal?: AbortSignal;
  background?: "transparent" | "opaque" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
  requestContext?: { jobId: string; revision: string; attempt: number };
};

type ImageStreamBody = {
  model: string;
  prompt: string;
  size: string;
  quality: NonNullable<ImageGenerationOptions["quality"]>;
  background: NonNullable<ImageGenerationOptions["background"]>;
  output_format: "png";
  n: number;
  stream: true;
  partial_images: number;
  image?: Uploadable[];
};

/** Use the SDK's public image APIs for JSON generation and multipart edit streams. */
export async function streamOpenAiImage(
  client: OpenAI,
  body: Omit<ImageStreamBody, "stream" | "partial_images" | "output_format">,
  options: ImageGenerationOptions,
): Promise<string> {
  const { image, ...parameters } = body;
  const requestBody = {
    ...parameters,
    output_format: "png" as const,
    stream: true as const,
    partial_images: 2,
  };
  const requestOptions = {
    signal: AbortSignal.any([AbortSignal.timeout(180_000), ...(options.signal ? [options.signal] : [])]),
    timeout: 180_000,
    maxRetries: 0,
  };
  const stream = image
    ? await client.images.edit({ ...requestBody, image }, requestOptions)
    : await client.images.generate(requestBody, requestOptions);
  let finalImage = "";
  for await (const value of stream) {
    if (!value || typeof value !== "object") continue;
    // Accept named SSE envelopes as well as direct event payloads.
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

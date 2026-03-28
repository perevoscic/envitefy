import { isRemoteMediaUrl } from "./upload-config.ts";
import { parseDataUrlBase64 } from "../utils/data-url.ts";

export function buildMediaResponse(mediaValue: string | null): Response {
  if (!mediaValue) {
    return new Response("No thumbnail found", { status: 404 });
  }

  if (isRemoteMediaUrl(mediaValue)) {
    return Response.redirect(mediaValue, 307);
  }

  const parsed = parseDataUrlBase64(mediaValue);
  if (!parsed || !parsed.mimeType.startsWith("image/")) {
    return new Response("Invalid image format", { status: 400 });
  }

  const imageBuffer = Buffer.from(parsed.base64Payload, "base64");
  if (!imageBuffer.length) {
    return new Response("Invalid image format", { status: 400 });
  }

  const mediaType = parsed.mimeType.split(";")[0].trim();
  const contentType = /^image\/[\w.+-]+$/i.test(mediaType) ? mediaType : "image/jpeg";

  return new Response(imageBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

import { isRemoteMediaUrl } from "./upload-config.ts";
import { rewriteLoopbackUrlToRelativePath } from "./absolute-url.ts";
import { parseDataUrlBase64 } from "../utils/data-url.ts";

function relativeRedirect(location: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
    },
  });
}

export function buildMediaResponse(mediaValue: string | null): Response {
  if (!mediaValue) {
    return new Response("No thumbnail found", { status: 404 });
  }

  // Heal absolute URLs that point at a dev-machine loopback host (e.g. values
  // persisted during local development before `resolveBlobAssetUrl` stopped
  // baking in a host). Redirect to the same path on the current origin.
  const loopbackRelative = rewriteLoopbackUrlToRelativePath(mediaValue);
  if (loopbackRelative) {
    return relativeRedirect(loopbackRelative);
  }

  // Site-relative paths (e.g. `/api/blob/event-media/...`) are resolved against
  // whichever host is serving the request, so we redirect instead of fetching.
  if (mediaValue.startsWith("/")) {
    return relativeRedirect(mediaValue);
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

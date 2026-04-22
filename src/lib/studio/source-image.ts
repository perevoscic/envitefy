import * as vercelBlob from "@vercel/blob";
import { extractAppOwnedBlobProxyPathname } from "../event-media.ts";
import { isRemoteMediaUrl } from "../upload-config.ts";
import { parseDataUrlBase64 } from "../../utils/data-url.ts";

export type StudioResolvedSourceImage = {
  mimeType: string;
  data: string;
};

type SourceKind = "data_url" | "blob_proxy" | "remote_url" | "unsupported";

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMimeType(value: string | null): string {
  return safeString(value).split(";")[0]?.trim().toLowerCase() || "";
}

function logStudioSourceImageFailure(
  sourceKind: SourceKind,
  details: Record<string, unknown> = {},
): void {
  console.warn("[studio/source-image] could not resolve source image", {
    sourceKind,
    ...details,
  });
}

export const studioSourceImageDeps = {
  fetchRemote: (url: string) => fetch(url),
  getBlob: (pathname: string) => vercelBlob.get(pathname, { access: "private" }),
  logFailure: logStudioSourceImageFailure,
};

async function loadBlobProxySource(pathname: string): Promise<StudioResolvedSourceImage | null> {
  try {
    const result = await studioSourceImageDeps.getBlob(pathname);
    if (!result || result.statusCode !== 200 || !result.stream) {
      studioSourceImageDeps.logFailure("blob_proxy", {
        pathname,
        reason: "blob_not_found",
        statusCode: result?.statusCode ?? null,
      });
      return null;
    }

    const mimeType = normalizeMimeType(result.headers.get("content-type"));
    if (!mimeType.startsWith("image/")) {
      studioSourceImageDeps.logFailure("blob_proxy", {
        pathname,
        reason: "non_image_content_type",
        mimeType: mimeType || null,
      });
      return null;
    }

    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    return {
      mimeType,
      data: bytes.toString("base64"),
    };
  } catch (error) {
    studioSourceImageDeps.logFailure("blob_proxy", {
      pathname,
      reason: "blob_read_failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function loadRemoteImageSource(url: string): Promise<StudioResolvedSourceImage | null> {
  let host = "";
  try {
    host = new URL(url).host;
  } catch {}

  try {
    const response = await studioSourceImageDeps.fetchRemote(url);
    if (!response.ok) {
      studioSourceImageDeps.logFailure("remote_url", {
        host: host || null,
        status: response.status,
      });
      return null;
    }

    const mimeType = normalizeMimeType(response.headers.get("content-type"));
    if (!mimeType.startsWith("image/")) {
      studioSourceImageDeps.logFailure("remote_url", {
        host: host || null,
        reason: "non_image_content_type",
        mimeType: mimeType || null,
      });
      return null;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    return {
      mimeType,
      data: bytes.toString("base64"),
    };
  } catch (error) {
    studioSourceImageDeps.logFailure("remote_url", {
      host: host || null,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function resolveStudioSourceImage(
  value: string,
): Promise<StudioResolvedSourceImage | null> {
  const trimmed = safeString(value);
  if (!trimmed) {
    studioSourceImageDeps.logFailure("unsupported", { reason: "empty" });
    return null;
  }

  const parsedDataUrl = parseDataUrlBase64(trimmed);
  if (parsedDataUrl) {
    const mimeType = normalizeMimeType(parsedDataUrl.mimeType);
    if (!mimeType.startsWith("image/")) {
      studioSourceImageDeps.logFailure("data_url", {
        reason: "non_image_content_type",
        mimeType: mimeType || null,
      });
      return null;
    }
    return {
      mimeType,
      data: parsedDataUrl.base64Payload.replace(/\s+/g, ""),
    };
  }

  if (trimmed.startsWith("data:")) {
    studioSourceImageDeps.logFailure("data_url", { reason: "invalid_data_url" });
    return null;
  }

  const blobProxyPathname = extractAppOwnedBlobProxyPathname(trimmed);
  if (blobProxyPathname) {
    return loadBlobProxySource(blobProxyPathname);
  }

  if (isRemoteMediaUrl(trimmed)) {
    return loadRemoteImageSource(trimmed);
  }

  studioSourceImageDeps.logFailure("unsupported", {
    reason: trimmed.startsWith("blob:") ? "browser_object_url" : "unsupported_value",
  });
  return null;
}

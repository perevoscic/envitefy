import { get, put } from "@vercel/blob";
import { getEventHistoryInputBlob } from "@/lib/db";

function sanitizeDiscoveryFileName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 200);
  return base || "upload";
}

export async function uploadDiscoveryInputToBlob(params: {
  eventId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<{ pathname: string; url: string }> {
  const safe = sanitizeDiscoveryFileName(params.fileName);
  const pathname = `discovery-input/${params.eventId}/${safe}`;
  const blob = await put(pathname, params.bytes, {
    access: "private",
    contentType: params.mimeType || "application/octet-stream",
  });
  return { pathname: blob.pathname, url: blob.url };
}

export type LoadedDiscoveryInput = {
  buffer: Buffer;
  mime_type: string;
  file_name: string | null;
  size_bytes: number | null;
};

export async function loadDiscoveryInputBytes(
  eventId: string
): Promise<LoadedDiscoveryInput | null> {
  const row = await getEventHistoryInputBlob(eventId);
  if (!row) return null;

  let buffer: Buffer | null = null;
  const pathname = row.storage_pathname?.trim();
  if (pathname) {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }
    const ab = await new Response(result.stream).arrayBuffer();
    buffer = Buffer.from(ab);
  } else if (row.data && row.data.length > 0) {
    buffer = row.data;
  }

  if (!buffer?.length) return null;

  return {
    buffer,
    mime_type: row.mime_type,
    file_name: row.file_name ?? null,
    size_bytes: row.size_bytes ?? buffer.length,
  };
}

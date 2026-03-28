import { loadDiscoveryInputBytes } from "@/lib/discovery-input-storage";
import type { DiscoverySourceInput } from "@/lib/meet-discovery";

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isPdfDiscoveryFile(input: DiscoverySourceInput): boolean {
  if (input.type !== "file") return false;
  const m = (input.mimeType || "").toLowerCase();
  const n = (input.fileName || "").toLowerCase();
  return /pdf/.test(m) || n.endsWith(".pdf");
}

/** PDFs that were not stored in blob; client must re-upload bytes on parse/enrich. */
export function requiresClientPdfReupload(input: DiscoverySourceInput): boolean {
  return input.type === "file" && isPdfDiscoveryFile(input) && input.blobStored === false;
}

export type HydrateDiscoveryFileResult =
  | { ok: true; hydrated: DiscoverySourceInput }
  | { ok: false; status: number; error: string };

/**
 * Resolve file-backed discovery input: inline dataUrl, client re-upload for ephemeral PDF, or blob row.
 */
export async function hydrateDiscoveryFileInput(
  eventId: string,
  sourceInput: DiscoverySourceInput,
  uploadFile: File | null,
): Promise<HydrateDiscoveryFileResult> {
  if (sourceInput.type !== "file") {
    return { ok: false, status: 400, error: "Expected file discovery input" };
  }
  if (safeString(sourceInput.dataUrl || "")) {
    return { ok: true, hydrated: sourceInput };
  }

  if (requiresClientPdfReupload(sourceInput)) {
    if (!(uploadFile instanceof File)) {
      return {
        ok: false,
        status: 400,
        error:
          'PDF file upload is required with this parse request (same file as discovery). Send multipart field "file".',
      };
    }
    const bytes = Buffer.from(await uploadFile.arrayBuffer());
    const mime =
      safeString(uploadFile.type) || safeString(sourceInput.mimeType) || "application/octet-stream";
    return {
      ok: true,
      hydrated: {
        ...sourceInput,
        fileName: safeString(sourceInput.fileName) || safeString(uploadFile.name) || "upload",
        mimeType: mime,
        sizeBytes: Number.isFinite(sourceInput.sizeBytes)
          ? sourceInput.sizeBytes
          : uploadFile.size || bytes.length,
        dataUrl: `data:${mime};base64,${bytes.toString("base64")}`,
        blobStored: false,
        ephemeralFile: true,
      },
    };
  }

  const loaded = await loadDiscoveryInputBytes(eventId);
  if (!loaded) {
    return {
      ok: false,
      status: 404,
      error: "Discovery source file blob not found",
    };
  }
  return {
    ok: true,
    hydrated: {
      ...sourceInput,
      fileName: safeString(sourceInput.fileName) || safeString(loaded.file_name) || "upload",
      mimeType:
        safeString(sourceInput.mimeType) ||
        safeString(loaded.mime_type) ||
        "application/octet-stream",
      sizeBytes: Number.isFinite(sourceInput.sizeBytes)
        ? sourceInput.sizeBytes
        : Number(loaded.size_bytes || loaded.buffer.length),
      dataUrl: `data:${safeString(loaded.mime_type) || "application/octet-stream"};base64,${loaded.buffer.toString("base64")}`,
      blobStored: true,
    },
  };
}

import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { get } from "@vercel/blob";
import { uploadPublicBinaryAsset } from "../media-upload";
import { type UploadResponse, validateUploadFileMeta } from "../upload-config";
import { scanOriginalCache } from "./original-cache";

function encryptionKey(): Buffer {
  const secret =
    process.env.SCAN_ORIGINAL_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET;
  if (!secret) throw new Error("Private document storage is not configured");
  return createHash("sha256").update(`envitefy-scan-original-v1:${secret}`).digest();
}

export function encryptScanOriginal(bytes: Buffer, ownerId: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(ownerId));
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([Buffer.from("EVS1"), iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptScanOriginal(bytes: Buffer, ownerId: string): Buffer {
  if (bytes.length < 32 || bytes.subarray(0, 4).toString() !== "EVS1")
    throw new Error("Invalid private document");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(4, 16));
  decipher.setAAD(Buffer.from(ownerId));
  decipher.setAuthTag(bytes.subarray(16, 32));
  return Buffer.concat([decipher.update(bytes.subarray(32)), decipher.final()]);
}

/** Only ciphertext is uploaded; the public blob store never receives a readable medical original. */
export async function processPrivateScanUpload(
  file: File,
  ownerId: string,
): Promise<UploadResponse> {
  const valid = validateUploadFileMeta({
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    usage: "attachment",
  });
  if (!valid.ok) throw new Error(valid.error);
  const original = Buffer.from(await file.arrayBuffer());
  const encrypted = encryptScanOriginal(original, ownerId);
  const uploaded = await uploadPublicBinaryAsset({
    pathname: `private-scan-originals/${randomUUID()}.bin`,
    bytes: encrypted,
    contentType: "application/octet-stream",
  });
  return {
    ok: true,
    kind: valid.kind,
    original: { name: file.name, mimeType: valid.mimeType, sizeBytes: file.size },
    stored: {},
    eventMedia: {
      attachment: {
        name: file.name,
        type: valid.mimeType,
        sizeBytes: file.size,
        dataUrl: uploaded.url,
        storageKind: "encrypted-blob",
      },
    },
  };
}

/** The original endpoint checks current access before calling this cached storage read. */
export async function readScanOriginalBytes(value: string): Promise<Buffer> {
  const inline = value.match(
    /^data:(?:image\/(?:jpeg|png|webp)|application\/pdf);base64,([\s\S]+)$/i,
  );
  if (inline) return Buffer.from(inline[1], "base64");
  if (value.startsWith("/api/blob/")) {
    const pathname = value.slice("/api/blob/".length).split("/").map(decodeURIComponent).join("/");
    if (!/^(?:event-media|private-scan-originals)\//.test(pathname) || pathname.includes(".."))
      throw new Error("Invalid source path");
    return scanOriginalCache.read(`path:${pathname}`, async () => {
      const result = await get(pathname, { access: "private" });
      if (result?.statusCode !== 200 || !result.stream) throw new Error("Original unavailable");
      return Buffer.from(await new Response(result.stream).arrayBuffer());
    });
  }
  const url = new URL(value);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".blob.vercel-storage.com"))
    throw new Error("Invalid source host");
  return scanOriginalCache.read(`url:${url.href}`, async () => {
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Original unavailable");
    return Buffer.from(await response.arrayBuffer());
  });
}

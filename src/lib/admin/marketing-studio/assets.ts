import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import {
  getAssetRecord,
  getConversation,
  insertAssetRecord,
  validateReferences,
} from "./repository.ts";
import { studioAssetUrl, type StudioAsset } from "./types.ts";
import { requireStudioId, StudioRequestError } from "./validation.ts";

const MIME_EXTENSIONS = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["video/mp4", "mp4"],
]);

export function studioStoragePath(
  conversationId: string,
  assetId: string,
  mimeType: string,
): string {
  requireStudioId(conversationId, "conversation ID");
  requireStudioId(assetId, "asset ID");
  const extension = MIME_EXTENSIONS.get(mimeType);
  if (!extension) throw new StudioRequestError("Unsupported media type.");
  return `admin-marketing-studio/${conversationId}/${assetId}.${extension}`;
}

export function resolveLocalStudioAsset(storagePath: string, projectRoot = process.cwd()): string {
  if (
    !/^admin-marketing-studio\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp|mp4)$/.test(storagePath)
  ) {
    throw new StudioRequestError("Invalid media storage path.");
  }
  const root = path.resolve(projectRoot, "qa-artifacts");
  const target = path.resolve(root, ...storagePath.split("/"));
  if (!target.startsWith(`${root}${path.sep}`))
    throw new StudioRequestError("Invalid media storage path.");
  return target;
}

export function safeStudioAssetName(value: string): string {
  return (
    value
      .split(/[\\/]/)
      .pop()
      ?.replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, 160) || "creation"
  );
}

export async function saveAsset(input: {
  conversationId: string;
  versionId: string | null;
  name: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<StudioAsset> {
  const conversationId = requireStudioId(input.conversationId, "conversation ID");
  if (!input.bytes.length) throw new StudioRequestError("The generated media is empty.");
  if (!(await getConversation(conversationId)))
    throw new StudioRequestError("Conversation not found.", 404);
  await validateReferences(conversationId, [], input.versionId);
  const id = randomUUID();
  const storagePath = studioStoragePath(conversationId, id, input.mimeType);
  const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  if (!useBlob && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
    throw new StudioRequestError(
      "Private media storage is not configured. Set BLOB_READ_WRITE_TOKEN.",
      503,
    );
  }
  if (useBlob) {
    await put(storagePath, input.bytes, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: input.mimeType,
    });
  } else {
    const filePath = resolveLocalStudioAsset(storagePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, input.bytes, { flag: "wx" });
  }
  return insertAssetRecord({
    id,
    conversationId,
    versionId: input.versionId,
    name: safeStudioAssetName(input.name),
    mimeType: input.mimeType,
    size: input.bytes.length,
    url: studioAssetUrl(id),
    storageKind: useBlob ? "blob" : "local",
    storagePath,
  });
}

export async function readAsset(id: string): Promise<{ asset: StudioAsset; bytes: Buffer } | null> {
  const stored = await getAssetRecord(id);
  if (!stored) return null;
  let bytes: Buffer;
  if (stored.storageKind === "blob") {
    const result = await get(stored.storagePath, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
  } else {
    try {
      bytes = await fs.readFile(resolveLocalStudioAsset(stored.storagePath));
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT")
        return null;
      throw error;
    }
  }
  const { storageKind: _kind, storagePath: _path, ...asset } = stored;
  return { asset, bytes };
}

export type StudioByteRange = { start: number; end: number };

export function parseStudioByteRange(
  header: string | null,
  length: number,
): StudioByteRange | null {
  if (header === null) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2]) || length <= 0)
    throw new StudioRequestError("Requested range is not available.", 416);
  const suffix = !match[1];
  const first = Number(suffix ? match[2] : match[1]);
  const last = match[2] ? Number(match[2]) : length - 1;
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last) || (suffix && first === 0)) {
    throw new StudioRequestError("Requested range is not available.", 416);
  }
  const start = suffix ? Math.max(0, length - first) : first;
  const end = suffix ? length - 1 : Math.min(last, length - 1);
  if (start >= length || start > end)
    throw new StudioRequestError("Requested range is not available.", 416);
  return { start, end };
}

export function studioAssetResponse(
  asset: StudioAsset,
  bytes: Buffer,
  rangeHeader: string | null,
  download: boolean,
): Response {
  const encodedName = encodeURIComponent(safeStudioAssetName(asset.name)).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  const headers = new Headers({
    "Content-Type": asset.mimeType,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodedName}`,
  });
  let range: StudioByteRange | null;
  try {
    range = parseStudioByteRange(rangeHeader, bytes.length);
  } catch (error) {
    if (!(error instanceof StudioRequestError) || error.status !== 416) throw error;
    headers.set("Content-Range", `bytes */${bytes.length}`);
    return new Response(null, { status: 416, headers });
  }
  const body = range ? bytes.subarray(range.start, range.end + 1) : bytes;
  headers.set("Content-Length", String(body.length));
  if (range) headers.set("Content-Range", `bytes ${range.start}-${range.end}/${bytes.length}`);
  return new Response(new Uint8Array(body), { status: range ? 206 : 200, headers });
}

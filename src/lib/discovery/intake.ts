import { upsertEventHistoryInputBlob } from "@/lib/db";
import { createDiscoveryShell } from "@/lib/discovery/persist";
import { createDiscoveryPipelineState } from "@/lib/discovery/shared";
import type { DiscoverySourceRecord } from "@/lib/discovery/types";
import { uploadDiscoveryInputToBlob } from "@/lib/discovery-input-storage";
import { prepareDiscoverySourceFile } from "@/lib/media-upload";

function parseJsonRequestBody(request: Request) {
  return request.json().catch(() => ({}));
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function intakeGymnasticsDiscovery(params: {
  request: Request;
  userId: string | null;
}) {
  const contentType = safeString(params.request.headers.get("content-type")).toLowerCase();
  const now = new Date().toISOString();
  let title = "Gymnastics Meet";
  let source: DiscoverySourceRecord | null = null;
  let fileBuffer: Buffer | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await params.request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false as const, status: 400, error: "Upload a file to continue." };
    }
    const prepared = await prepareDiscoverySourceFile(file);
    title = file.name?.replace(/\.[^.]+$/, "") || title;
    source = {
      type: "file",
      fileName: prepared.fileName,
      mimeType: prepared.mimeType,
      sizeBytes: prepared.sizeBytes,
      blobStored: true,
      originalName: prepared.originalName,
      originalMimeType: prepared.originalMimeType,
      originalSizeBytes: prepared.originalSizeBytes,
      optimizedByQpdf: prepared.optimizedByQpdf ?? null,
      createdAt: now,
      updatedAt: now,
    };
    fileBuffer = prepared.buffer;
  } else {
    const body = await parseJsonRequestBody(params.request);
    const rawUrl = safeString(body?.url);
    if (!rawUrl) {
      return { ok: false as const, status: 400, error: "Provide a URL for discovery intake." };
    }
    let normalizedUrl = "";
    try {
      normalizedUrl = new URL(rawUrl).toString();
      title = `${new URL(normalizedUrl).hostname.replace(/^www\./i, "")} Meet`;
    } catch {
      return { ok: false as const, status: 400, error: "Invalid URL" };
    }
    source = {
      type: "url",
      url: normalizedUrl,
      createdAt: now,
      updatedAt: now,
    };
  }

  const pipeline = createDiscoveryPipelineState({
    processingStage: "ingested",
  });
  const created = await createDiscoveryShell({
    userId: params.userId,
    title,
    source,
    pipeline,
  });

  if (fileBuffer && source.type === "file") {
    const { pathname, url } = await uploadDiscoveryInputToBlob({
      eventId: created.eventId,
      fileName: source.fileName || "upload",
      mimeType: source.mimeType || "application/octet-stream",
      bytes: fileBuffer,
    });
    await upsertEventHistoryInputBlob({
      eventId: created.eventId,
      mimeType: source.mimeType || "application/octet-stream",
      fileName: source.fileName || null,
      sizeBytes: source.sizeBytes ?? null,
      data: null,
      storagePathname: pathname,
      storageUrl: url,
    });
  }

  return {
    ok: true as const,
    eventId: created.eventId,
    discoveryId: created.discoveryId,
    workflow: "gymnastics" as const,
    processingStage: "ingested" as const,
  };
}

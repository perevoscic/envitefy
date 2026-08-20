import { upsertEventHistoryInputBlob } from "@/lib/db";
import { createDiscoveryShell } from "@/lib/discovery/persist";
import { createDiscoveryPipelineState } from "@/lib/discovery/shared";
import type { DiscoverySourceRecord, DiscoveryWorkflow } from "@/lib/discovery/types";
import { uploadDiscoveryInputToBlob } from "@/lib/discovery-input-storage";
import { prepareDiscoverySourceFile } from "@/lib/media-upload";
import {
  getSportActivityProfile,
  normalizeSportActivityKey,
  normalizeSportEventArchetype,
} from "@/lib/sports-discovery";

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
  return intakeDiscovery({
    ...params,
    workflow: "gymnastics",
  });
}

function defaultTitleForWorkflow(workflow: DiscoveryWorkflow) {
  if (workflow === "football") return "Football Event";
  if (workflow === "sports") return "Sport Event";
  return "Gymnastics Meet";
}

function suffixTitleForWorkflow(hostname: string, workflow: DiscoveryWorkflow) {
  if (workflow === "football") return `${hostname} Football`;
  if (workflow === "sports") return `${hostname} Sport Event`;
  return `${hostname} Meet`;
}

function normalizeWorkflow(value: unknown): DiscoveryWorkflow {
  const normalized = safeString(value).toLowerCase();
  if (normalized === "football") return "football";
  if (normalized === "sports") return "sports";
  return "gymnastics";
}

export async function intakeDiscovery(params: {
  request: Request;
  userId: string | null;
  workflow?: DiscoveryWorkflow;
}) {
  const contentType = safeString(params.request.headers.get("content-type")).toLowerCase();
  const now = new Date().toISOString();
  let workflow = params.workflow || "gymnastics";
  let title = defaultTitleForWorkflow(workflow);
  let source: DiscoverySourceRecord | null = null;
  let fileBuffer: Buffer | null = null;
  let activityProfile: string | null = null;
  let eventArchetype: ReturnType<typeof normalizeSportEventArchetype> = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await params.request.formData();
    workflow = normalizeWorkflow(formData.get("workflow") || workflow);
    activityProfile = normalizeSportActivityKey(formData.get("activityProfile"));
    eventArchetype = normalizeSportEventArchetype(formData.get("eventArchetype"));
    title = defaultTitleForWorkflow(workflow);
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
      activityProfile,
      eventArchetype,
      createdAt: now,
      updatedAt: now,
    };
    fileBuffer = prepared.buffer;
  } else {
    const body = await parseJsonRequestBody(params.request);
    workflow = normalizeWorkflow(body?.workflow || workflow);
    activityProfile = normalizeSportActivityKey(body?.activityProfile);
    eventArchetype = normalizeSportEventArchetype(body?.eventArchetype);
    title = defaultTitleForWorkflow(workflow);
    const rawUrl = safeString(body?.url);
    if (!rawUrl) {
      return { ok: false as const, status: 400, error: "Provide a URL for discovery intake." };
    }
    let normalizedUrl = "";
    try {
      normalizedUrl = new URL(rawUrl).toString();
      title = suffixTitleForWorkflow(
        new URL(normalizedUrl).hostname.replace(/^www\./i, ""),
        workflow,
      );
    } catch {
      return { ok: false as const, status: 400, error: "Invalid URL" };
    }
    source = {
      type: "url",
      url: normalizedUrl,
      activityProfile,
      eventArchetype,
      createdAt: now,
      updatedAt: now,
    };
  }

  const pipeline = createDiscoveryPipelineState({
    processingStage: "ingested",
  });
  const created = await createDiscoveryShell({
    workflow,
    // Authenticated intake must retain ownership so the generated builder can load and save it.
    // Cancel still removes an unsaved `new=1` draft from the customize flow.
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
    workflow,
    activityProfile,
    activityLabel: getSportActivityProfile(activityProfile)?.label || null,
    eventArchetype,
    processingStage: "ingested" as const,
  };
}

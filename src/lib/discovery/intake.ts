import { isGymMeetTemplateId } from "@/components/gym-meet-templates/registry";
import { isGymMeetTemplateId as isFootballTemplateId } from "@/components/football-season-templates/registry";
import { upsertEventHistoryInputBlob, deleteEventHistoryById } from "@/lib/db";
import sharp from "sharp";
import { normalizeCreateImage, readPublicCreateUrl } from "@/lib/create/read-source";
import { normalizeCreationCategory } from "@/lib/creation-access";
import { requireCreationAccess } from "@/lib/creation-access-server";
import { validDiscoveryIntakeKey, withIdempotentDiscoveryIntake } from "./intake-recovery";
import { createDiscoveryShell } from "@/lib/discovery/persist";
import { createDiscoveryPipelineState } from "@/lib/discovery/shared";
import type { DiscoveryDocument, DiscoverySourceRecord, DiscoveryWorkflow } from "@/lib/discovery/types";
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
  /** Trusted, server-read evidence; never populated from request JSON. */
  document?: DiscoveryDocument;
  validatedUrl?: string;
  onStage?: (stage: string) => void;
  /** In-process handoff avoids serializing and parsing an already-read upload again. */
  sourceForm?: FormData;
}) {
  const contentType = safeString(params.request.headers.get("content-type")).toLowerCase();
  const now = new Date().toISOString();
  let workflow = params.workflow || "gymnastics";
  let title = defaultTitleForWorkflow(workflow);
  let source: DiscoverySourceRecord | null = null;
  let fileBuffer: Buffer | null = null;
  let activityProfile: string | null = null;
  let pageTemplateId: string | null = null;
  let eventArchetype: ReturnType<typeof normalizeSportEventArchetype> = null;
  let clientIntakeId: string | null = null;
  let text = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = params.sourceForm || await params.request.formData();
    clientIntakeId = validDiscoveryIntakeKey(formData.get("clientIntakeId"));
    text = safeString(formData.get("text"));
    const requestedTemplate = formData.get("pageTemplateId");
    workflow = normalizeWorkflow(formData.get("workflow") || workflow);
    if ((workflow === "football" ? isFootballTemplateId : isGymMeetTemplateId)(requestedTemplate)) pageTemplateId = String(requestedTemplate);
    activityProfile = normalizeSportActivityKey(formData.get("activityProfile"));
    eventArchetype = normalizeSportEventArchetype(formData.get("eventArchetype"));
    title = defaultTitleForWorkflow(workflow);
    const files = [...formData.getAll("file"), ...formData.getAll("files")];
    if (files.length > 5 || files.some((file) => !(file instanceof File))) return { ok: false as const, status: 400, error: "Choose up to five event photos or one PDF." };
    let file = files[0];
    if (!(file instanceof File)) {
      return { ok: false as const, status: 400, error: "Upload a file to continue." };
    }
    if (files.length > 1) {
      if (files.some((item) => !(item instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(item.type) || item.size > 10 * 1024 * 1024)) return { ok: false as const, status: 400, error: "Use up to five JPG, PNG or WebP photos, or one PDF." };
      const images = await Promise.all((files as File[]).map(async (item) => {
        const normalized = await normalizeCreateImage(Buffer.from(await item.arrayBuffer()));
        const bytes = Buffer.from(normalized.split(",")[1], "base64");
        const metadata = await sharp(bytes).metadata();
        return { bytes, width: metadata.width!, height: metadata.height! };
      }));
      const width = Math.max(...images.map((image) => image.width));
      let top = 0;
      const layers = images.map((image) => { const layer = { input: image.bytes, left: 0, top }; top += image.height + 24; return layer; });
      const combined = await sharp({ create: { width, height: top, channels: 3, background: "white" } }).composite(layers).jpeg({ quality: 85 }).toBuffer();
      file = new File([new Uint8Array(combined)], "event-document-pages.jpg", { type: "image/jpeg" });
    }
    params.onStage?.("preparing_source");
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
      text,
      originalFiles: (files as File[]).map((item) => ({ name: item.name, mimeType: item.type, sizeBytes: item.size })),
    };
    fileBuffer = prepared.buffer;
  } else {
    const body = await parseJsonRequestBody(params.request);
    clientIntakeId = validDiscoveryIntakeKey(body?.clientIntakeId);
    text = safeString(body?.text);
    workflow = normalizeWorkflow(body?.workflow || workflow);
    if ((workflow === "football" ? isFootballTemplateId : isGymMeetTemplateId)(body?.pageTemplateId)) pageTemplateId = body.pageTemplateId;
    activityProfile = normalizeSportActivityKey(body?.activityProfile);
    eventArchetype = normalizeSportEventArchetype(body?.eventArchetype);
    title = defaultTitleForWorkflow(workflow);
    const rawUrl = safeString(body?.url);
    if (!rawUrl && text) {
      if (text.length > 12_000) return { ok: false as const, status: 400, error: "Keep event details under 12,000 characters." };
      // A bounded durable source uses the same specialty parser without inventing a file upload.
      source = { type: "file", fileName: "pasted-event-details.txt", mimeType: "text/plain", sizeBytes: Buffer.byteLength(text), dataUrl: `data:text/plain;base64,${Buffer.from(text).toString("base64")}`, blobStored: false, activityProfile, eventArchetype, createdAt: now, updatedAt: now };
    } else {
    if (!rawUrl) return { ok: false as const, status: 400, error: "Provide a public URL or paste the event details." };
    let normalizedUrl = "";
    try {
      normalizedUrl = new URL(rawUrl).toString();
      // Validate public addressing and redirects before this URL reaches the specialty crawler.
      if (params.validatedUrl !== normalizedUrl)
        await readPublicCreateUrl(normalizedUrl, AbortSignal.any([params.request.signal, AbortSignal.timeout(20_000)]));
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
      text,
    };
    }
  }

  if (text.length > 12_000) return { ok: false as const, status: 400, error: "Keep event notes under 12,000 characters." };
  const authorizedCategory = workflow === "gymnastics" || workflow === "football" ? workflow : normalizeCreationCategory(activityProfile) || "sport-events";
  if (params.userId) await requireCreationAccess(params.userId, { product: "event_page", category: authorizedCategory });
  // The authorization stamp is derived from the authenticated server check, never request data.
  const retainedSource: DiscoverySourceRecord = {
    ...source,
    ...(params.userId ? { creationAuthorization: { version: 1 as const, userId: params.userId, product: "event_page" as const, category: authorizedCategory, authorizedAt: now } } : {}),
  };
  return withIdempotentDiscoveryIntake(params.userId, clientIntakeId, async (eventId) => {
  const pipeline = createDiscoveryPipelineState({
    processingStage: "ingested",
  });
  params.onStage?.("creating_draft");
  const created = await createDiscoveryShell({
    eventId,
    workflow,
    // Authenticated intake must retain ownership so the generated builder can load and save it.
    // Cancel still removes an unsaved `new=1` draft from the customize flow.
    userId: params.userId,
    title,
    source: retainedSource,
    pipeline,
    document: params.document,
    pageTemplateId: workflow === "gymnastics" || workflow === "football" ? pageTemplateId : null,
  });

  try {
  if (fileBuffer && retainedSource.type === "file") {
    params.onStage?.("storing_source");
    const { pathname, url } = await uploadDiscoveryInputToBlob({
      eventId: created.eventId,
      fileName: retainedSource.fileName || "upload",
      mimeType: retainedSource.mimeType || "application/octet-stream",
      bytes: fileBuffer,
    });
    await upsertEventHistoryInputBlob({
      eventId: created.eventId,
      mimeType: retainedSource.mimeType || "application/octet-stream",
      fileName: retainedSource.fileName || null,
      sizeBytes: retainedSource.sizeBytes ?? null,
      data: null,
      storagePathname: pathname,
      storageUrl: url,
    });
  }
  } catch (error) { if (created.created) await deleteEventHistoryById(created.eventId).catch(() => {}); throw error; }

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
  });
}

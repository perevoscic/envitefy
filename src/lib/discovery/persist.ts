import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  DEFAULT_NEW_GYM_MEET_TEMPLATE_ID,
} from "@/components/gym-meet-templates/registry";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import {
  deleteEventHistoryById,
  getEventDiscoveryByEventId,
  getEventHistoryById,
  insertEventDiscovery,
  insertEventHistory,
  updateEventHistoryData,
  updateEventHistoryTitle,
} from "@/lib/db";
import {
  buildEmptyDiscoveryBuilderDraft,
  buildEmptyDiscoveryPublicArtifacts,
  buildEmptyGymBuilderDraft,
  buildEmptyGymPublicArtifacts,
  createDiscoveryPipelineState,
  safeString,
} from "@/lib/discovery/shared";
import type {
  DiscoveryBuilderDraft,
  DiscoveryPipelineState,
  DiscoveryPublicArtifacts,
  DiscoverySourceRecord,
  DiscoveryWorkflow,
} from "@/lib/discovery/types";
import { invalidateUserHistory } from "@/lib/history-cache";

export function buildDiscoveryPipelineSummary(params: {
  discoveryId: string;
  pipeline: DiscoveryPipelineState;
  workflow?: DiscoveryWorkflow;
}) {
  return {
    processingStage: params.pipeline.processingStage,
    needsHumanReview: Boolean(params.pipeline.needsHumanReview),
    publishReady: Boolean(params.pipeline.publishReady),
    discoveryId: params.discoveryId,
    workflow: params.workflow || "gymnastics",
  };
}

export function buildDiscoveryShellEventData(params: {
  workflow: DiscoveryWorkflow;
  title: string;
  discoveryId: string;
  pipeline: DiscoveryPipelineState;
}) {
  const isFootball = params.workflow === "football";
  return {
    title: params.title,
    startISO: null,
    startAt: null,
    endISO: null,
    endAt: null,
    timezone: "America/Chicago",
    category: isFootball ? "sport_football_season" : "gymnastics",
    status: "processing",
    createdVia: isFootball ? "football-discovery-v2" : "meet-discovery-v2",
    templateId: isFootball ? "football-season" : "gymnastics-schedule",
    templateKey: isFootball ? "football" : "gymnastics",
    pageTemplateId: isFootball
      ? DEFAULT_GYM_MEET_TEMPLATE_ID
      : DEFAULT_NEW_GYM_MEET_TEMPLATE_ID,
    builderDraft: isFootball
      ? buildEmptyDiscoveryBuilderDraft()
      : buildEmptyGymBuilderDraft(),
    publicArtifacts: isFootball
      ? buildEmptyDiscoveryPublicArtifacts(params.title)
      : buildEmptyGymPublicArtifacts(params.title),
    pipelineSummary: buildDiscoveryPipelineSummary({
      discoveryId: params.discoveryId,
      pipeline: params.pipeline,
      workflow: params.workflow,
    }),
  };
}

export async function createDiscoveryShell(params: {
  userId: string | null;
  workflow: DiscoveryWorkflow;
  title: string;
  source: DiscoverySourceRecord;
  pipeline: DiscoveryPipelineState;
}) {
  const historyRow = await insertEventHistory({
    userId: params.userId,
    title: params.title,
    data: buildDiscoveryShellEventData({
      workflow: params.workflow,
      title: params.title,
      discoveryId: "pending",
      pipeline: params.pipeline,
    }),
  });
  try {
    const discoveryRow = await insertEventDiscovery({
      eventId: historyRow.id,
      workflow: params.workflow,
      source: params.source,
      pipeline: params.pipeline,
      document: null,
      canonicalParse: null,
      enrichment: null,
      debug: null,
    });
    const shellData = buildDiscoveryShellEventData({
      workflow: params.workflow,
      title: params.title,
      discoveryId: discoveryRow.id,
      pipeline: params.pipeline,
    });
    await updateEventHistoryData(historyRow.id, shellData);
    return {
      eventId: historyRow.id,
      discoveryId: discoveryRow.id,
      historyRow,
      discoveryRow,
    };
  } catch (error) {
    await deleteEventHistoryById(historyRow.id).catch(() => {});
    throw error;
  }
}

export function inferLegacyDiscoveryWorkflow(data: Record<string, any>): DiscoveryWorkflow | null {
  const workflow = safeString(data?.discoverySource?.workflow).toLowerCase();
  if (workflow === "football") return "football";
  if (workflow === "gymnastics") return "gymnastics";
  const createdVia = safeString(data?.createdVia).toLowerCase();
  if (createdVia === "football-discovery" || createdVia === "football-discovery-v2") {
    return "football";
  }
  if (createdVia === "meet-discovery" || createdVia === "meet-discovery-v2") {
    return "gymnastics";
  }
  const category = safeString(data?.category).toLowerCase();
  if (category === "sport_football_season" || safeString(data?.templateId) === "football-season") {
    return "football";
  }
  if (
    category === "sport_gymnastics_schedule" ||
    category === "gymnastics" ||
    safeString(data?.templateId) === "gymnastics-schedule"
  ) {
    return "gymnastics";
  }
  return null;
}

export async function ensureDiscoveryForExistingEvent(eventId: string) {
  const existing = await getEventDiscoveryByEventId(eventId);
  if (existing) return existing;
  const row = await getEventHistoryById(eventId);
  if (!row) return null;
  const current = (row.data || {}) as Record<string, any>;
  const source =
    current?.discoverySource?.input && typeof current.discoverySource.input === "object"
      ? (current.discoverySource.input as DiscoverySourceRecord)
      : null;
  if (!source?.type) return null;
  const workflow = inferLegacyDiscoveryWorkflow(current);
  if (!workflow) return null;
  const pipeline = createDiscoveryPipelineState({
    processingStage: "ingested",
  });
  const created = await insertEventDiscovery({
    eventId,
    workflow,
    source,
    pipeline,
    document: null,
    canonicalParse: null,
    enrichment: null,
    debug: null,
  });
  await updateEventHistoryData(eventId, {
    ...current,
    createdVia: workflow === "football" ? "football-discovery-v2" : "meet-discovery-v2",
    builderDraft:
      workflow === "football"
        ? buildEmptyDiscoveryBuilderDraft()
        : buildEmptyGymBuilderDraft(),
    publicArtifacts:
      workflow === "football"
        ? buildEmptyDiscoveryPublicArtifacts(row.title)
        : buildEmptyGymPublicArtifacts(row.title),
    pipelineSummary: buildDiscoveryPipelineSummary({
      discoveryId: created.id,
      pipeline,
      workflow,
    }),
  });
  return created;
}

export async function persistDiscoveryEventSnapshot(params: {
  workflow: DiscoveryWorkflow;
  eventId: string;
  title: string;
  timezone?: string | null;
  startISO?: string | null;
  endISO?: string | null;
  builderDraft: DiscoveryBuilderDraft;
  publicArtifacts: DiscoveryPublicArtifacts;
  pipeline: DiscoveryPipelineState;
  discoveryId: string;
  templateId?: string | null;
  pageTemplateId?: string | null;
  status: string;
  eventDataPatch?: Record<string, unknown>;
}) {
  const row = await getEventHistoryById(params.eventId);
  if (!row) return null;
  const isFootball = params.workflow === "football";
  const current = (row.data || {}) as Record<string, any>;
  const builderEvent = (params.builderDraft.event || {}) as Record<string, any>;
  const builderVenue = (params.builderDraft.venue || {}) as Record<string, any>;
  const nextTitle = safeString(params.title || builderEvent.title || row.title);
  const nextData = {
    ...current,
    title: nextTitle,
    startISO: params.startISO ?? builderEvent.startISO ?? current.startISO ?? null,
    startAt: params.startISO ?? builderEvent.startISO ?? current.startAt ?? null,
    endISO: params.endISO ?? builderEvent.endISO ?? current.endISO ?? null,
    endAt: params.endISO ?? builderEvent.endISO ?? current.endAt ?? null,
    timezone:
      safeString(params.timezone) ||
      safeString(builderEvent.timezone) ||
      safeString(current.timezone) ||
      "America/Chicago",
    category: isFootball ? "sport_football_season" : "gymnastics",
    status: params.status,
    createdVia: isFootball ? "football-discovery-v2" : "meet-discovery-v2",
    templateId:
      safeString(params.templateId) ||
      safeString(builderEvent.templateId) ||
      safeString(current.templateId) ||
      (isFootball ? "football-season" : "gymnastics-schedule"),
    templateKey: isFootball ? "football" : "gymnastics",
    pageTemplateId:
      safeString(params.pageTemplateId) ||
      safeString(builderEvent.pageTemplateId) ||
      safeString(current.pageTemplateId) ||
      (isFootball ? DEFAULT_GYM_MEET_TEMPLATE_ID : DEFAULT_NEW_GYM_MEET_TEMPLATE_ID),
    builderDraft: params.builderDraft,
    publicArtifacts: params.publicArtifacts,
    pipelineSummary: buildDiscoveryPipelineSummary({
      discoveryId: params.discoveryId,
      pipeline: params.pipeline,
      workflow: params.workflow,
    }),
    venue: safeString(builderVenue.venue) || safeString(current.venue) || "",
    address: safeString(builderVenue.address) || safeString(current.address) || "",
    details: safeString(builderEvent.details) || safeString(current.details) || "",
    hostGym: safeString(builderEvent.hostGym) || safeString(current.hostGym) || "",
    ...(params.eventDataPatch || {}),
  };
  const updated = await updateEventHistoryData(params.eventId, nextData);
  if (nextTitle && nextTitle !== row.title) {
    await updateEventHistoryTitle(params.eventId, nextTitle);
  }
  if (row.user_id) {
    invalidateUserHistory(row.user_id);
    invalidateUserDashboard(row.user_id);
  }
  return updated;
}

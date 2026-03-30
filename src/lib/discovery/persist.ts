import { DEFAULT_GYM_MEET_TEMPLATE_ID } from "@/components/gym-meet-templates/registry";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import {
  deleteEventHistoryById,
  getEventHistoryById,
  insertEventDiscovery,
  insertEventHistory,
  updateEventHistoryData,
  updateEventHistoryTitle,
} from "@/lib/db";
import {
  buildEmptyGymBuilderDraft,
  buildEmptyGymPublicArtifacts,
  safeString,
} from "@/lib/discovery/shared";
import type {
  DiscoveryPipelineState,
  DiscoverySourceRecord,
  GymBuilderDraft,
  GymPublicArtifacts,
} from "@/lib/discovery/types";
import { invalidateUserHistory } from "@/lib/history-cache";

export function buildDiscoveryPipelineSummary(params: {
  discoveryId: string;
  pipeline: DiscoveryPipelineState;
}) {
  return {
    processingStage: params.pipeline.processingStage,
    needsHumanReview: Boolean(params.pipeline.needsHumanReview),
    publishReady: Boolean(params.pipeline.publishReady),
    discoveryId: params.discoveryId,
  };
}

export function buildDiscoveryShellEventData(params: {
  title: string;
  discoveryId: string;
  pipeline: DiscoveryPipelineState;
}) {
  return {
    title: params.title,
    startISO: null,
    startAt: null,
    endISO: null,
    endAt: null,
    timezone: "America/Chicago",
    category: "gymnastics",
    status: "processing",
    createdVia: "meet-discovery-v2",
    templateId: "gymnastics-schedule",
    templateKey: "gymnastics",
    pageTemplateId: DEFAULT_GYM_MEET_TEMPLATE_ID,
    builderDraft: buildEmptyGymBuilderDraft(),
    publicArtifacts: buildEmptyGymPublicArtifacts(params.title),
    pipelineSummary: buildDiscoveryPipelineSummary({
      discoveryId: params.discoveryId,
      pipeline: params.pipeline,
    }),
  };
}

export async function createDiscoveryShell(params: {
  userId: string | null;
  title: string;
  source: DiscoverySourceRecord;
  pipeline: DiscoveryPipelineState;
}) {
  const historyRow = await insertEventHistory({
    userId: params.userId,
    title: params.title,
    data: buildDiscoveryShellEventData({
      title: params.title,
      discoveryId: "pending",
      pipeline: params.pipeline,
    }),
  });
  try {
    const discoveryRow = await insertEventDiscovery({
      eventId: historyRow.id,
      workflow: "gymnastics",
      source: params.source,
      pipeline: params.pipeline,
      document: null,
      canonicalParse: null,
      enrichment: null,
      debug: null,
    });
    const shellData = buildDiscoveryShellEventData({
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

export async function persistDiscoveryEventSnapshot(params: {
  eventId: string;
  title: string;
  timezone?: string | null;
  startISO?: string | null;
  endISO?: string | null;
  builderDraft: GymBuilderDraft;
  publicArtifacts: GymPublicArtifacts;
  pipeline: DiscoveryPipelineState;
  discoveryId: string;
  templateId?: string | null;
  pageTemplateId?: string | null;
  status: string;
}) {
  const row = await getEventHistoryById(params.eventId);
  if (!row) return null;
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
    category: "gymnastics",
    status: params.status,
    createdVia: "meet-discovery-v2",
    templateId:
      safeString(params.templateId) ||
      safeString(builderEvent.templateId) ||
      safeString(current.templateId) ||
      "gymnastics-schedule",
    templateKey: "gymnastics",
    pageTemplateId:
      safeString(params.pageTemplateId) ||
      safeString(builderEvent.pageTemplateId) ||
      safeString(current.pageTemplateId) ||
      DEFAULT_GYM_MEET_TEMPLATE_ID,
    builderDraft: params.builderDraft,
    publicArtifacts: params.publicArtifacts,
    pipelineSummary: buildDiscoveryPipelineSummary({
      discoveryId: params.discoveryId,
      pipeline: params.pipeline,
    }),
    venue: safeString(builderVenue.venue) || safeString(current.venue) || "",
    address: safeString(builderVenue.address) || safeString(current.address) || "",
    details: safeString(builderEvent.details) || safeString(current.details) || "",
    hostGym: safeString(builderEvent.hostGym) || safeString(current.hostGym) || "",
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

import { extractConciergeDraft } from "./extract.ts";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { insertEventHistory } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { buildEventAssetContent } from "./assets.ts";
import { createEventAsset, upsertCreationSession } from "./event-storage.ts";
import { buildAssistantMessage, buildSuggestedReplies, canSaveConciergeDraft } from "./fallback.ts";
import { buildConciergeHistoryPayload } from "./history-payload.ts";
import type {
  ConciergeEventDraft,
  ConciergeMessageResponse,
  CreationIntakeRequest,
  CreationSession,
  EventAssetType,
  RequestedOutput,
} from "./types.ts";

export type CreationIntakeResult = Extract<ConciergeMessageResponse, { ok: true }>;

const OUTPUT_ASSET_TYPES: Partial<Record<RequestedOutput, EventAssetType>> = {
  live_card: "live_card",
  invitation: "invitation",
  rsvp_page: "rsvp_page",
  whatsapp: "whatsapp",
  printable_flyer: "printable_flyer",
  instagram_story: "instagram_story",
  reminder: "reminder_message",
  thank_you_card: "thank_you_card",
  menu: "menu",
  welcome_sign: "welcome_sign",
};

function uniqueAssetTypes(outputs: RequestedOutput[]): EventAssetType[] {
  return Array.from(
    new Set(
      outputs
        .map((output) => OUTPUT_ASSET_TYPES[output])
        .filter((output): output is EventAssetType => Boolean(output)),
    ),
  );
}

async function persistCreationAsEvent(params: {
  userId: string;
  draft: ConciergeEventDraft;
}): Promise<{ eventId: string }> {
  const payload = buildConciergeHistoryPayload(params.draft);
  const data = {
    ...payload.data,
    status: "published",
    draftStatus: "published",
  };
  const event = await insertEventHistory({
    userId: params.userId,
    title: payload.title,
    data,
  });
  const assetTypes = uniqueAssetTypes(params.draft.requestedOutputs);
  const targetAssetTypes: EventAssetType[] = assetTypes.length ? assetTypes : ["live_card"];
  for (const assetType of targetAssetTypes) {
    const generated = buildEventAssetContent({
      eventId: event.id,
      eventTitle: event.title,
      eventData: data,
      assetType,
      brief: `Create the requested ${assetType.replace(/_/g, " ")}.`,
    });
    await createEventAsset({
      userId: params.userId,
      eventId: event.id,
      assetType,
      title: generated.title,
      status: "published",
      content: {
        ...generated.content,
        previewCopy: params.draft.previewCopy,
      },
      design: generated.design,
      metadata: {
        ...generated.metadata,
        generatedBy: "concierge_creation_intake",
        creationSessionId: params.draft.creationSessionId,
      },
    });
  }
  invalidateUserHistory(params.userId);
  invalidateUserDashboard(params.userId);
  return { eventId: event.id };
}

export async function handleCreationIntake(params: {
  userId: string;
  request: CreationIntakeRequest;
}): Promise<CreationIntakeResult> {
  const request = params.request;
  const isSaveAction = Boolean(request.action === "save" && request.draft);
  const result = isSaveAction
    ? {
        draft: request.draft as ConciergeEventDraft,
      }
    : await extractConciergeDraft({
        message: request.message || "",
        draft: request.draft || null,
        ocrContext: request.ocrContext || null,
        activeContext: request.activeContext || null,
        action: request.action || "message",
      });
  const draft = {
    ...result.draft,
    creationSessionId: request.creationSessionId || result.draft.creationSessionId,
  };

  let creationSession: CreationSession | null = null;
  const shouldPersistSession =
    request.persistSession !== false &&
    (draft.canPersist || draft.requestedOutputs.length > 0 || Boolean(request.ocrContext));
  if (shouldPersistSession) {
    creationSession = await upsertCreationSession({
      userId: params.userId,
      draft,
      activeContext: (request.activeContext || {}) as Record<string, unknown>,
      metadata: {
        action: request.action || "message",
        canPersist: draft.canPersist,
      },
    });
  }

  if (isSaveAction) {
    const saved = await persistCreationAsEvent({
      userId: params.userId,
      draft,
    });
    return {
      ok: true,
      draft,
      creationSession,
      assistantMessage: "Your live card is ready. Opening the workspace now.",
      suggestedReplies: ["Open workspace"],
      canSave: false,
      savedEventId: saved.eventId,
    };
  }

  return {
    ok: true,
    draft,
    creationSession,
    assistantMessage: buildAssistantMessage(draft),
    suggestedReplies: buildSuggestedReplies(draft),
    canSave: canSaveConciergeDraft(draft),
  };
}

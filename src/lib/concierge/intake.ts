import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { insertEventHistory } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { buildEventAssetContent } from "./assets.ts";
import {
  claimCreationSessionSave,
  createEventAsset,
  getCreationSession,
  getLatestCreationSession,
  markCreationSessionSaved,
  upsertCreationSession,
} from "./event-storage.ts";
import { extractConciergeDraft } from "./extract.ts";
import {
  buildAssistantMessage,
  buildSuggestedReplies,
  canSaveConciergeDraft,
  fallbackExtractConciergeDraft,
} from "./fallback.ts";
import { buildConciergeHistoryPayload } from "./history-payload.ts";
import type {
  ConciergeEventDraft,
  ConciergeMessageResponse,
  ConciergeStudioInvite,
  CreationChatMessageSnapshot,
  CreationIntakeRequest,
  CreationSession,
  CreationSessionResumeResponse,
  EventAssetType,
  RequestedOutput,
} from "./types.ts";

export type CreationIntakeResult = Extract<ConciergeMessageResponse, { ok: true }>;
export type CreationSessionResumeResult = Extract<CreationSessionResumeResponse, { ok: true }>;

type TimingRecorder = {
  time<T>(name: string, work: () => Promise<T>): Promise<T>;
};

const OUTPUT_ASSET_TYPES: Partial<Record<RequestedOutput, EventAssetType>> = {
  event_page: "event_page",
  live_card: "live_card",
  signup_form: "signup_form",
  digital_flyer: "printable_flyer",
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
  studioInvite?: ConciergeStudioInvite | null;
}): Promise<{ eventId: string }> {
  const payload = buildConciergeHistoryPayload(params.draft, {
    studioInvite: params.studioInvite,
  });
  const data = payload.data;
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
        ...(assetType === "invitation" && params.studioInvite?.imageUrl
          ? {
              imageUrl: params.studioInvite.imageUrl,
              invitationData: params.studioInvite.invitationData || null,
            }
          : {}),
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

function getSavedEventId(session: CreationSession | null): string | null {
  const value = session?.metadata?.savedEventId;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getRequestedCreationSessionId(request: CreationIntakeRequest): string {
  const value = request.creationSessionId || request.draft?.creationSessionId;
  return typeof value === "string" ? value.trim() : "";
}

function requestDraftMatchesSession(request: CreationIntakeRequest, session: CreationSession) {
  const requestSessionId = request.draft?.creationSessionId?.trim();
  if (!requestSessionId) return false;
  return requestSessionId === session.id || requestSessionId === session.draft.creationSessionId;
}

const MAX_CREATION_CHAT_MESSAGES = 50;
const MAX_CREATION_CHAT_MESSAGE_TEXT_LENGTH = 4000;

function normalizeChatMessages(value: unknown): CreationChatMessageSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((message): CreationChatMessageSnapshot | null => {
      if (!message || typeof message !== "object") return null;
      const role = (message as { role?: unknown }).role;
      const text = (message as { text?: unknown }).text;
      if (role !== "user" && role !== "assistant" && role !== "system") return null;
      if (typeof text !== "string" || !text.trim()) return null;
      const id = (message as { id?: unknown }).id;
      const createdAt = (message as { createdAt?: unknown }).createdAt;
      return {
        ...(typeof id === "string" && id.trim() ? { id: id.trim() } : {}),
        role,
        text: text.trim().slice(0, MAX_CREATION_CHAT_MESSAGE_TEXT_LENGTH),
        createdAt:
          typeof createdAt === "string" && createdAt.trim()
            ? createdAt.trim()
            : new Date().toISOString(),
      };
    })
    .filter((message): message is CreationChatMessageSnapshot => Boolean(message))
    .slice(-MAX_CREATION_CHAT_MESSAGES);
}

function chatMessagesFromSession(session: CreationSession | null): CreationChatMessageSnapshot[] {
  return normalizeChatMessages(session?.metadata?.chatMessages);
}

function appendAssistantChatMessage(
  messages: CreationChatMessageSnapshot[],
  text: string,
): CreationChatMessageSnapshot[] {
  const trimmedText = text.trim();
  if (!trimmedText) return messages.slice(-MAX_CREATION_CHAT_MESSAGES);
  const latest = messages[messages.length - 1];
  if (latest?.role === "assistant" && latest.text === trimmedText) {
    return messages.slice(-MAX_CREATION_CHAT_MESSAGES);
  }
  const assistantSnapshot: CreationChatMessageSnapshot = {
    role: "assistant",
    text: trimmedText.slice(0, MAX_CREATION_CHAT_MESSAGE_TEXT_LENGTH),
    createdAt: new Date().toISOString(),
  };
  return [...messages, assistantSnapshot].slice(-MAX_CREATION_CHAT_MESSAGES);
}

function chatMessagesMetadata(messages: CreationChatMessageSnapshot[]): Record<string, unknown> {
  return messages.length ? { chatMessages: messages } : {};
}

export async function resumeLatestCreationSession(params: {
  userId: string;
  timing?: TimingRecorder;
}): Promise<CreationSessionResumeResult> {
  const creationSession = await (params.timing?.time("db_read", () =>
    getLatestCreationSession({ userId: params.userId }),
  ) ?? getLatestCreationSession({ userId: params.userId }));

  if (!creationSession) {
    return {
      ok: true,
      draft: null,
      creationSession: null,
      assistantMessage: "",
      suggestedReplies: [],
      canSave: false,
      savedEventId: null,
      chatMessages: [],
    };
  }

  const savedEventId = getSavedEventId(creationSession);
  const draft = creationSession.draft;
  const chatMessages = chatMessagesFromSession(creationSession);
  return {
    ok: true,
    draft,
    creationSession,
    assistantMessage: savedEventId ? "Your invite is ready." : buildAssistantMessage(draft),
    suggestedReplies: savedEventId ? ["View invite"] : buildSuggestedReplies(draft),
    canSave: savedEventId ? false : canSaveConciergeDraft(draft),
    savedEventId,
    chatMessages,
  };
}

export async function resumeCreationSession(params: {
  userId: string;
  sessionId: string;
  timing?: TimingRecorder;
}): Promise<CreationSessionResumeResult> {
  const creationSession = await (params.timing?.time("db_read", () =>
    getCreationSession({ userId: params.userId, sessionId: params.sessionId }),
  ) ?? getCreationSession({ userId: params.userId, sessionId: params.sessionId }));

  if (!creationSession) {
    return {
      ok: true,
      draft: null,
      creationSession: null,
      assistantMessage: "",
      suggestedReplies: [],
      canSave: false,
      savedEventId: null,
      chatMessages: [],
    };
  }

  const savedEventId = getSavedEventId(creationSession);
  const draft = creationSession.draft;
  const chatMessages = chatMessagesFromSession(creationSession);
  return {
    ok: true,
    draft,
    creationSession,
    assistantMessage: savedEventId ? "Your invite is ready." : buildAssistantMessage(draft),
    suggestedReplies: savedEventId ? ["View invite"] : buildSuggestedReplies(draft),
    canSave: savedEventId ? false : canSaveConciergeDraft(draft),
    savedEventId,
    chatMessages,
  };
}

export async function resolveCreationIntakeDraft(params: {
  request: CreationIntakeRequest;
  timing?: TimingRecorder;
}) {
  const request = params.request;
  const isSaveAction = request.action === "save";
  return isSaveAction
    ? {
        draft:
          request.draft ||
          fallbackExtractConciergeDraft({
            message: request.message || "",
            ocrContext: request.ocrContext || null,
            activeContext: request.activeContext || null,
            requestedOutputs: request.requestedOutputs || null,
            action: request.action || "message",
          }),
      }
    : await (params.timing?.time("model_extraction", () =>
        extractConciergeDraft({
          message: request.message || "",
          draft: request.draft || null,
          ocrContext: request.ocrContext || null,
          activeContext: request.activeContext || null,
          requestedOutputs: request.requestedOutputs || null,
          action: request.action || "message",
        }),
      ) ??
        extractConciergeDraft({
          message: request.message || "",
          draft: request.draft || null,
          ocrContext: request.ocrContext || null,
          activeContext: request.activeContext || null,
          requestedOutputs: request.requestedOutputs || null,
          action: request.action || "message",
        }));
}

export async function handleCreationIntake(params: {
  userId: string;
  request: CreationIntakeRequest;
  timing?: TimingRecorder;
}): Promise<CreationIntakeResult> {
  const result = await resolveCreationIntakeDraft({
    request: params.request,
    timing: params.timing,
  });
  return finalizeCreationIntake({
    ...params,
    result,
  });
}

export async function finalizeCreationIntake(params: {
  userId: string;
  request: CreationIntakeRequest;
  result: { draft: ConciergeEventDraft };
  assistantMessageOverride?: string | null;
  timing?: TimingRecorder;
}): Promise<CreationIntakeResult> {
  const request = params.request;
  const isSaveAction = request.action === "save";
  const result = params.result;
  let draft = {
    ...result.draft,
    creationSessionId: request.creationSessionId || result.draft.creationSessionId,
  };
  const requestChatMessages = normalizeChatMessages(request.chatMessages);
  const assistantMessage = isSaveAction
    ? ""
    : params.assistantMessageOverride?.trim() || buildAssistantMessage(draft);

  let creationSession: CreationSession | null = null;
  let existingSessionChatMessages: CreationChatMessageSnapshot[] = [];
  if (isSaveAction) {
    const requestedCreationSessionId = getRequestedCreationSessionId(request);
    if (!requestedCreationSessionId) {
      throw new Error("Creation session id is required to create this invite.");
    }
    const existingSession = await (params.timing?.time("db_read", () =>
      getCreationSession({
        userId: params.userId,
        sessionId: requestedCreationSessionId,
      }),
    ) ??
      getCreationSession({
        userId: params.userId,
        sessionId: requestedCreationSessionId,
      }));
    if (!existingSession) {
      throw new Error("Creation session was not found for this user.");
    }
    existingSessionChatMessages = chatMessagesFromSession(existingSession);
    const existingSavedEventId = getSavedEventId(existingSession);
    if (existingSavedEventId) {
      return {
        ok: true,
        draft: {
          ...existingSession!.draft,
          draftStatus: "published",
        },
        creationSession: existingSession,
        assistantMessage: "Your invite is ready.",
        suggestedReplies: ["View invite"],
        canSave: false,
        savedEventId: existingSavedEventId,
        chatMessages: requestChatMessages.length
          ? requestChatMessages
          : existingSessionChatMessages,
      };
    }
    if (!canSaveConciergeDraft(existingSession.draft)) {
      throw new Error("Add the missing event details before creating this invite.");
    }
    creationSession = await (params.timing?.time("db_write", () =>
      claimCreationSessionSave({
        userId: params.userId,
        sessionId: requestedCreationSessionId,
      }),
    ) ??
      claimCreationSessionSave({
        userId: params.userId,
        sessionId: requestedCreationSessionId,
      }));
    if (!creationSession) {
      throw new Error("This invite is already being created. Please wait a moment.");
    }
    draft = {
      ...creationSession.draft,
      ...(requestDraftMatchesSession(request, creationSession) && request.draft
        ? {
            requestedOutputs: request.draft.requestedOutputs,
            outputs: request.draft.outputs,
          }
        : {}),
      creationSessionId: creationSession.draft.creationSessionId || creationSession.id,
    };
  }
  const shouldPersistSession =
    request.persistSession !== false &&
    !isSaveAction &&
    (draft.canPersist || draft.requestedOutputs.length > 0 || Boolean(request.ocrContext));
  const chatMessagesForUpsert = requestChatMessages.length
    ? appendAssistantChatMessage(requestChatMessages, assistantMessage)
    : [];
  if (shouldPersistSession) {
    creationSession = await (params.timing?.time("db_write", () =>
      upsertCreationSession({
        userId: params.userId,
        draft,
        activeContext: (request.activeContext || {}) as Record<string, unknown>,
        metadata: {
          action: request.action || "message",
          canPersist: draft.canPersist,
          ...chatMessagesMetadata(chatMessagesForUpsert),
        },
      }),
    ) ??
      upsertCreationSession({
        userId: params.userId,
        draft,
        activeContext: (request.activeContext || {}) as Record<string, unknown>,
        metadata: {
          action: request.action || "message",
          canPersist: draft.canPersist,
          ...chatMessagesMetadata(chatMessagesForUpsert),
        },
      }));
  }

  if (isSaveAction) {
    const saveChatMessages = requestChatMessages.length
      ? requestChatMessages
      : chatMessagesFromSession(creationSession).length
        ? chatMessagesFromSession(creationSession)
        : existingSessionChatMessages;
    const saved = await (params.timing?.time("db_write", () =>
      persistCreationAsEvent({
        userId: params.userId,
        draft,
        studioInvite: request.studioInvite,
      }),
    ) ??
      persistCreationAsEvent({
        userId: params.userId,
        draft,
        studioInvite: request.studioInvite,
      }));
    const savedDraft: ConciergeEventDraft = {
      ...draft,
      draftStatus: "published",
    };
    if (!creationSession) {
      throw new Error("Creation session must be claimed before saving.");
    }
    creationSession = await (params.timing?.time("db_write", () =>
      markCreationSessionSaved({
        userId: params.userId,
        sessionId: draft.creationSessionId,
        eventId: saved.eventId,
        draft: savedDraft,
        metadata: chatMessagesMetadata(saveChatMessages),
      }),
    ) ??
      markCreationSessionSaved({
        userId: params.userId,
        sessionId: draft.creationSessionId,
        eventId: saved.eventId,
        draft: savedDraft,
        metadata: chatMessagesMetadata(saveChatMessages),
      }));
    if (!creationSession) {
      throw new Error("Creation session could not be marked saved.");
    }
    return {
      ok: true,
      draft: savedDraft,
      creationSession,
      assistantMessage: "Your invite is ready.",
      suggestedReplies: ["View invite"],
      canSave: false,
      savedEventId: saved.eventId,
      chatMessages: chatMessagesFromSession(creationSession).length
        ? chatMessagesFromSession(creationSession)
        : saveChatMessages,
    };
  }

  const responseChatMessages = chatMessagesFromSession(creationSession).length
    ? chatMessagesFromSession(creationSession)
    : requestChatMessages.length
      ? appendAssistantChatMessage(requestChatMessages, assistantMessage)
      : [];
  return {
    ok: true,
    draft,
    creationSession,
    assistantMessage,
    suggestedReplies: buildSuggestedReplies(draft),
    canSave: canSaveConciergeDraft(draft),
    chatMessages: responseChatMessages,
  };
}

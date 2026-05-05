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
import { buildAssistantMessage, buildSuggestedReplies, canSaveConciergeDraft } from "./fallback.ts";
import { buildConciergeHistoryPayload } from "./history-payload.ts";
import type {
  CreationChatMessageSnapshot,
  ConciergeEventDraft,
  ConciergeMessageResponse,
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
  event_page: "live_card",
  live_card: "live_card",
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
}): Promise<{ eventId: string }> {
  const payload = buildConciergeHistoryPayload(params.draft);
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
    assistantMessage: savedEventId ? "Your workspace is ready." : buildAssistantMessage(draft),
    suggestedReplies: savedEventId ? ["Open workspace"] : buildSuggestedReplies(draft),
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
    assistantMessage: savedEventId ? "Your workspace is ready." : buildAssistantMessage(draft),
    suggestedReplies: savedEventId ? ["Open workspace"] : buildSuggestedReplies(draft),
    canSave: savedEventId ? false : canSaveConciergeDraft(draft),
    savedEventId,
    chatMessages,
  };
}

export async function handleCreationIntake(params: {
  userId: string;
  request: CreationIntakeRequest;
  timing?: TimingRecorder;
}): Promise<CreationIntakeResult> {
  const request = params.request;
  const isSaveAction = Boolean(request.action === "save" && request.draft);
  const result = isSaveAction
    ? {
        draft: request.draft as ConciergeEventDraft,
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
  const draft = {
    ...result.draft,
    creationSessionId: request.creationSessionId || result.draft.creationSessionId,
  };
  const requestChatMessages = normalizeChatMessages(request.chatMessages);
  const assistantMessage = isSaveAction ? "" : buildAssistantMessage(draft);

  let creationSession: CreationSession | null = null;
  let existingSessionChatMessages: CreationChatMessageSnapshot[] = [];
  if (isSaveAction) {
    const existingSession = await (params.timing?.time("db_read", () =>
      getCreationSession({
        userId: params.userId,
        sessionId: draft.creationSessionId,
      }),
    ) ??
      getCreationSession({
        userId: params.userId,
        sessionId: draft.creationSessionId,
      }));
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
        assistantMessage: "Your workspace is ready. Opening it now.",
        suggestedReplies: ["Open workspace"],
        canSave: false,
        savedEventId: existingSavedEventId,
        chatMessages: requestChatMessages.length
          ? requestChatMessages
          : existingSessionChatMessages,
      };
    }
    if (existingSession) {
      creationSession = await (params.timing?.time("db_write", () =>
        claimCreationSessionSave({
          userId: params.userId,
          sessionId: draft.creationSessionId,
        }),
      ) ??
        claimCreationSessionSave({
          userId: params.userId,
          sessionId: draft.creationSessionId,
        }));
      if (!creationSession) {
        throw new Error("This workspace is already being created. Please wait a moment.");
      }
    }
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
      }),
    ) ??
      persistCreationAsEvent({
        userId: params.userId,
        draft,
      }));
    const savedDraft: ConciergeEventDraft = {
      ...draft,
      draftStatus: "published",
    };
    if (creationSession) {
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
    } else {
      creationSession = await (params.timing?.time("db_write", () =>
        upsertCreationSession({
          userId: params.userId,
          draft: savedDraft,
          activeContext: (request.activeContext || {}) as Record<string, unknown>,
          metadata: {
            action: request.action || "save",
            canPersist: savedDraft.canPersist,
            savedEventId: saved.eventId,
            savedAt: new Date().toISOString(),
            ...chatMessagesMetadata(saveChatMessages),
          },
        }),
      ) ??
        upsertCreationSession({
          userId: params.userId,
          draft: savedDraft,
          activeContext: (request.activeContext || {}) as Record<string, unknown>,
          metadata: {
            action: request.action || "save",
            canPersist: savedDraft.canPersist,
            savedEventId: saved.eventId,
            savedAt: new Date().toISOString(),
            ...chatMessagesMetadata(saveChatMessages),
          },
        }));
    }
    return {
      ok: true,
      draft: savedDraft,
      creationSession,
      assistantMessage: "Your workspace is ready. Opening it now.",
      suggestedReplies: ["Open workspace"],
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

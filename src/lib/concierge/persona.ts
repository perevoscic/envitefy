import OpenAI from "openai";
import {
  resolveConciergeOpenAiPersonaModel,
  resolveConciergeOpenAiPersonaTimeoutMs,
  resolveConciergeStreamFirstTokenTimeoutMs,
} from "./openai-config.ts";
import type { ConciergeEventDraft, CreationChatMessageSnapshot } from "./types.ts";

type PersonaDeps = {
  openAiApiKey?: string | null;
  openAiModel?: string | null;
  createOpenAiClient?: (apiKey: string) => OpenAI;
};

export type StreamConciergePersonaParams = {
  message: string;
  chatMessages: CreationChatMessageSnapshot[];
  draft: ConciergeEventDraft;
  fallbackMessage: string;
  onDelta: (text: string) => void;
};

export type StreamConciergePersonaResult = {
  assistantMessage: string;
  usedAi: boolean;
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function draftContext(draft: ConciergeEventDraft) {
  return {
    requestedOutputs: draft.requestedOutputs,
    eventPurpose: draft.eventPurpose,
    eventType: draft.eventType,
    title: draft.title,
    draftStatus: draft.draftStatus,
    currentQuestion: draft.currentQuestion,
    honoreeName: draft.honoreeName,
    ageOrMilestone: draft.ageOrMilestone,
    dateText: draft.dateText,
    timeText: draft.timeText,
    startISO: draft.startISO,
    timezone: draft.timezone,
    location: draft.location,
    venue: draft.venue,
    theme: draft.theme,
    tone: draft.tone,
    missingFields: draft.missingFields,
    canPersist: draft.canPersist,
  };
}

function conversationMessages(messages: CreationChatMessageSnapshot[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.text.slice(0, 1200),
    }));
}

function streamFallback(fallbackMessage: string, onDelta: (text: string) => void) {
  const fallback = cleanString(fallbackMessage) || "What should we add next?";
  onDelta(fallback);
  return {
    assistantMessage: fallback,
    usedAi: false,
  };
}

export async function streamConciergePersona(
  params: StreamConciergePersonaParams,
  deps: PersonaDeps = {},
): Promise<StreamConciergePersonaResult> {
  const apiKey = deps.openAiApiKey ?? process.env.OPENAI_API_KEY ?? null;
  if (!apiKey) return streamFallback(params.fallbackMessage, params.onDelta);

  const client = deps.createOpenAiClient?.(apiKey) || new OpenAI({ apiKey });
  const model = resolveConciergeOpenAiPersonaModel(deps.openAiModel);
  const controller = new AbortController();
  const firstOutputTimeoutMs = Math.min(
    resolveConciergeOpenAiPersonaTimeoutMs(),
    resolveConciergeStreamFirstTokenTimeoutMs(),
  );
  let firstOutputTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    controller.abort();
  }, firstOutputTimeoutMs);
  const chunks: string[] = [];

  const clearFirstOutputTimer = () => {
    if (firstOutputTimer) {
      clearTimeout(firstOutputTimer);
      firstOutputTimer = null;
    }
  };

  try {
    const stream = await client.chat.completions.create(
      {
        model,
        stream: true,
        temperature: 0.7,
        max_completion_tokens: 220,
        messages: [
          {
            role: "system",
            content: [
              "You are the Envitefy Concierge, a polished AI event architect.",
              "Speak with warm, sophisticated event-planning language.",
              "Use the current draft as truth. Do not invent dates, locations, names, RSVP rules, prices, private data, or links.",
              "Acknowledge concrete details from the latest user message.",
              "If details are missing, ask at most two short questions total.",
              "Put each question on its own line.",
              "Never send a checklist, numbered list, or multi-question intake block.",
              "When the draft is ready, invite the user to Generate the workspace.",
              "Keep the reply concise: one or two short sentences.",
            ].join(" "),
          },
          ...conversationMessages(params.chatMessages),
          {
            role: "user",
            content: JSON.stringify({
              latestMessage: params.message,
              currentDraft: draftContext(params.draft),
              deterministicFallback: params.fallbackMessage,
            }),
          },
        ],
      } as any,
      { signal: controller.signal } as any,
    );

    for await (const chunk of stream as any) {
      const delta =
        typeof chunk?.choices?.[0]?.delta?.content === "string"
          ? chunk.choices[0].delta.content
          : "";
      if (!delta) continue;
      clearFirstOutputTimer();
      chunks.push(delta);
      params.onDelta(delta);
    }

    clearFirstOutputTimer();
    const assistantMessage = chunks.join("").trim();
    if (!assistantMessage) return streamFallback(params.fallbackMessage, params.onDelta);
    return {
      assistantMessage,
      usedAi: true,
    };
  } catch (error) {
    clearFirstOutputTimer();
    if (chunks.length) {
      return {
        assistantMessage: chunks.join("").trim(),
        usedAi: true,
      };
    }
    if (!controller.signal.aborted && process.env.NODE_ENV !== "production") {
      console.warn("[concierge] OpenAI persona stream failed; using fallback", error);
    }
    return streamFallback(params.fallbackMessage, params.onDelta);
  }
}

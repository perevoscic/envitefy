import OpenAI from "openai";
import {
  resolveConciergeOpenAiPersonaModel,
  resolveConciergeOpenAiPersonaTimeoutMs,
  resolveConciergeStreamFirstTokenTimeoutMs,
} from "./openai-config.ts";
import type {
  ConciergeEventDraft,
  ConciergeWeatherContext,
  CreationChatMessageSnapshot,
} from "./types.ts";

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
  weatherContext?: ConciergeWeatherContext | null;
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

function sanitizePersonaCopy(value: string, options: { trim?: boolean } = {}) {
  const cleaned = value
    .replace(/^\s*\*{3,}\s*$/gm, "")
    .replace(/\*{1,3}([^*\n]+?)\*{1,3}/g, "$1")
    .replace(/\*{2,}/g, "")
    .replace(/__([^_\n]+?)__/g, "$1")
    .replace(/\s+(?:in|using|for)\s+[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?\s+time\b/gi, "")
    .replace(/\s+[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?\s+time\b/gi, "")
    .replace(/\s*\([A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?\)\s*/gi, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n");
  return options.trim === false ? cleaned : cleaned.trim();
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
    location: draft.location,
    venue: draft.venue,
    rsvpEnabled: draft.rsvpEnabled,
    numberOfGuests: draft.numberOfGuests,
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

function shouldUseDeterministicFallback(draft: ConciergeEventDraft) {
  return draft.currentQuestion === "date_confirmation";
}

export async function streamConciergePersona(
  params: StreamConciergePersonaParams,
  deps: PersonaDeps = {},
): Promise<StreamConciergePersonaResult> {
  if (shouldUseDeterministicFallback(params.draft)) {
    return streamFallback(params.fallbackMessage, params.onDelta);
  }

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
        temperature: 0.55,
        max_completion_tokens: 220,
        messages: [
          {
            role: "system",
            content: [
              "You are the Envitefy Concierge, a polished AI event architect.",
              "Speak with warm, sophisticated event-planning language.",
              "Use the current draft as truth. Do not invent dates, locations, names, RSVP rules, prices, private data, or links.",
              "If the user asks about weather, use only the supplied weatherContext. If weatherContext is missing or unavailable, say what detail or setup is needed instead of guessing.",
              "Acknowledge concrete details from the latest user message.",
              "Never use markdown, asterisks, star separators, or horizontal dividers. The interface handles bold detail highlighting.",
              "When confirming user-provided event details, put each detail on its own plain line, for example: Honoree: Lara turning 7. Time: 12:00 PM. Location: AMC Theater. RSVP guest count: 23.",
              "If details are missing, ask at most two short questions total.",
              "Put each question on its own line.",
              "Never send a checklist, numbered list, or multi-question intake block.",
              "Never mention default or IANA timezone names like America/Chicago; ask for the user's date and time naturally.",
              "When the draft is ready, verify the selected product and captured details on separate lines, then invite the user to generate the selected product.",
              "Use the deterministicFallback as the wording and detail source when it already contains a verification block.",
              "Keep the reply concise: one or two short sentences.",
            ].join(" "),
          },
          ...conversationMessages(params.chatMessages),
          {
            role: "user",
            content: JSON.stringify({
              latestMessage: params.message,
              currentDraft: draftContext(params.draft),
              weatherContext: params.weatherContext || null,
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
      params.onDelta(sanitizePersonaCopy(delta, { trim: false }));
    }

    clearFirstOutputTimer();
    const assistantMessage = sanitizePersonaCopy(chunks.join(""));
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

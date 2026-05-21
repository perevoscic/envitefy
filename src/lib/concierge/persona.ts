import OpenAI from "openai";
import {
  openAiChatTemperatureParam,
  resolveConciergeOpenAiPersonaModel,
  resolveConciergeOpenAiPersonaTimeoutMs,
  resolveConciergeStreamFirstTokenTimeoutMs,
} from "./openai-config.ts";
import type {
  ConciergeEventDraft,
  ConciergeWeatherContext,
  CreationChatMessageSnapshot,
  RequestedOutput,
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

const OUTPUT_LABELS: Record<RequestedOutput, string> = {
  event_page: "Event page",
  live_card: "Live card",
  digital_flyer: "Flyer/Invitation",
  signup_form: "Smart sign-up",
  invitation: "Flyer/Invitation",
  rsvp_page: "RSVP page",
  whatsapp: "WhatsApp",
  text_message: "Text message",
  printable_flyer: "Printable flyer",
  instagram_story: "Story",
  reminder: "Reminder",
  thank_you_card: "Thank you card",
  menu: "Menu",
  welcome_sign: "Welcome sign",
};

function outputLabel(output: RequestedOutput) {
  return OUTPUT_LABELS[output] || output.replace(/_/g, " ");
}

function publicizeInternalOutputKeys(value: string) {
  return Object.entries(OUTPUT_LABELS).reduce(
    (text, [output, label]) =>
      text.replace(
        new RegExp(`\\b${output.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"),
        label,
      ),
    value,
  );
}

function sanitizePersonaCopy(value: string, options: { trim?: boolean } = {}) {
  const cleaned = publicizeInternalOutputKeys(value)
    .replace(/^\s*\*{3,}\s*$/gm, "")
    .replace(/\*{1,3}([^*\n]+?)\*{1,3}/g, "$1")
    .replace(/\*{2,}/g, "")
    .replace(/__([^_\n]+?)__/g, "$1")
    .replace(/\b(?:bestie|babe|girlie|queen|omg|lol)\b[!,. ]*/gi, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/!{2,}/g, "!")
    .replace(/\s+(?:in|using|for)\s+[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?\s+time\b/gi, "")
    .replace(/\s+[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?\s+time\b/gi, "")
    .replace(/\s*\([A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?\)\s*/gi, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n");
  return options.trim === false ? cleaned : cleaned.trim();
}

function draftContext(draft: ConciergeEventDraft) {
  return {
    selectedProducts: draft.requestedOutputs.map(outputLabel),
    capturedDetails: {
      names: draft.honoreeName,
      title: draft.title,
      date: draft.dateText,
      time: draft.timeText,
      location: draft.location || draft.venue,
      theme: draft.theme,
      vibe: draft.tone,
      rsvpGuestCount: draft.numberOfGuests,
      rsvpDeadline: draft.rsvpDeadline,
      registryLink: draft.registryLink || draft.giftRegistryLink,
      giftNote: draft.giftPreferenceNote || draft.giftNote,
    },
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
    rsvpDeadline: draft.rsvpDeadline,
    rsvpName: draft.rsvpName,
    rsvpContact: draft.rsvpContact,
    numberOfGuests: draft.numberOfGuests,
    registryLink: draft.registryLink || draft.giftRegistryLink,
    giftPreferenceNote: draft.giftPreferenceNote || draft.giftNote,
    theme: draft.theme,
    tone: draft.tone,
    conversationState: draft.conversationState || null,
    knowledgeAnswer: draft.knowledgeAnswer,
    assistantGuidance: draft.assistantGuidance,
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
  const fallback =
    fallbackMessage
      .replace(/[ \t]+/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim() || "What should we add next?";
  onDelta(fallback);
  return {
    assistantMessage: fallback,
    usedAi: false,
  };
}

function fallbackIncludesOptionalGiftPrompt(fallbackMessage: string) {
  return /\bOptional:\s+do you have a (?:registry|gift list)/i.test(fallbackMessage);
}

function shouldUseDeterministicFallback(draft: ConciergeEventDraft, fallbackMessage: string) {
  return (
    draft.sourceContext.boundary === "envitefy_question" ||
    draft.sourceContext.boundary === "non_creation" ||
    draft.sourceContext.boundary === "off_domain" ||
    draft.sourceContext.boundary === "external_action" ||
    draft.sourceContext.boundary === "secret_detected" ||
    draft.sourceContext.boundary === "unsafe_guest_data" ||
    draft.sourceContext.boundary === "ambiguous_edit" ||
    draft.currentQuestion === "date_confirmation" ||
    fallbackIncludesOptionalGiftPrompt(fallbackMessage)
  );
}

export async function streamConciergePersona(
  params: StreamConciergePersonaParams,
  deps: PersonaDeps = {},
): Promise<StreamConciergePersonaResult> {
  if (shouldUseDeterministicFallback(params.draft, params.fallbackMessage)) {
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
        ...openAiChatTemperatureParam(model, 0.55),
        max_completion_tokens: 220,
        messages: [
          {
            role: "system",
            content: [
              "You are the Envitefy Concierge, a polished AI event architect.",
              "Speak like a casual, warm, capable event assistant. Keep it natural, not like a form.",
              "Use the current draft as truth. Do not invent dates, locations, names, RSVP rules, prices, private data, or links.",
              "If the user asks about weather, use only the supplied weatherContext. If weatherContext is missing or unavailable, say what detail or setup is needed instead of guessing.",
              "Acknowledge concrete details from the latest user message.",
              "Use currentDraft.selectedProducts for product names. Never expose raw snake_case identifiers such as digital_flyer, rsvp_page, live_card, or event_page.",
              "Use currentDraft.capturedDetails.names for featured names. Do not include QA or test prefixes as part of the featured names.",
              "Never use markdown, asterisks, star separators, or horizontal dividers. The interface handles bold detail highlighting.",
              "Do not use slang, emojis, excessive exclamation, or over-familiar compliments.",
              "Acknowledge the latest user message first when appropriate: Got it, Perfect, Nice, No problem, Already handled, or I’ve got that saved.",
              "Do not repeat the same question or final summary. If the user repeats a saved detail, say it is already saved and mention only what is still missing.",
              "If details are missing, ask one short question unless the user is clearly reviewing everything.",
              "Never send a checklist, numbered list, or multi-question intake block.",
              "Never mention default or IANA timezone names like America/Chicago; ask for the user's date and time naturally.",
              "When the draft is ready, use one compact sentence with the event, date/time, and location, then ask whether to generate it. If currentDraft.conversationState.finalSummaryShown is true and currentStep is not ready_first, say Still ready — no changes needed.",
              "Live cards with Envitefy RSVP must keep a visible RSVP action and guests answer yes, no, or maybe.",
              "Event pages are full guest-facing websites with navigation/menu, detail sections, calendar/location actions, RSVP form when enabled, and registry or gift-list links when supplied.",
              "Flyer/invitation and live-card products require generated artwork from the user's description; do not describe static category thumbnails or placeholders as final products.",
              "For birthdays, weddings, baby showers, gender reveals, bridal showers, housewarmings, anniversaries, and graduations, preserve registry, gift-list, wishlist, and no-gifts notes when the user provides them.",
              "Use the deterministicFallback as the detail source, but compress robotic label/value summaries into casual prose.",
              "Keep the reply concise: one to three short sentences.",
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

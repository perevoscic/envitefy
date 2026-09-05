import OpenAI from "openai";
import { CONCIERGE_CAPABILITIES, conciergeCapabilityAnswer, conciergeServiceFallback } from "./capabilities.ts";
import { invitationCopyAnswer, requestsInvitationCopy } from "./copy-workflow.ts";
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
  signal?: AbortSignal;
};

export type StreamConciergePersonaResult = {
  assistantMessage: string;
  usedAi: boolean;
  unavailable?: boolean;
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
  return Object.entries(OUTPUT_LABELS).filter(([output]) => output.includes("_")).reduce(
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
    previewCopy: draft.previewCopy,
    hostBrief: draft.hostBrief || null,
    copyStatus: draft.copyStatus || "provisional",
  };
}

function conversationMessages(messages: CreationChatMessageSnapshot[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-24)
    .map((message) => ({
      role: message.role,
      content: message.text.slice(0, 2000),
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

function shouldUseDeterministicFallback(draft: ConciergeEventDraft, fallbackMessage: string) {
  void fallbackMessage;
  return (
    draft.sourceContext.boundary === "external_action" ||
    draft.sourceContext.boundary === "private_data" ||
    draft.sourceContext.boundary === "secret_detected" ||
    draft.sourceContext.boundary === "unsafe_guest_data" ||
    draft.sourceContext.boundary === "ambiguous_edit" ||
    draft.currentQuestion === "date_confirmation"
  );
}

export async function streamConciergePersona(
  params: StreamConciergePersonaParams,
  deps: PersonaDeps = {},
): Promise<StreamConciergePersonaResult> {
  params.signal?.throwIfAborted();
  if (shouldUseDeterministicFallback(params.draft, params.fallbackMessage)) {
    return streamFallback(params.fallbackMessage, params.onDelta);
  }

  const capabilityAnswer = conciergeCapabilityAnswer(params.message);
  const serviceFallback = conciergeServiceFallback(params.message, params.draft);
  const requestedCopy = requestsInvitationCopy(params.message);
  const copyAnswer = requestedCopy && params.draft.copyStatus !== "needs_update"
    ? invitationCopyAnswer(params.draft) : null;

  const weatherFallbackMessage = params.weatherContext?.message || null;
  if (params.weatherContext?.status === "missing_location" && weatherFallbackMessage) {
    return streamFallback(weatherFallbackMessage, params.onDelta);
  }

  const apiKey = deps.openAiApiKey ?? process.env.OPENAI_API_KEY ?? null;
  const fallbackMessage = weatherFallbackMessage || serviceFallback || params.fallbackMessage;
  if (!apiKey) return { ...streamFallback(copyAnswer || fallbackMessage, params.onDelta), unavailable: true };
  const unavailableMessage = [
    "I couldn't finish the tailored reply just now. You can try again or keep editing here in the chat.",
    weatherFallbackMessage || serviceFallback,
    copyAnswer,
  ].filter(Boolean).join("\n\n");

  const client = deps.createOpenAiClient?.(apiKey) || new OpenAI({ apiKey });
  const model = resolveConciergeOpenAiPersonaModel(deps.openAiModel);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  params.signal?.addEventListener("abort", cancel, { once: true });
  const completionTimer = setTimeout(cancel, 20000);
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
        max_completion_tokens: 900,
        messages: [
          {
            role: "system",
            content: [
              "You are the Envitefy Concierge, a polished AI event architect.",
              "Speak like a casual, warm, capable event assistant. Keep it natural, not like a form.",
              "Use the current draft as truth for saved event details and supplied capabilities as truth for product behavior. Earlier assistant messages may be wrong; correct them plainly instead of repeating a promise. User requests are not proof that a feature is configured.",
              "Do not invent dates, locations, names, RSVP rules, prices, private data, or links. State a relevant unsupported capability once, briefly, and immediately take the host toward one concrete workable plan. If the host already accepted a limitation, skip that explanation and carry out the requested next step. Never let a capability explanation replace the rest of a multi-part request.",
              "Make the host feel heard through specific help: notice the occasion, workload and preferences, recommend one manageable approach with a reason, and write the actual requested wording. When they are overwhelmed, reduce decisions and take care of the writing and planning you can do here. Avoid hollow reassurance or promises of actions outside this chat.",
              "hostBrief is the persistent memory of this host's priorities. Keep advice within its budget scope, requested languages, accessibility, dietary needs, privacy and workload. Do not ask them to repeat saved preferences. Make one recommendation that reduces their work; explain a relevant tradeoff briefly.",
              "Useful help does not require a complete intake. Give a provisional plan, budget split or invitation with clearly marked TBC details when requested; label estimates as suggestions. A budget split must add up to the supplied budget. Do not block advice or wording behind date, venue, phone or email questions.",
              "For manual guest replies, offer one private message per household with the requested counts and dietary needs, plus a simple tracking list. Keep a private address out of shared wording and tell the host to share it individually. Do not imply automated address approval or extra form fields exist.",
              "Answer the user's actual question before collecting another detail. Explain format choices in terms of their needs. A comparison is not an order for multiple products, and a request to prepare sharing copy is not a request to send it.",
              "If the user asks about weather, use only the supplied weatherContext. If weatherContext is missing or unavailable, say what detail or setup is needed instead of guessing.",
              "Acknowledge concrete details from the latest user message.",
              "Use currentDraft.selectedProducts for product names. Never expose raw snake_case identifiers such as digital_flyer, rsvp_page, live_card, or event_page.",
              "Use currentDraft.capturedDetails.names for featured names. Do not include QA or test prefixes as part of the featured names.",
              "Never use markdown, asterisks, star separators, or horizontal dividers. The interface handles bold detail highlighting.",
              "Do not use slang, emojis, excessive exclamation, or over-familiar compliments.",
              "For corrections, mention the resulting saved value from currentDraft. Never say fixed, saved or already handled unless the current draft actually contains that value. Preserve every named honoree and exact chosen titles.",
              "Do not repeat the same question or final summary. If the user repeats a saved detail, say it is already saved and mention only what is still missing.",
              "Ask at most one useful follow-up question, only when needed for the next step. Do not append an intake question when the host asked for wording, advice or a review. Respect decisions to leave details TBC or collect replies manually.",
              "Never send a multi-question intake block. Short lists are appropriate when the host requests a budget, plan or saved-detail review.",
              "Never mention default or IANA timezone names like America/Chicago; ask for the user's date and time naturally.",
              "When details first become ready, offer Generate draft preview. It creates artwork for review; Publish is a separate action. If a ready draft is edited, acknowledge the actual change. If the user asks a question, answer it; do not keep pushing generation or claim no changes were needed.",
              "Do not describe a chat summary or generated artwork as a working RSVP form. The current RSVP fields are name, email and yes/no/maybe. Household counts, per-activity questions, waitlists and approval-based address release are not configurable in this chat, even if a different Envitefy builder supports them.",
              "Live cards with Envitefy RSVP must keep a visible RSVP action and guests answer yes, no, or maybe.",
              "Event pages are full guest-facing websites with navigation/menu, detail sections, calendar/location actions, RSVP form when enabled, and registry or gift-list links when supplied.",
              "Flyer/invitation and live-card products require generated artwork from the user's description; do not describe static category thumbnails or placeholders as final products.",
              "For birthdays, weddings, baby showers, gender reveals, bridal showers, housewarmings, anniversaries, and graduations, preserve registry, gift-list, wishlist, and no-gifts notes when the user provides them.",
              "currentDraft contains saved details and previewCopy. Use that as the source of truth; deterministicFallback is only a response suggestion and may miss the user's intent. For saved wording reviews, show previewCopy faithfully. When proposing different wording, identify it as a proposal, never claim it is already on the card. Honor every requested language with comparable content and preserve exact titles and private-location wording.",
              "When invitationWordingWillBeAppended is true, the application will append the exact current invitation after your response. Do not write, translate or quote a separate invitation. Answer any other parts of the request, such as a budget or format recommendation, then introduce the appended wording briefly. If copyStatus is provisional, call it a simple starting draft rather than a finished tailored invitation.",
              "Normally use one to three short sentences. Expand enough to fulfill requested invitation wording, translations, budget breakdowns or reviews; never omit a requested deliverable merely to stay brief.",
              "Keep related sentences in compact paragraphs. Use a blank line only between distinct paragraphs or language sections, not after every sentence or language heading.",
            ].join(" "),
          },
          ...conversationMessages(params.chatMessages),
          {
            role: "user",
            content: JSON.stringify({
              latestMessage: params.message,
              currentDraft: draftContext(params.draft),
              capabilities: CONCIERGE_CAPABILITIES,
              relevantCapabilityFacts: capabilityAnswer,
              invitationWordingWillBeAppended: Boolean(copyAnswer),
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
    if (!assistantMessage) {
      return { ...streamFallback(unavailableMessage, params.onDelta), unavailable: true };
    }
    if (copyAnswer) params.onDelta(`\n\n${copyAnswer}`);
    return {
      assistantMessage: [assistantMessage, copyAnswer].filter(Boolean).join("\n\n"),
      usedAi: true,
    };
  } catch (error) {
    clearFirstOutputTimer();
    params.signal?.throwIfAborted();
    if (chunks.length) {
      const tail = ["I couldn't finish the rest of the tailored reply just now.", copyAnswer].filter(Boolean).join("\n\n");
      params.onDelta(`\n\n${tail}`);
      return {
        assistantMessage: `${sanitizePersonaCopy(chunks.join(""))}\n\n${tail}`,
        usedAi: true,
        unavailable: true,
      };
    }
    if (!controller.signal.aborted && process.env.NODE_ENV !== "production") {
      console.warn("[concierge] OpenAI persona stream failed; using fallback", error);
    }
    return { ...streamFallback(unavailableMessage, params.onDelta), unavailable: true };
  } finally {
    clearFirstOutputTimer();
    clearTimeout(completionTimer);
    params.signal?.removeEventListener("abort", cancel);
  }
}

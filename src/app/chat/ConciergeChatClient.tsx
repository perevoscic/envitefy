"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Camera,
  Loader2,
  Mic,
  Paperclip,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { STUDIO_CATEGORY_TILES } from "@/app/studio/workspace/studio-category-tile-data";
import {
  cn,
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/ai-prompt-box";
import type {
  ConciergeActiveContext,
  ConciergeEventDraft,
  ConciergeEventMessageResponse,
  ConciergeEventType,
  ConciergeMessageResponse,
  ConciergeOcrContext,
  CreationChatMessageSnapshot,
  CreationSessionResumeResponse,
  RequestedOutput,
} from "@/lib/concierge/types";
import { getUploadAcceptAttribute } from "@/lib/upload-config";
import { validateClientUploadFile } from "@/utils/media-upload-client";
import ChatProductPreview from "./ChatProductPreview";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  type?: "text" | "upload_status";
};

type ProductOption = {
  label: string;
  output: RequestedOutput;
};

type ConciergePhase =
  | "intake_empty"
  | "collecting_details"
  | "ready_to_generate"
  | "generating_card"
  | "card_ready"
  | "editing_card";

type LiveCardSummary = {
  headline: string;
  subheadline: string;
  scheduleLine: string;
  locationLine: string;
  outputs: string[];
};

type RsvpPreviewResponse = {
  name: string | null;
  email: string | null;
  response: "yes" | "no" | "maybe" | string;
  updatedAt: string | null;
};

type RsvpPreviewState = {
  stats: {
    yes: number;
    no: number;
    maybe: number;
  };
  filled: number;
  remaining: number;
  numberOfGuests: number;
  responses: RsvpPreviewResponse[];
  isLoading: boolean;
  error: string | null;
};

const EMPTY_RSVP_PREVIEW: RsvpPreviewState = {
  stats: { yes: 0, no: 0, maybe: 0 },
  filled: 0,
  remaining: 0,
  numberOfGuests: 0,
  responses: [],
  isLoading: false,
  error: null,
};

const PRODUCT_OPTIONS: ProductOption[] = [
  {
    label: "Live Card",
    output: "live_card",
  },
  {
    label: "Flyer / Invite",
    output: "digital_flyer",
  },
  {
    label: "Event Page",
    output: "event_page",
  },
];

const FAST_UPLOAD_OCR_URL = "/api/ocr?fast=1&turbo=1&timing=1";
const DEFAULT_UPLOAD_OCR_URL = "/api/ocr?fast=0";
const ENABLE_FAST_UPLOAD_OCR = process.env.NEXT_PUBLIC_CONCIERGE_FAST_UPLOADS === "1";
const CREATION_INTAKE_URL = "/api/creation/intake";
const CREATION_INTAKE_STREAM_URL = "/api/creation/intake/stream";
const ENABLE_CONCIERGE_TIMING = process.env.NEXT_PUBLIC_CONCIERGE_TIMING === "1";

const BUILDING_STEPS = [
  "Checking the event details",
  "Generating the product",
  "Creating RSVP and sharing links",
  "Finalizing the event workspace",
];

const OUTPUT_LABELS: Record<RequestedOutput, string> = {
  event_page: "Event page",
  live_card: "Live card",
  digital_flyer: "Digital flyer",
  invitation: "Invitation",
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

const EMPTY_ASSISTANT_PROMPT = "What are we celebrating?";

type ConciergeChatClientProps = {
  userFirstName?: string | null;
};

type ConciergeStreamStatePayload = Extract<ConciergeMessageResponse, { ok: true }>;

type ConciergeStreamHandlers = {
  onDelta: (text: string) => void;
  onAssistantDone: (message: string) => void;
  onState: (state: ConciergeStreamStatePayload) => void;
};

function withConciergeTiming(url: string) {
  if (!ENABLE_CONCIERGE_TIMING) return url;
  return `${url}${url.includes("?") ? "&" : "?"}timing=1`;
}

function parseConciergeStreamEvent(rawEvent: string) {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of rawEvent.split(/\r?\n/)) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }
  const dataText = dataLines.join("\n");
  if (!dataText) return { event, data: null };
  try {
    return { event, data: JSON.parse(dataText) as Record<string, any> };
  } catch {
    return { event, data: null };
  }
}

async function readConciergeIntakeStream(response: Response, handlers: ConciergeStreamHandlers) {
  if (!response.body) throw new Error("Concierge stream did not include a response body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalState: ConciergeStreamStatePayload | null = null;

  const processRawEvent = (rawEvent: string) => {
    const parsed = parseConciergeStreamEvent(rawEvent);
    const data = parsed.data;
    if (parsed.event === "assistant_delta" && typeof data?.text === "string") {
      handlers.onDelta(data.text);
      return;
    }
    if (parsed.event === "assistant_done" && typeof data?.assistantMessage === "string") {
      handlers.onAssistantDone(data.assistantMessage);
      return;
    }
    if (parsed.event === "state" && data?.ok === true && data.draft) {
      finalState = data as ConciergeStreamStatePayload;
      handlers.onState(finalState);
      return;
    }
    if (parsed.event === "error") {
      throw new Error(typeof data?.error === "string" ? data.error : "Concierge stream failed.");
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\n\n/);
    buffer = events.pop() || "";
    for (const rawEvent of events) {
      if (rawEvent.trim()) processRawEvent(rawEvent);
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) processRawEvent(buffer);
  return finalState;
}

function buildInitialAssistantPrompt(userFirstName?: string | null) {
  const cleaned = typeof userFirstName === "string" ? userFirstName.trim() : "";
  if (!cleaned) return EMPTY_ASSISTANT_PROMPT;
  return `Hi ${cleaned}, what are we celebrating?`;
}

function isOpeningAssistantPrompt(text: string, initialAssistantPrompt: string) {
  return text === initialAssistantPrompt || text === EMPTY_ASSISTANT_PROMPT;
}

const CHAT_STARTER_PROMPTS = [
  "Create a birthday live card with RSVP.",
  "Create a wedding invitation with RSVP.",
  "Create a baby shower invite with RSVP.",
  "Create a game event page for my team.",
  "Create a bridal shower invite with RSVP.",
];

const CATEGORY_LABELS: Partial<Record<ConciergeEventType, string>> = {
  birthday: "Birthday Invite",
  wedding: "Wedding",
  baby_shower: "Baby Shower",
  graduation: "Graduation",
  gym_meet: "Gym Meet",
  general: "General Event",
};

const PREVIEW_CATEGORY_BY_EVENT_TYPE: Partial<Record<ConciergeEventType, string>> = {
  birthday: "Birthday",
  wedding: "Wedding",
  baby_shower: "Baby Shower",
  gym_meet: "Game Day",
  graduation: "Custom Invite",
  general: "Custom Invite",
};

function studioStarterImagePath(categoryName: string) {
  return (
    STUDIO_CATEGORY_TILES.find((category) => category.name === categoryName)?.imagePath ||
    "/studio/custom-invite.webp"
  );
}

const CELEBRATION_STARTER_TILES = [
  {
    label: "Birthday live card",
    prompt: CHAT_STARTER_PROMPTS[0],
    imagePath: studioStarterImagePath("Birthday"),
    size: "wide",
  },
  {
    label: "Wedding invitation",
    prompt: CHAT_STARTER_PROMPTS[1],
    imagePath: studioStarterImagePath("Wedding"),
    size: "desktopWide",
  },
  {
    label: "Game event page",
    prompt: CHAT_STARTER_PROMPTS[3],
    imagePath: studioStarterImagePath("Game Day"),
    size: "square",
  },
  {
    label: "Baby shower invite",
    prompt: CHAT_STARTER_PROMPTS[2],
    imagePath: studioStarterImagePath("Baby Shower"),
    size: "desktopWide",
  },
  {
    label: "Bridal shower invite",
    prompt: CHAT_STARTER_PROMPTS[4],
    imagePath: studioStarterImagePath("Bridal Shower"),
    size: "square",
  },
] as const;

function newMessage(
  role: ChatMessage["role"],
  text: string,
  type: ChatMessage["type"] = "text",
): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    type,
  };
}

function chatMessageFromSnapshot(message: CreationChatMessageSnapshot): ChatMessage {
  return {
    id: message.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: message.role,
    text: message.text,
    type: "text",
  };
}

function chatMessagesForPersistence(
  current: ChatMessage[],
  pending: ChatMessage[] = [],
): CreationChatMessageSnapshot[] {
  return [...current, ...pending]
    .filter((message) => message.type !== "upload_status" && message.text.trim())
    .slice(-50)
    .map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text.slice(0, 4000),
      type: "text",
    }));
}

function cleanNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeRsvpPreview(payload: any): RsvpPreviewState {
  const statsRecord = payload?.stats && typeof payload.stats === "object" ? payload.stats : {};
  const responses = Array.isArray(payload?.responses) ? payload.responses : [];
  return {
    stats: {
      yes: cleanNumber(statsRecord.yes),
      no: cleanNumber(statsRecord.no),
      maybe: cleanNumber(statsRecord.maybe),
    },
    filled: cleanNumber(payload?.filled),
    remaining: cleanNumber(payload?.remaining),
    numberOfGuests: cleanNumber(payload?.numberOfGuests),
    responses: responses.slice(0, 20).map((row: any) => ({
      name: stringValue(row?.name) || stringValue(row?.firstName) || null,
      email: stringValue(row?.email),
      response: typeof row?.response === "string" ? row.response : "maybe",
      updatedAt: stringValue(row?.updatedAt) || stringValue(row?.updated_at),
    })),
    isLoading: false,
    error: null,
  };
}

function isReadyProductDraft(draft: ConciergeEventDraft | null) {
  return isReadyCreationDraft(draft);
}

function isReadyCreationDraft(draft: ConciergeEventDraft | null) {
  return Boolean(
    draft?.requestedOutputs.length &&
      draft.draftStatus === "preview_ready" &&
      !draft.currentQuestion &&
      draft.missingFields.length === 0,
  );
}

function normalizeOcrContext(payload: any): ConciergeOcrContext {
  return {
    ocrText: typeof payload?.ocrText === "string" ? payload.ocrText : null,
    fieldsGuess:
      payload?.fieldsGuess && typeof payload.fieldsGuess === "object" ? payload.fieldsGuess : null,
    category: typeof payload?.category === "string" ? payload.category : null,
    birthdayTemplateHint: payload?.birthdayTemplateHint || null,
    ocrSkin: payload?.ocrSkin && typeof payload.ocrSkin === "object" ? payload.ocrSkin : null,
    metadata: {
      thumbnailFocus: payload?.thumbnailFocus || null,
      openHouse: payload?.openHouse || null,
    },
  };
}

function draftHeadline(draft: ConciergeEventDraft | null) {
  return draft?.previewCopy.headline || draft?.title || draft?.eventPurpose || "Event draft";
}

function draftSubheadline(draft: ConciergeEventDraft | null) {
  return draft?.previewCopy.subheadline || draft?.theme || "Details coming together";
}

function draftScheduleLine(draft: ConciergeEventDraft | null) {
  return draft?.previewCopy.scheduleLine || draft?.dateText || draft?.startISO || "Date TBD";
}

function draftLocationLine(draft: ConciergeEventDraft | null) {
  return draft?.previewCopy.locationLine || draft?.venue || draft?.location || "Location TBD";
}

function outputLabel(output: RequestedOutput) {
  return OUTPUT_LABELS[output] || output;
}

function categoryLabelFromDraft(draft: ConciergeEventDraft | null) {
  const eventType = draft?.eventType || "unknown";
  if (eventType === "unknown") return "Inferred category";
  return CATEGORY_LABELS[eventType] || "Custom Invite";
}

function previewImageForDraft(draft: ConciergeEventDraft | null) {
  const categoryLabel =
    (draft?.eventType && PREVIEW_CATEGORY_BY_EVENT_TYPE[draft.eventType]) || "Custom Invite";
  return (
    STUDIO_CATEGORY_TILES.find((category) => category.name === categoryLabel)?.imagePath ||
    "/studio/upload-your-own.webp"
  );
}

function draftOutputLabels(draft: ConciergeEventDraft | null, selectedOutput: RequestedOutput) {
  const outputs = draft?.requestedOutputs?.length ? draft.requestedOutputs : [selectedOutput];
  return Array.from(new Set(outputs)).map(outputLabel);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstStringValue(...values: unknown[]) {
  for (const value of values) {
    const text = stringValue(value);
    if (text) return text;
  }
  return null;
}

function uniqueDisplayLine(...values: unknown[]) {
  const parts = values.map(stringValue).filter((value): value is string => Boolean(value));
  return parts.filter((value, index) => parts.indexOf(value) === index).join(", ") || null;
}

function outputLabelsFromUnknown(value: unknown, fallback: string[]) {
  const raw = Array.isArray(value) ? value : [];
  const labels = raw
    .map((item) => stringValue(item))
    .filter((item): item is string => Boolean(item))
    .map((item) => outputLabel(item as RequestedOutput));
  return labels.length ? Array.from(new Set(labels)) : fallback;
}

function liveCardSummaryFromDraft(
  draft: ConciergeEventDraft | null,
  selectedOutput: RequestedOutput,
): LiveCardSummary {
  return {
    headline: draftHeadline(draft),
    subheadline: draftSubheadline(draft),
    scheduleLine: draftScheduleLine(draft),
    locationLine: draftLocationLine(draft),
    outputs: draftOutputLabels(draft, selectedOutput),
  };
}

function liveCardSummaryFromEvent(
  event: { title: string; data: Record<string, unknown> },
  fallback: LiveCardSummary,
): LiveCardSummary {
  const data = recordValue(event.data);
  const liveCard = recordValue(data.liveCard);
  const publicEvent = recordValue(data.publicEvent);
  const previewCopy = recordValue(data.previewCopy);
  const theme = stringValue(data.theme);
  const dateText = firstStringValue(data.dateText, data.date);
  const timeText = firstStringValue(data.timeText, data.time);
  const scheduleLine =
    firstStringValue(
      liveCard.scheduleLine,
      publicEvent.scheduleLine,
      previewCopy.scheduleLine,
      data.whenLabel,
      data.scheduleLine,
    ) ||
    (dateText && timeText && !dateText.toLowerCase().includes(timeText.toLowerCase())
      ? `${dateText} at ${timeText}`
      : dateText || timeText || fallback.scheduleLine);
  const locationLine =
    firstStringValue(
      liveCard.locationLine,
      publicEvent.locationLine,
      previewCopy.locationLine,
      data.locationLabel,
    ) ||
    uniqueDisplayLine(data.venue ?? data.placeName, data.location ?? data.address) ||
    fallback.locationLine;

  return {
    headline:
      firstStringValue(liveCard.headline, publicEvent.headline, event.title) || fallback.headline,
    subheadline:
      firstStringValue(
        liveCard.subheadline,
        publicEvent.subheadline,
        previewCopy.subheadline,
        theme ? `${theme} theme` : null,
      ) || fallback.subheadline,
    scheduleLine,
    locationLine,
    outputs: outputLabelsFromUnknown(data.requestedOutputs ?? data.outputs, fallback.outputs),
  };
}

function notifyCreationThreadsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("envitefy:creation-threads-changed"));
}

export default function ConciergeChatClient({ userFirstName = null }: ConciergeChatClientProps) {
  const searchParams = useSearchParams();
  const initialAssistantPrompt = buildInitialAssistantPrompt(userFirstName);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const chatPaneRef = useRef<HTMLDivElement | null>(null);
  const composerCardRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [selectedProductOutput, setSelectedProductOutput] = useState<RequestedOutput | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    newMessage("assistant", initialAssistantPrompt),
  ]);
  const [phase, setPhase] = useState<ConciergePhase>("intake_empty");
  const [draft, setDraft] = useState<ConciergeEventDraft | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isStreamingAssistant, setIsStreamingAssistant] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [liveCardEventId, setLiveCardEventId] = useState<string | null>(null);
  const [liveCardTitle, setLiveCardTitle] = useState<string | null>(null);
  const [liveCardSummary, setLiveCardSummary] = useState<LiveCardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const [rsvpPreview, setRsvpPreview] = useState<RsvpPreviewState>(EMPTY_RSVP_PREVIEW);

  const isGeneratingCard = phase === "generating_card";
  const isEditingGeneratedCard = phase === "editing_card";
  const isEmptyState =
    phase === "intake_empty" &&
    messages.length === 1 &&
    messages[0]?.role === "assistant" &&
    !draft &&
    !isSending &&
    !isUploading;
  const visibleMessages = messages.filter((message, index) => {
    if (message.type !== "upload_status" && !message.text.trim()) {
      return false;
    }

    return !(
      index === 0 &&
      message.role === "assistant" &&
      isOpeningAssistantPrompt(message.text, initialAssistantPrompt)
    );
  });
  const isBusy = isSending || isUploading || isGeneratingCard;
  const busyLabel = isUploading
    ? "Reading upload"
    : isEditingGeneratedCard
      ? "Updating preview"
      : isGeneratingCard
        ? "Generating product"
        : "Concierge is thinking...";
  const isThinking = busyLabel === "Concierge is thinking..." && !isStreamingAssistant;
  const currentBuildStep = Math.min(
    Math.floor((buildProgress / 100) * BUILDING_STEPS.length),
    BUILDING_STEPS.length - 1,
  );
  const effectiveSelectedProductOutput = selectedProductOutput || "live_card";
  const currentLiveCardSummary =
    liveCardSummary || liveCardSummaryFromDraft(draft, effectiveSelectedProductOutput);
  const previewTitle = liveCardTitle || currentLiveCardSummary.headline;
  const canGenerateProduct = Boolean(draft?.canPersist) && !isBusy && !liveCardEventId;
  const shouldShowWorkspacePanel =
    Boolean(draft) ||
    phase === "ready_to_generate" ||
    phase === "generating_card" ||
    phase === "card_ready" ||
    phase === "editing_card" ||
    Boolean(liveCardEventId);
  const liveCardPublicHref = liveCardEventId ? `/event/${liveCardEventId}` : null;
  const liveCardWorkspaceHref = liveCardEventId ? `/events/${liveCardEventId}/workspace` : null;
  const threadId = searchParams.get("thread")?.trim() || null;
  const currentCategoryLabel = categoryLabelFromDraft(draft);
  const currentPreviewImage = previewImageForDraft(draft);
  const rsvpResponseNames = rsvpPreview.responses.map(
    (response) => response.name || response.email || "Guest",
  );
  const rsvpResponseCount =
    rsvpPreview.stats.yes + rsvpPreview.stats.no + rsvpPreview.stats.maybe ||
    rsvpResponseNames.length ||
    rsvpPreview.filled;
  function selectProductOutputForDraft(nextDraft: ConciergeEventDraft) {
    const restoredOutput = nextDraft.requestedOutputs.find((output) =>
      PRODUCT_OPTIONS.some((option) => option.output === output),
    );
    if (restoredOutput) setSelectedProductOutput(restoredOutput);
  }

  function resetConversation() {
    setInput("");
    setError(null);
    setDraft(null);
    setPhase("intake_empty");
    setIsStreamingAssistant(false);
    setLiveCardEventId(null);
    setLiveCardTitle(null);
    setLiveCardSummary(null);
    setBuildProgress(0);
    setRsvpPreview(EMPTY_RSVP_PREVIEW);
    setSelectedProductOutput(null);
    setMobileView("chat");
    setMessages([newMessage("assistant", initialAssistantPrompt)]);
  }

  useEffect(() => {
    function handleNewChatSession() {
      resetConversation();
    }

    window.addEventListener("envitefy:chat:new", handleNewChatSession);
    return () => {
      window.removeEventListener("envitefy:chat:new", handleNewChatSession);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!threadId) {
      resetConversation();
      return () => {
        cancelled = true;
      };
    }
    const targetThreadId = threadId;

    async function restoreThread() {
      setError(null);
      setIsSending(true);
      try {
        const response = await fetch(
          `/api/creation/intake?threadId=${encodeURIComponent(targetThreadId)}`,
          {
            credentials: "include",
          },
        );
        const json = (await response
          .json()
          .catch(() => null)) as CreationSessionResumeResponse | null;
        if (cancelled || !response.ok || !json?.ok || !json.draft) return;

        const restoredDraft = json.draft;
        const savedEventId = json.savedEventId || null;
        const restoredOutput =
          restoredDraft.requestedOutputs.find((output) =>
            PRODUCT_OPTIONS.some((option) => option.output === output),
          ) || null;
        setDraft(restoredDraft);
        setSelectedProductOutput(restoredOutput);
        setLiveCardEventId(savedEventId);
        setLiveCardTitle(savedEventId ? draftHeadline(restoredDraft) : null);
        setLiveCardSummary(
          liveCardSummaryFromDraft(restoredDraft, restoredOutput || effectiveSelectedProductOutput),
        );
        setBuildProgress(savedEventId ? 100 : 0);
        setMobileView(savedEventId ? "preview" : "chat");
        setPhase(
          savedEventId
            ? "card_ready"
            : isReadyProductDraft(restoredDraft)
              ? "ready_to_generate"
              : "collecting_details",
        );
        setMessages(
          json.chatMessages?.length
            ? json.chatMessages.map(chatMessageFromSnapshot)
            : [
                newMessage(
                  "assistant",
                  savedEventId
                    ? "Thread opened. Your generated product is ready to refine."
                    : "Thread opened. We can keep collecting the details from here.",
                ),
              ],
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to open AI thread.");
        }
      } finally {
        if (!cancelled) setIsSending(false);
      }
    }

    void restoreThread();
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isBusy]);

  useEffect(() => {
    if (!isGeneratingCard) return;
    const interval = window.setInterval(() => {
      setBuildProgress((current) => {
        if (current >= 92) return current;
        return Math.min(92, current + Math.random() * 10 + 4);
      });
    }, 420);
    return () => window.clearInterval(interval);
  }, [isGeneratingCard]);

  useEffect(() => {
    if (!liveCardEventId) {
      setRsvpPreview(EMPTY_RSVP_PREVIEW);
      return;
    }

    const eventId = liveCardEventId;
    let cancelled = false;
    async function loadRsvpPreview() {
      setRsvpPreview((current) => ({ ...current, isLoading: true, error: null }));
      try {
        const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/rsvp`, {
          credentials: "include",
        });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Unable to load RSVP responses.");
        }
        setRsvpPreview(normalizeRsvpPreview(payload));
      } catch (err) {
        if (!cancelled) {
          setRsvpPreview((current) => ({
            ...current,
            isLoading: false,
            error: err instanceof Error ? err.message : "Unable to load RSVP responses.",
          }));
        }
      }
    }

    void loadRsvpPreview();
    return () => {
      cancelled = true;
    };
  }, [liveCardEventId]);

  async function generateProductForDraft(draftToGenerate: ConciergeEventDraft) {
    if (!draftToGenerate.canPersist) {
      setError("Add an event or source before creating the preview.");
      return;
    }
    setError(null);
    setPhase("generating_card");
    setBuildProgress(8);
    const generatedMessage = newMessage(
      "assistant",
      "Your product is generated. You can review it in the preview or tell me what to change.",
    );
    try {
      const response = await fetch("/api/creation/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: "",
          action: "save",
          draft: draftToGenerate,
          persistSession: true,
          chatMessages: chatMessagesForPersistence(messages, [generatedMessage]),
        }),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Unable to generate product.");
      }
      const savedEventId = json.savedEventId;
      if (!savedEventId) throw new Error("Product was generated without an event id.");
      setBuildProgress(100);
      setDraft(json.draft);
      setLiveCardEventId(savedEventId);
      setLiveCardTitle(draftHeadline(json.draft || draftToGenerate));
      setLiveCardSummary(
        liveCardSummaryFromDraft(json.draft || draftToGenerate, effectiveSelectedProductOutput),
      );
      setPhase("card_ready");
      setMobileView("preview");
      if (json.chatMessages?.length) {
        setMessages(json.chatMessages.map(chatMessageFromSnapshot));
      } else {
        setMessages((prev) => [...prev, generatedMessage]);
      }
      notifyCreationThreadsChanged();
    } catch (err) {
      setBuildProgress(0);
      setPhase(draftToGenerate.canPersist ? "ready_to_generate" : "collecting_details");
      setError(err instanceof Error ? err.message : "Unable to generate product.");
    }
  }

  async function sendGeneratedCardEdit(message: string) {
    const trimmed = message.trim();
    if (!trimmed || !liveCardEventId) return;

    setError(null);
    setIsSending(true);
    setPhase("editing_card");
    setMessages((prev) => [...prev, newMessage("user", trimmed)]);
    try {
      const response = await fetch(`/api/concierge/events/${liveCardEventId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed }),
      });
      const json = (await response
        .json()
        .catch(() => null)) as ConciergeEventMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Preview update failed.");
      }
      const fallbackSummary =
        liveCardSummary || liveCardSummaryFromDraft(draft, effectiveSelectedProductOutput);
      setLiveCardTitle(json.event.title || liveCardTitle || draftHeadline(draft));
      setLiveCardSummary(liveCardSummaryFromEvent(json.event, fallbackSummary));
      setPhase("card_ready");
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
    } catch (err) {
      setPhase("card_ready");
      setError(err instanceof Error ? err.message : "Preview update failed.");
    } finally {
      setIsSending(false);
    }
  }

  async function sendToConcierge(params: {
    message: string;
    action?: "message" | "chip" | "starter_category" | "ocr_result";
    ocrContext?: ConciergeOcrContext | null;
    activeContext?: ConciergeActiveContext | null;
    requestedOutputs?: RequestedOutput[];
    echo?: string;
  }) {
    const message = params.message.trim();
    if (!message && !params.ocrContext) return;

    setError(null);
    setIsSending(true);
    if (!liveCardEventId && phase !== "ready_to_generate") {
      setPhase("collecting_details");
    }
    const userMessage = params.echo || message ? newMessage("user", params.echo || message) : null;
    if (params.echo || message) {
      setMessages((prev) => (userMessage ? [...prev, userMessage] : prev));
    }
    let streamAssistantId: string | null = null;
    let streamedAssistantText = "";
    try {
      const activeContext: ConciergeActiveContext = params.activeContext || {
        route: "/chat",
        currentEventId: liveCardEventId,
        currentDraftId: draft?.creationSessionId || null,
        selectedUploadId: params.ocrContext ? `upload_${Date.now()}` : null,
        selectedTemplateId: null,
        currentAssetId: null,
        lastUserAction: params.action || "message",
      };
      const requestedOutputs =
        params.requestedOutputs ||
        (selectedProductOutput
          ? [selectedProductOutput]
          : draft?.requestedOutputs?.length
            ? draft.requestedOutputs
            : null);
      const action = params.action || "message";
      const requestBody = {
        message,
        draft,
        ocrContext: params.ocrContext || null,
        activeContext,
        requestedOutputs,
        action,
        chatMessages: chatMessagesForPersistence(messages, userMessage ? [userMessage] : []),
      };
      const shouldStream =
        !params.ocrContext &&
        (action === "message" || action === "chip" || action === "starter_category");

      if (shouldStream) {
        const assistantPlaceholder = newMessage("assistant", "");
        streamAssistantId = assistantPlaceholder.id;
        setMessages((prev) => [...prev, assistantPlaceholder]);
        const response = await fetch(withConciergeTiming(CREATION_INTAKE_STREAM_URL), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Concierge request failed.");
        }
        const finalState = await readConciergeIntakeStream(response, {
          onDelta: (text) => {
            streamedAssistantText += text;
            setIsStreamingAssistant(true);
            setMessages((prev) =>
              prev.map((item) =>
                item.id === streamAssistantId ? { ...item, text: streamedAssistantText } : item,
              ),
            );
          },
          onAssistantDone: (assistantMessage) => {
            streamedAssistantText = assistantMessage;
            setMessages((prev) =>
              prev.map((item) =>
                item.id === streamAssistantId ? { ...item, text: assistantMessage } : item,
              ),
            );
          },
          onState: (json) => {
            setDraft(json.draft);
            selectProductOutputForDraft(json.draft);
            notifyCreationThreadsChanged();
            if (json.chatMessages?.length) {
              setMessages(json.chatMessages.map(chatMessageFromSnapshot));
            }
            setPhase(isReadyProductDraft(json.draft) ? "ready_to_generate" : "collecting_details");
          },
        });
        if (!finalState) throw new Error("Concierge stream ended before draft state arrived.");
        return;
      }

      const response = await fetch(withConciergeTiming(CREATION_INTAKE_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Concierge request failed.");
      }
      setDraft(json.draft);
      selectProductOutputForDraft(json.draft);
      notifyCreationThreadsChanged();
      const assistantMessage = newMessage("assistant", json.assistantMessage);
      if (json.chatMessages?.length) {
        setMessages(json.chatMessages.map(chatMessageFromSnapshot));
      }
      if (isReadyProductDraft(json.draft)) {
        setPhase("ready_to_generate");
        if (!json.chatMessages?.length) setMessages((prev) => [...prev, assistantMessage]);
        return;
      }
      setPhase("collecting_details");
      if (!json.chatMessages?.length) setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setPhase(draft ? "collecting_details" : "intake_empty");
      if (streamAssistantId && !streamedAssistantText.trim()) {
        setMessages((prev) => prev.filter((item) => item.id !== streamAssistantId));
      }
      setError(err instanceof Error ? err.message : "Concierge request failed.");
    } finally {
      setIsStreamingAssistant(false);
      setIsSending(false);
    }
  }

  async function submitComposerInput() {
    if (isBusy) return;
    const value = input.trim();
    if (!value) return;
    setInput("");
    if (liveCardEventId) {
      await sendGeneratedCardEdit(value);
      return;
    }
    await sendToConcierge({ message: value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitComposerInput();
  }

  async function handleStarterPrompt(message: string) {
    if (isBusy) return;
    await sendToConcierge({ message });
  }

  function handleVoiceInput() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    setError(null);
    setIsListening(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = window.navigator.language || "en-US";
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results || [])
        .map((result: any) => result?.[0]?.transcript)
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!transcript) return;
      setInput((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript));
    };
    recognition.onerror = () => {
      setError("Voice input was not captured.");
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
  }

  async function handleUpload(file: File | null | undefined) {
    if (!file) return;
    const validationError = validateClientUploadFile(file, "attachment");
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    setMessages((prev) => [
      ...prev,
      newMessage("user", `Uploaded ${file.name}`),
      newMessage("assistant", "Reading upload...", "upload_status"),
    ]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("scanAttemptId", `concierge-${Date.now()}`);
      const response = await fetch(
        ENABLE_FAST_UPLOAD_OCR ? FAST_UPLOAD_OCR_URL : DEFAULT_UPLOAD_OCR_URL,
        {
          method: "POST",
          body: form,
          credentials: "include",
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Upload failed (${response.status})`);
      }
      setMessages((prev) => prev.filter((message) => message.type !== "upload_status"));
      await sendToConcierge({
        message: "Seed a draft from this upload.",
        action: "ocr_result",
        ocrContext: normalizeOcrContext(payload),
        echo: "Use this upload to start the event.",
      });
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.type !== "upload_status"));
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  const chatThread = (
    <div
      className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-5 px-4 py-8 sm:px-6"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
    >
      <AnimatePresence initial={false}>
        {visibleMessages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.type === "upload_status" ? (
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfff] bg-white/86 px-4 py-2 text-sm text-[#5f5289] shadow-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin text-[#7c4dff]" aria-hidden="true" />
                {message.text}
              </div>
            ) : (
              <div
                className={`max-w-[94%] whitespace-pre-line rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[88%] ${
                  message.role === "user"
                    ? "rounded-tr-md bg-[#6f4cff] text-white shadow-[#6f4cff]/15"
                    : "rounded-tl-md border border-[#eadfff] bg-white/88 text-[#24183e]"
                }`}
              >
                {message.text}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isBusy && !isGeneratingCard && !isStreamingAssistant ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "inline-flex w-fit max-w-[94%] self-start items-center gap-2 rounded-full border border-[#eadfff] bg-white/86 px-4 py-2 text-sm text-[#5f5289] shadow-sm sm:max-w-[88%]",
            isThinking && "animate-pulse",
          )}
          role="status"
          aria-live="polite"
        >
          {isThinking ? null : (
            <Loader2 className="size-4 animate-spin text-[#7c4dff]" aria-hidden="true" />
          )}
          {busyLabel}
        </motion.div>
      ) : null}
      <div ref={messagesEndRef} />
    </div>
  );

  const composer = (
    <div className="pointer-events-none z-30 mx-auto flex w-full max-w-3xl shrink-0 flex-col items-stretch px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4 sm:px-6 sm:pb-8">
      <div ref={composerCardRef} className="pointer-events-auto w-full">
        <form onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            accept={getUploadAcceptAttribute("attachment")}
            className="hidden"
            onChange={(event) => void handleUpload(event.currentTarget.files?.[0])}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handleUpload(event.currentTarget.files?.[0])}
          />
          <PromptInput
            value={input}
            onValueChange={setInput}
            isLoading={isBusy}
            onSubmit={() => void submitComposerInput()}
            disabled={isBusy}
            className={cn(
              "w-full border-[#d8caff] bg-[#fbf9ff] p-2 text-[#25183a] shadow-[0_18px_46px_rgba(93,63,155,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur transition-all duration-300",
              isListening &&
                "border-[#8b5cf6] shadow-[0_18px_46px_rgba(124,77,255,0.24),inset_0_1px_0_rgba(255,255,255,0.95)]",
            )}
          >
            <PromptInputTextarea
              placeholder={
                liveCardEventId
                  ? "Tell me what to change..."
                  : "Or let's start planning together from scratch..."
              }
              aria-label={liveCardEventId ? "Refine product" : "Start planning from scratch"}
              className="min-h-[44px] px-3 py-2.5 text-base !text-[#25183a] caret-[#7c4dff] selection:bg-[#d8caff] selection:text-[#25183a] !placeholder:text-[#8b7ca6] [&::placeholder]:text-[0.82rem] sm:[&::placeholder]:text-base"
            />
            <PromptInputActions className="justify-between gap-2 pt-2">
              <div className="flex min-w-0 items-center gap-1">
                <PromptInputAction tooltip="Upload file">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#76648f] transition hover:bg-[#f1ebff] hover:text-[#7c4dff]"
                    aria-label="Upload file"
                  >
                    <Paperclip className="size-6" aria-hidden="true" />
                  </button>
                </PromptInputAction>

                <PromptInputAction tooltip="Use camera">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#76648f] transition hover:bg-[#f1ebff] hover:text-[#7c4dff]"
                    aria-label="Use camera"
                  >
                    <Camera className="size-6" aria-hidden="true" />
                  </button>
                </PromptInputAction>
              </div>

              <PromptInputAction
                tooltip={
                  isBusy
                    ? busyLabel
                    : input.trim()
                      ? "Send message"
                      : isListening
                        ? "Listening"
                        : "Voice message"
                }
              >
                <button
                  type={input.trim() ? "submit" : "button"}
                  disabled={isBusy || (!input.trim() && isListening)}
                  onClick={(event) => {
                    if (input.trim()) return;
                    event.preventDefault();
                    void handleVoiceInput();
                  }}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full text-[#76648f] transition hover:bg-[#f1ebff] hover:text-[#7c4dff] disabled:pointer-events-none disabled:opacity-50",
                    (input.trim() || isListening) && "text-[#7c4dff]",
                  )}
                  aria-label={input.trim() ? "Send" : "Use voice input"}
                >
                  {isBusy ? (
                    <Loader2 className="size-5 animate-spin text-[#7c4dff]" aria-hidden="true" />
                  ) : input.trim() ? (
                    <ArrowUp className="size-6 text-current" strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    <Mic className="size-6 text-current" strokeWidth={2.4} aria-hidden="true" />
                  )}
                </button>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>
        </form>
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
        <p className="mt-4 text-center text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8d7daf]">
          Envitefy Concierge - Beta
        </p>
      </div>
    </div>
  );

  const workspacePanel = (
    <ChatProductPreview
      draft={draft}
      summary={{ ...currentLiveCardSummary, headline: previewTitle }}
      selectedOutput={effectiveSelectedProductOutput}
      previewImageUrl={currentPreviewImage}
      categoryLabel={currentCategoryLabel}
      isBusy={isBusy}
      isGenerating={isGeneratingCard}
      buildProgress={buildProgress}
      currentBuildStep={BUILDING_STEPS[currentBuildStep]}
      canGenerate={canGenerateProduct}
      liveEventId={liveCardEventId}
      publicHref={liveCardPublicHref}
      advancedEditorHref={liveCardWorkspaceHref}
      rsvp={{
        count: rsvpResponseCount,
        isLoading: rsvpPreview.isLoading,
        error: rsvpPreview.error,
      }}
      onGenerate={() => {
        if (draft) void generateProductForDraft(draft);
      }}
      onRegenerate={() =>
        void sendGeneratedCardEdit("Regenerate the product with the latest event details.")
      }
      mobileView={mobileView}
    />
  );

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-transparent text-[#161129]">
      <main
        ref={mainRef}
        className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 flex-col">
            {shouldShowWorkspacePanel ? (
              <div className="shrink-0 border-b border-[#eee8f6] bg-white px-4 py-3 md:hidden">
                <div className="grid grid-cols-2 rounded-lg bg-[#f1edf7] p-1">
                  <button
                    type="button"
                    onClick={() => setMobileView("chat")}
                    className={`h-8 rounded-md px-4 text-xs font-bold transition ${
                      mobileView === "chat" ? "bg-white text-[#7c4dff] shadow-sm" : "text-[#8b8298]"
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileView("preview")}
                    className={`h-8 rounded-md px-4 text-xs font-bold transition ${
                      mobileView === "preview"
                        ? "bg-white text-[#7c4dff] shadow-sm"
                        : "text-[#8b8298]"
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>
            ) : null}
            <div
              className={`grid h-full min-h-0 ${
                shouldShowWorkspacePanel
                  ? "md:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)]"
                  : "md:grid-cols-1"
              }`}
            >
              <div
                ref={chatPaneRef}
                className={`min-h-0 w-full flex-col overflow-hidden bg-white/28 backdrop-blur-sm ${
                  shouldShowWorkspacePanel ? "md:border-r md:border-[#e5dff0]" : ""
                } ${
                  mobileView === "chat" ? "flex" : "hidden md:flex"
                } ${shouldShowWorkspacePanel ? "" : "md:border-r-0"}`}
              >
                <div className="min-h-0 flex-1 overflow-y-auto [overscroll-behavior-y:contain] [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
                  {isEmptyState ? (
                    <div className="mx-auto flex min-h-full w-full max-w-[90rem] flex-col justify-end px-4 py-8 text-center sm:px-6">
                      <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-auto max-w-3xl text-4xl font-medium tracking-normal text-[#2d1b36] sm:text-6xl"
                      >
                        {initialAssistantPrompt}
                      </motion.h1>
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6f608c] sm:text-base">
                        Tell me what you need to create.
                      </p>
                      <div className="mx-auto mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 text-left sm:max-w-4xl sm:grid-cols-4">
                        {CELEBRATION_STARTER_TILES.map((tile) => {
                          const isWide = tile.size === "wide";
                          const isDesktopWide = tile.size === "desktopWide";
                          return (
                            <button
                              key={tile.label}
                              type="button"
                              onClick={() => void handleStarterPrompt(tile.prompt)}
                              disabled={isBusy}
                              aria-label={`Start ${tile.label}`}
                              className={cn(
                                "group relative isolate overflow-hidden rounded-2xl border border-white/80 bg-[#f6f1ff] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-55",
                                isWide
                                  ? "col-span-2 aspect-[2.055/1]"
                                  : cn(
                                      "aspect-square min-h-[8.25rem]",
                                      isDesktopWide && "sm:col-span-2 sm:aspect-[2.055/1]",
                                    ),
                              )}
                            >
                              <img
                                src={tile.imagePath}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                              <span
                                className="absolute inset-0 bg-gradient-to-t from-[#171023]/80 via-[#241735]/28 to-white/10"
                                aria-hidden="true"
                              />
                              <span className="relative z-10 flex h-full flex-col justify-end p-3 sm:p-4">
                                <span className="max-w-[11rem] text-balance break-words text-base font-bold leading-tight text-white sm:text-lg">
                                  {tile.label}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    chatThread
                  )}
                </div>
                {composer}
              </div>
              {shouldShowWorkspacePanel ? workspacePanel : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

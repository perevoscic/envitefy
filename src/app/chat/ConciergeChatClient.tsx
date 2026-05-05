"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Calendar,
  Camera,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  Mic,
  Paperclip,
  RefreshCw,
  Sparkles,
  Upload,
  Users,
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

const CATEGORY_OPTIONS: Array<{
  eventType: Exclude<ConciergeEventType, "unknown">;
  label: string;
  prompt: string;
}> = [
  {
    eventType: "birthday",
    label: "Birthday Invite",
    prompt: "Set the event category to birthday invite.",
  },
  { eventType: "wedding", label: "Wedding", prompt: "Set the event category to wedding." },
  {
    eventType: "baby_shower",
    label: "Baby Shower",
    prompt: "Set the event category to baby shower.",
  },
  { eventType: "graduation", label: "Graduation", prompt: "Set the event category to graduation." },
  { eventType: "gym_meet", label: "Gym Meet", prompt: "Set the event category to gym meet." },
  {
    eventType: "general",
    label: "General Event",
    prompt: "Set the event category to general event.",
  },
];

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

function productLabel(output: RequestedOutput | null | undefined) {
  return (
    PRODUCT_OPTIONS.find((option) => option.output === output)?.label ||
    outputLabel(output || "live_card")
  );
}

function categoryLabelFromDraft(draft: ConciergeEventDraft | null) {
  const eventType = draft?.eventType || "unknown";
  if (eventType === "unknown") return "Inferred category";
  return CATEGORY_LABELS[eventType] || "Custom Invite";
}

function categorySelectValueFromDraft(draft: ConciergeEventDraft | null) {
  return draft?.eventType && draft.eventType !== "unknown" ? draft.eventType : "";
}

function previewImageForDraft(draft: ConciergeEventDraft | null) {
  const categoryLabel =
    (draft?.eventType && PREVIEW_CATEGORY_BY_EVENT_TYPE[draft.eventType]) || "Custom Invite";
  return (
    STUDIO_CATEGORY_TILES.find((category) => category.name === categoryLabel)?.imagePath ||
    "/studio/upload-your-own.webp"
  );
}

function guestLineFromDraft(draft: ConciergeEventDraft | null) {
  const record = recordValue(draft);
  return (
    firstStringValue(record.guestCount, record.numberOfGuests, record.inviteCount) ||
    "Guest list coming soon"
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
  const [isUploading, setIsUploading] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [liveCardEventId, setLiveCardEventId] = useState<string | null>(null);
  const [liveCardTitle, setLiveCardTitle] = useState<string | null>(null);
  const [liveCardSummary, setLiveCardSummary] = useState<LiveCardSummary | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const [previewTab, setPreviewTab] = useState<"preview" | "rsvp">("preview");
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
  const visibleMessages = messages.filter(
    (message, index) =>
      !(
        index === 0 &&
        message.role === "assistant" &&
        isOpeningAssistantPrompt(message.text, initialAssistantPrompt)
      ),
  );
  const isBusy = isSending || isUploading || isGeneratingCard;
  const busyLabel = isUploading
    ? "Reading upload"
    : isEditingGeneratedCard
      ? "Updating workspace"
      : isGeneratingCard
        ? "Generating product"
        : "Envitefy is thinking...";
  const isThinking = busyLabel === "Envitefy is thinking...";
  const currentBuildStep = Math.min(
    Math.floor((buildProgress / 100) * BUILDING_STEPS.length),
    BUILDING_STEPS.length - 1,
  );
  const effectiveSelectedProductOutput = selectedProductOutput || "live_card";
  const currentLiveCardSummary =
    liveCardSummary || liveCardSummaryFromDraft(draft, effectiveSelectedProductOutput);
  const workspaceTitle = liveCardTitle || currentLiveCardSummary.headline;
  const detailsComplete = isReadyProductDraft(draft);
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
  const selectedProductLabel = productLabel(effectiveSelectedProductOutput);
  const currentCategoryLabel = categoryLabelFromDraft(draft);
  const currentCategoryValue = categorySelectValueFromDraft(draft);
  const currentPreviewImage = previewImageForDraft(draft);

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
    setLiveCardEventId(null);
    setLiveCardTitle(null);
    setLiveCardSummary(null);
    setLastGeneratedAt(null);
    setBuildProgress(0);
    setRsvpPreview(EMPTY_RSVP_PREVIEW);
    setSelectedProductOutput(null);
    setMobileView("chat");
    setPreviewTab("preview");
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
        setLastGeneratedAt(json.creationSession?.updated_at || null);
        setBuildProgress(savedEventId ? 100 : 0);
        setMobileView(savedEventId ? "preview" : "chat");
        setPreviewTab("preview");
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
                    ? "Thread opened. Your generated workspace is ready to refine."
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
      setError("Add an event or source before generating the workspace.");
      return;
    }
    setError(null);
    setPhase("generating_card");
    setBuildProgress(8);
    const generatedMessage = newMessage(
      "assistant",
      "Your product is generated. You can review it in the workspace or tell me what to change.",
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
      setLastGeneratedAt(new Date().toISOString());
      setPhase("card_ready");
      setMobileView("preview");
      setPreviewTab("preview");
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
        throw new Error(json && !json.ok ? json.error : "Workspace update failed.");
      }
      const fallbackSummary =
        liveCardSummary || liveCardSummaryFromDraft(draft, effectiveSelectedProductOutput);
      setLiveCardTitle(json.event.title || liveCardTitle || draftHeadline(draft));
      setLiveCardSummary(liveCardSummaryFromEvent(json.event, fallbackSummary));
      setLastGeneratedAt(new Date().toISOString());
      setPhase("card_ready");
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
    } catch (err) {
      setPhase("card_ready");
      setError(err instanceof Error ? err.message : "Workspace update failed.");
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
      const response = await fetch("/api/creation/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message,
          draft,
          ocrContext: params.ocrContext || null,
          activeContext,
          requestedOutputs,
          action: params.action || "message",
          chatMessages: chatMessagesForPersistence(messages, userMessage ? [userMessage] : []),
        }),
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
      setError(err instanceof Error ? err.message : "Concierge request failed.");
    } finally {
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

  async function handleCategoryChange(eventType: string) {
    if (isBusy) return;
    const option = CATEGORY_OPTIONS.find((item) => item.eventType === eventType);
    if (!option || option.eventType === draft?.eventType) return;
    await sendToConcierge({
      message: option.prompt,
      action: "chip",
      echo: `Category: ${option.label}`,
    });
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

      {isBusy && !isGeneratingCard ? (
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
          <Loader2 className="size-4 animate-spin text-[#7c4dff]" aria-hidden="true" />
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
                  ? "Refine workspace..."
                  : "Or let's start planning together from scratch..."
              }
              aria-label={liveCardEventId ? "Refine workspace" : "Start planning from scratch"}
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
    <aside
      className={`min-h-0 flex-col overflow-y-auto border-l border-[#e5dff0] bg-white/48 backdrop-blur-sm ${
        mobileView === "preview" ? "flex" : "hidden md:flex"
      }`}
    >
      <div className="flex min-h-full flex-col px-4 pb-24 pt-4 sm:px-6 sm:pb-8">
        <div className="flex items-center justify-between border-b border-[#f0ebf7] pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-[#221a35]">
              <Sparkles className="size-4 text-[#7c4dff]" aria-hidden="true" />
              Workspace Preview
            </h2>
            {lastGeneratedAt ? (
              <p className="mt-1 text-[0.68rem] font-semibold text-[#9a90aa]">
                Updated{" "}
                {new Date(lastGeneratedAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto py-5">
          {liveCardEventId ? (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f1edf7] p-1">
              <button
                type="button"
                onClick={() => setPreviewTab("preview")}
                className={`h-10 rounded-lg text-xs font-bold transition ${
                  previewTab === "preview"
                    ? "bg-white text-[#7c4dff] shadow-sm"
                    : "text-[#867a99] hover:text-[#4b3d64]"
                }`}
              >
                Invitation
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("rsvp")}
                className={`h-10 rounded-lg text-xs font-bold transition ${
                  previewTab === "rsvp"
                    ? "bg-white text-[#7c4dff] shadow-sm"
                    : "text-[#867a99] hover:text-[#4b3d64]"
                }`}
              >
                RSVP
              </button>
            </div>
          ) : null}

          {previewTab === "rsvp" && liveCardEventId ? (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  [
                    "Attending",
                    String(rsvpPreview.stats.yes),
                    "bg-[#edf9f1] text-[#197052] border-[#d7efd9]",
                  ],
                  [
                    "Maybe",
                    String(rsvpPreview.stats.maybe),
                    "bg-[#fff8e8] text-[#966a16] border-[#f4dfab]",
                  ],
                  [
                    "Declined",
                    String(rsvpPreview.stats.no),
                    "bg-[#fff0f3] text-[#b4234b] border-[#f2c9d3]",
                  ],
                ].map(([label, value, className]) => (
                  <div key={label} className={`rounded-2xl border p-4 ${className}`}>
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em]">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <section className="overflow-hidden rounded-2xl border border-[#eee8f6] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#f4eff8] bg-[#faf8fd] px-4 py-3">
                  <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8b8298]">
                    Guest List
                  </h3>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#7c4dff]">
                    {rsvpPreview.filled || rsvpPreview.responses.length} Total
                  </span>
                </div>
                {rsvpPreview.isLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-12 text-xs font-semibold text-[#8b8298]">
                    <Loader2 className="size-4 animate-spin text-[#7c4dff]" aria-hidden="true" />
                    Loading responses
                  </div>
                ) : rsvpPreview.error ? (
                  <div className="px-4 py-12 text-center text-xs italic text-[#b4234b]">
                    {rsvpPreview.error}
                  </div>
                ) : rsvpPreview.responses.length ? (
                  <div className="divide-y divide-[#f4eff8]">
                    {rsvpPreview.responses.map((response, index) => (
                      <div
                        key={`${response.email || response.name || "guest"}-${index}`}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#2d1b36]">
                            {response.name || response.email || "Guest"}
                          </p>
                          {response.email ? (
                            <p className="truncate text-xs text-[#8b8298]">{response.email}</p>
                          ) : null}
                        </div>
                        <span className="shrink-0 rounded-full bg-[#f5f0ff] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#7c4dff]">
                          {response.response}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-12 text-center text-xs italic text-[#9a90aa]">
                    Responses will appear here once guests reply.
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-dashed border-[#ddd3ea] bg-[#f5f2f9] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Info className="size-3.5 text-[#8b8298]" aria-hidden="true" />
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8b8298]">
                    RSVP Link
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#eee8f6] bg-white p-2">
                  <p className="min-w-0 flex-1 truncate text-xs text-[#675b78]">
                    {liveCardPublicHref || "Generated link appears here"}
                  </p>
                  {liveCardPublicHref ? (
                    <a
                      href={liveCardPublicHref}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-8 place-items-center rounded-lg text-[#7c4dff] transition hover:bg-[#f6f1ff]"
                      aria-label="Open RSVP link"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </section>
            </div>
          ) : (
            <>
              <section className="rounded-[1.3rem] border border-[#eee8f6] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${
                      liveCardEventId
                        ? "bg-[#e8f8ed] text-[#197052]"
                        : isGeneratingCard
                          ? "bg-[#f5f0ff] text-[#7c4dff]"
                          : detailsComplete
                            ? "bg-[#edf9f1] text-[#197052]"
                            : "bg-[#f5f0ff] text-[#7c4dff]"
                    }`}
                  >
                    {isGeneratingCard
                      ? "Generating"
                      : liveCardEventId
                        ? "Generated"
                        : detailsComplete
                          ? "Ready"
                          : "Drafting"}
                  </span>
                  <label className="relative shrink-0">
                    <span className="sr-only">Inferred category</span>
                    <select
                      value={currentCategoryValue}
                      onChange={(event) => void handleCategoryChange(event.currentTarget.value)}
                      disabled={isBusy}
                      aria-label={`Inferred category: ${currentCategoryLabel}`}
                      className="h-8 max-w-[9.5rem] appearance-none truncate rounded-full border border-[#dfd6ea] bg-[#fbf9ff] px-3 pr-7 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#7c4dff] outline-none transition hover:border-[#cdbdff] focus:border-[#a98dff] focus:ring-2 focus:ring-[#dbcfff] disabled:cursor-not-allowed disabled:opacity-65"
                    >
                      <option value="">Inferred category</option>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.eventType} value={option.eventType}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.56rem] text-[#7c4dff]"
                      aria-hidden="true"
                    >
                      v
                    </span>
                  </label>
                </div>

                <h3 className="mb-5 font-serif text-2xl font-bold italic text-[#221a35]">
                  {workspaceTitle}
                </h3>

                <div className="space-y-4">
                  <div
                    className={`flex items-center gap-3 ${
                      currentLiveCardSummary.scheduleLine === "Date TBD"
                        ? "text-[#b7afc3]"
                        : "text-[#62546f]"
                    }`}
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-[#fff3e8] text-[#e5751f]">
                      <Calendar className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {currentLiveCardSummary.scheduleLine}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-3 ${
                      currentLiveCardSummary.locationLine === "Location TBD"
                        ? "text-[#b7afc3]"
                        : "text-[#62546f]"
                    }`}
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-[#eaf3ff] text-[#3477d2]">
                      <MapPin className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {currentLiveCardSummary.locationLine}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[#62546f]">
                    <span className="grid size-9 place-items-center rounded-lg bg-[#f3ecff] text-[#7c4dff]">
                      <Users className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {guestLineFromDraft(draft)}
                    </span>
                  </div>
                </div>
              </section>

              <section
                className={`relative overflow-hidden border border-[#eee8f6] bg-white p-6 text-center shadow-xl shadow-[#3f275f]/10 ${
                  effectiveSelectedProductOutput === "event_page"
                    ? "aspect-video rounded-[1.2rem]"
                    : "aspect-[4/5] rounded-[1.4rem]"
                }`}
              >
                {isGeneratingCard ? (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/76 text-[#8b8298] backdrop-blur-[2px]">
                    <Loader2 className="size-11 animate-spin text-[#7c4dff]" aria-hidden="true" />
                    <div className="w-full max-w-[18rem] px-4">
                      <p className="text-sm font-bold text-[#2d1b36]">
                        {BUILDING_STEPS[currentBuildStep]}
                      </p>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eadfff]">
                        <motion.div
                          className="h-full bg-[#7c4dff]"
                          initial={{ width: "0%" }}
                          animate={{ width: `${buildProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                <img
                  src={currentPreviewImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale"
                />

                {effectiveSelectedProductOutput === "digital_flyer" ? (
                  <div className="relative z-10 flex h-full flex-col items-center justify-center">
                    <div className="mb-6 grid aspect-square w-full max-w-[13rem] place-items-center rounded-2xl border-2 border-dashed border-[#dfd6ea] bg-[#f8f5fb] shadow-inner">
                      <Upload className="size-8 text-[#b9b0c5]" aria-hidden="true" />
                    </div>
                    <h3 className="font-serif text-3xl font-bold italic text-[#221a35]">
                      {workspaceTitle}
                    </h3>
                    <p className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#7c4dff]">
                      {currentLiveCardSummary.scheduleLine}
                    </p>
                  </div>
                ) : effectiveSelectedProductOutput === "event_page" ? (
                  <div className="relative z-10 flex h-full flex-col text-left">
                    <div className="mb-8 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="mb-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#7c4dff]">
                          Live Event Web
                        </p>
                        <h3 className="truncate font-serif text-3xl font-bold italic text-[#221a35]">
                          {workspaceTitle}
                        </h3>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#221a35] px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white">
                        RSVP
                      </span>
                    </div>
                    <div className="flex-1 border-t border-[#eee8f6] pt-5">
                      <p className="max-w-sm text-xs leading-6 text-[#675b78]">
                        {draft?.previewCopy.body ||
                          "A full public event experience for your guests."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 flex h-full flex-col items-center justify-between py-4">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#7c4dff]">
                      Celebration Invitation
                    </p>
                    <div>
                      <h3 className="font-serif text-4xl font-bold italic text-[#221a35]">
                        {workspaceTitle}
                      </h3>
                      <div className="mx-auto my-7 h-px w-12 bg-[#ded2ff]" />
                      <p className="mx-auto max-w-[15rem] text-sm italic leading-6 text-[#675b78]">
                        {draft?.previewCopy.body ||
                          "Describe your event vision and see it come to life here."}
                      </p>
                    </div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#9a90aa]">
                      {draft?.theme || selectedProductLabel}
                    </p>
                  </div>
                )}
              </section>

              <div className="space-y-3">
                {liveCardPublicHref ? (
                  <a
                    href={liveCardPublicHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#197052] px-5 text-sm font-bold text-white shadow-lg shadow-[#197052]/15 transition hover:bg-[#145f46]"
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    View product
                  </a>
                ) : null}
                {liveCardWorkspaceHref ? (
                  <a
                    href={liveCardWorkspaceHref}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[#d8caff] bg-white px-5 text-sm font-bold text-[#5f5289] transition hover:bg-[#f7f3ff]"
                  >
                    Open workspace
                  </a>
                ) : null}
                {!liveCardEventId ? (
                  <button
                    type="button"
                    disabled={!canGenerateProduct}
                    onClick={() => {
                      if (draft) void generateProductForDraft(draft);
                    }}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c4dff] px-5 text-sm font-bold text-white shadow-lg shadow-[#7c4dff]/20 transition hover:bg-[#6f43f0] disabled:cursor-not-allowed disabled:bg-[#d8caff] disabled:shadow-none"
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    Generate workspace
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      void sendGeneratedCardEdit(
                        "Regenerate the product with the latest event details.",
                      )
                    }
                    className="inline-flex h-10 w-full items-center justify-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8b8298] transition hover:text-[#7c4dff] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Regenerate version
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
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

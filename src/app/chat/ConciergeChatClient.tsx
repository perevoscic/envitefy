"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Camera,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Globe2,
  Loader2,
  type LucideIcon,
  Mail,
  Mic,
  Plus,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { StudioCategoryTileDefinition } from "@/app/studio/studio-workspace-types";
import { STUDIO_CATEGORY_TILES } from "@/app/studio/workspace/studio-category-tile-data";
import type {
  ConciergeActiveContext,
  ConciergeEventDraft,
  ConciergeEventMessageResponse,
  ConciergeMessageResponse,
  ConciergeOcrContext,
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
  description: string;
  output: RequestedOutput;
  icon: LucideIcon;
  iconClassName: string;
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

const PRODUCT_OPTIONS: ProductOption[] = [
  {
    label: "Live Card",
    description: "Public card with RSVP",
    output: "live_card",
    icon: CreditCard,
    iconClassName: "text-[#a11cf5] drop-shadow-[0_0_8px_rgba(161,28,245,0.28)]",
  },
  {
    label: "Flyer",
    description: "Shareable graphic",
    output: "digital_flyer",
    icon: Mail,
    iconClassName: "text-[#db246f] drop-shadow-[0_0_8px_rgba(219,36,111,0.26)]",
  },
  {
    label: "Event Page",
    description: "Full public website",
    output: "event_page",
    icon: Globe2,
    iconClassName: "text-[#19a992] drop-shadow-[0_0_8px_rgba(25,169,146,0.24)]",
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

type ChatStudioCategoryTileKey = Exclude<StudioCategoryTileDefinition["name"], "Anniversary">;

type ChatStudioGridTileKey = ChatStudioCategoryTileKey | "upload";

type ChatStudioGridItem =
  | {
      kind: "category";
      key: ChatStudioCategoryTileKey;
      category: StudioCategoryTileDefinition;
    }
  | {
      kind: "upload";
      key: "upload";
    };

const CHAT_STUDIO_GRID_COMPOSITION: ChatStudioGridTileKey[] = [
  "Birthday",
  "upload",
  "Wedding",
  "Bridal Shower",
  "Baby Shower",
  "Game Day",
  "Field Trip/Day",
  "Open House",
  "Housewarming",
  "Custom Invite",
];

const CHAT_STUDIO_GRID_PLACEMENT_CLASS: Record<ChatStudioGridTileKey, string> = {
  Birthday: "col-span-2 col-start-1 row-start-1",
  upload: "col-start-3 row-start-1",
  Wedding: "col-start-6 row-span-2 row-start-1",
  "Bridal Shower": "col-start-4 row-start-1",
  "Baby Shower": "col-start-5 row-start-1",
  "Game Day": "col-start-1 row-start-2",
  "Field Trip/Day": "col-start-2 row-start-2",
  "Open House": "col-start-3 row-start-2",
  Housewarming: "col-start-4 row-start-2",
  "Custom Invite": "col-start-5 row-start-2",
};

const CHAT_STUDIO_GRID_ITEMS: ChatStudioGridItem[] = (() => {
  const categoriesByName = new Map(
    STUDIO_CATEGORY_TILES.map((category) => [category.name, category] as const),
  );
  return CHAT_STUDIO_GRID_COMPOSITION.flatMap((tileKey) => {
    if (tileKey === "upload") {
      return [{ kind: "upload", key: "upload" } satisfies ChatStudioGridItem];
    }
    const category = categoriesByName.get(tileKey);
    return category
      ? [{ kind: "category", key: tileKey, category } satisfies ChatStudioGridItem]
      : [];
  });
})();

const CHAT_STUDIO_TILE_OVERLAY_CLASS = {
  light: "bg-gradient-to-t from-black/58 via-black/18 to-transparent",
  medium: "bg-gradient-to-t from-black/68 via-black/28 to-transparent",
  dark: "bg-gradient-to-t from-black/78 via-black/42 to-black/12",
} as const;

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

function ChatStudioCategoryTile({
  category,
  index,
  onSelect,
}: {
  category: StudioCategoryTileDefinition;
  index: number;
  onSelect: (label: string) => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.025 }}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => void onSelect(category.name)}
      aria-label={`Start with ${category.name}`}
      className={`group relative isolate h-full w-full overflow-hidden rounded-[1.1rem] border border-white/60 bg-white/80 text-left shadow-[0_14px_34px_-24px_rgba(84,61,140,0.28)] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#cbb7ff]/55 sm:rounded-[1.35rem] ${
        category.surfaceVariant === "dark" ? "bg-[#20192d]" : ""
      }`}
    >
      <img
        src={category.imagePath}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
          category.imagePositionClassName || "object-center"
        }`}
      />
      <div
        className={`absolute inset-0 ${CHAT_STUDIO_TILE_OVERLAY_CLASS[category.overlayStrength]}`}
      />
      <div className="absolute inset-x-0 bottom-0 p-2.5 text-left sm:p-3">
        <p className="font-[var(--font-josefin-sans)] text-[0.56rem] font-bold uppercase leading-tight tracking-[0.09em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.34)] sm:text-[0.68rem] md:text-[0.76rem]">
          {category.name}
        </p>
        <p className="mt-0.5 hidden truncate text-[0.62rem] leading-tight text-white/82 sm:block md:text-[0.68rem]">
          {category.description}
        </p>
      </div>
    </motion.button>
  );
}

function ChatStudioUploadTile({
  index,
  isUploading,
  onUpload,
}: {
  index: number;
  isUploading: boolean;
  onUpload: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.025 }}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.99 }}
      onClick={onUpload}
      disabled={isUploading}
      aria-label={isUploading ? "Uploading invite" : "Upload your invite"}
      className="group relative isolate h-full w-full overflow-hidden rounded-[1.1rem] border border-white/50 bg-[#1d1330] text-left shadow-[0_14px_34px_-24px_rgba(84,61,140,0.28)] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#cbb7ff]/55 disabled:cursor-not-allowed disabled:opacity-80 sm:rounded-[1.35rem]"
    >
      <img
        src="/studio/upload-your-own.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,14,42,0.08),rgba(22,14,38,0.3)_34%,rgba(18,12,32,0.62))]" />
      <div className="absolute inset-x-0 bottom-0 p-2.5 text-left sm:p-3">
        <p className="font-[var(--font-josefin-sans)] text-[0.56rem] font-bold uppercase leading-tight tracking-[0.09em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.34)] sm:text-[0.68rem] md:text-[0.76rem]">
          {isUploading ? "Uploading" : "Upload Your Invite"}
        </p>
        <p className="mt-0.5 hidden truncate text-[0.62rem] leading-tight text-white/82 sm:block md:text-[0.68rem]">
          Turn an existing invite into a live card
        </p>
      </div>
    </motion.button>
  );
}

function ChatStudioStarterGrid({
  onSelectCategory,
  onUploadInvite,
  isUploading,
}: {
  onSelectCategory: (label: string) => void;
  onUploadInvite: () => void;
  isUploading: boolean;
}) {
  return (
    <div className="grid auto-rows-[86px] grid-cols-6 gap-2 sm:auto-rows-[108px] md:auto-rows-[124px]">
      {CHAT_STUDIO_GRID_ITEMS.map((item, index) => (
        <div key={item.key} className={CHAT_STUDIO_GRID_PLACEMENT_CLASS[item.key]}>
          {item.kind === "upload" ? (
            <ChatStudioUploadTile
              index={index}
              isUploading={isUploading}
              onUpload={onUploadInvite}
            />
          ) : (
            <ChatStudioCategoryTile
              category={item.category}
              index={index}
              onSelect={onSelectCategory}
            />
          )}
        </div>
      ))}
    </div>
  );
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

export default function ConciergeChatClient() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const chatPaneRef = useRef<HTMLDivElement | null>(null);
  const productButtonRef = useRef<HTMLButtonElement | null>(null);
  const productMenuRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [selectedProductOutput, setSelectedProductOutput] = useState<RequestedOutput>("live_card");
  const [messages, setMessages] = useState<ChatMessage[]>([
    newMessage("assistant", "What are we celebrating?"),
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
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [composerCenterLeft, setComposerCenterLeft] = useState("50vw");

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
      !(index === 0 && message.role === "assistant" && message.text === "What are we celebrating?"),
  );
  const isBusy = isSending || isUploading || isGeneratingCard;
  const busyLabel = isUploading
    ? "Reading upload"
    : isEditingGeneratedCard
      ? "Updating workspace"
      : isGeneratingCard
        ? "Generating product"
        : "Thinking";
  const currentBuildStep = Math.min(
    Math.floor((buildProgress / 100) * BUILDING_STEPS.length),
    BUILDING_STEPS.length - 1,
  );
  const currentLiveCardSummary =
    liveCardSummary || liveCardSummaryFromDraft(draft, selectedProductOutput);
  const workspaceTitle = liveCardTitle || currentLiveCardSummary.headline;
  const detailsComplete = isReadyProductDraft(draft);
  const canGenerateProduct = detailsComplete && !isBusy && !liveCardEventId;
  const shouldShowWorkspacePanel =
    phase === "ready_to_generate" ||
    phase === "generating_card" ||
    phase === "card_ready" ||
    phase === "editing_card" ||
    Boolean(liveCardEventId);
  const liveCardPublicHref = liveCardEventId ? `/event/${liveCardEventId}` : null;
  const liveCardWorkspaceHref = liveCardEventId ? `/events/${liveCardEventId}/workspace` : null;
  const threadId = searchParams.get("thread")?.trim() || null;

  function selectProductOutputForDraft(nextDraft: ConciergeEventDraft) {
    const restoredOutput = nextDraft.requestedOutputs.find((output) =>
      PRODUCT_OPTIONS.some((option) => option.output === output),
    );
    if (restoredOutput) setSelectedProductOutput(restoredOutput);
  }

  function resetConversation() {
    setDraft(null);
    setPhase("intake_empty");
    setLiveCardEventId(null);
    setLiveCardTitle(null);
    setLiveCardSummary(null);
    setLastGeneratedAt(null);
    setBuildProgress(0);
    setSelectedProductOutput("live_card");
    setMessages([newMessage("assistant", "What are we celebrating?")]);
  }

  useEffect(() => {
    let cancelled = false;

    if (!threadId) {
      resetConversation();
      return () => {
        cancelled = true;
      };
    }

    async function restoreThread() {
      setError(null);
      setIsSending(true);
      try {
        const response = await fetch(
          `/api/creation/intake?threadId=${encodeURIComponent(threadId)}`,
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
          ) || selectedProductOutput;
        setDraft(restoredDraft);
        setSelectedProductOutput(restoredOutput);
        setLiveCardEventId(savedEventId);
        setLiveCardTitle(savedEventId ? draftHeadline(restoredDraft) : null);
        setLiveCardSummary(liveCardSummaryFromDraft(restoredDraft, restoredOutput));
        setLastGeneratedAt(json.creationSession?.updated_at || null);
        setBuildProgress(savedEventId ? 100 : 0);
        setPhase(
          savedEventId
            ? "card_ready"
            : isReadyProductDraft(restoredDraft)
              ? "ready_to_generate"
              : "collecting_details",
        );
        setMessages([
          newMessage(
            "assistant",
            savedEventId
              ? "Thread opened. Your generated workspace is ready to refine."
              : "Thread opened. We can keep collecting the details from here.",
          ),
        ]);
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
    if (!isProductMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsProductMenuOpen(false);
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (productMenuRef.current?.contains(target) || productButtonRef.current?.contains(target)) {
        return;
      }
      setIsProductMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isProductMenuOpen]);

  useEffect(() => {
    function updateComposerCenter() {
      const target = shouldShowWorkspacePanel
        ? chatPaneRef.current || mainRef.current
        : mainRef.current;
      const rect = target?.getBoundingClientRect();
      if (!rect) {
        setComposerCenterLeft("50vw");
        return;
      }
      setComposerCenterLeft(`${rect.left + rect.width / 2}px`);
    }

    updateComposerCenter();
    const frame = window.requestAnimationFrame(updateComposerCenter);
    const timeout = window.setTimeout(updateComposerCenter, 260);
    window.addEventListener("resize", updateComposerCenter);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.removeEventListener("resize", updateComposerCenter);
    };
  }, [shouldShowWorkspacePanel]);

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

  async function generateProductForDraft(draftToGenerate: ConciergeEventDraft) {
    if (!isReadyProductDraft(draftToGenerate)) {
      setError("Complete the required details before generating the product.");
      return;
    }
    setError(null);
    setPhase("generating_card");
    setBuildProgress(8);
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
        liveCardSummaryFromDraft(json.draft || draftToGenerate, selectedProductOutput),
      );
      setLastGeneratedAt(new Date().toISOString());
      setPhase("card_ready");
      setMessages((prev) => [
        ...prev,
        newMessage(
          "assistant",
          "Your product is generated. You can review it in the workspace or tell me what to change.",
        ),
      ]);
      notifyCreationThreadsChanged();
    } catch (err) {
      setBuildProgress(0);
      setPhase(isReadyProductDraft(draftToGenerate) ? "ready_to_generate" : "collecting_details");
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
        liveCardSummary || liveCardSummaryFromDraft(draft, selectedProductOutput);
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
    if (params.echo || message) {
      setMessages((prev) => [...prev, newMessage("user", params.echo || message)]);
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
      const response = await fetch("/api/creation/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message,
          draft,
          ocrContext: params.ocrContext || null,
          activeContext,
          requestedOutputs: params.requestedOutputs || [selectedProductOutput],
          action: params.action || "message",
        }),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Concierge request failed.");
      }
      setDraft(json.draft);
      selectProductOutputForDraft(json.draft);
      notifyCreationThreadsChanged();
      if (isReadyProductDraft(json.draft)) {
        setPhase("generating_card");
        setMessages((prev) => [
          ...prev,
          newMessage("assistant", "I have the event details. I am generating the product now."),
        ]);
        await generateProductForDraft(json.draft);
        return;
      }
      setPhase("collecting_details");
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
    } catch (err) {
      setPhase(draft ? "collecting_details" : "intake_empty");
      setError(err instanceof Error ? err.message : "Concierge request failed.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    setInput("");
    if (liveCardEventId) {
      await sendGeneratedCardEdit(value);
      return;
    }
    await sendToConcierge({ message: value });
  }

  async function handleStarterCategory(label: string) {
    await sendToConcierge({
      message: label === "Custom Invite" ? "Custom invite" : label,
      action: "starter_category",
    });
  }

  async function handleProductOption(option: ProductOption) {
    setSelectedProductOutput(option.output);
    setIsProductMenuOpen(false);
    if (option.output === selectedProductOutput) return;

    if (liveCardEventId) {
      await sendGeneratedCardEdit(`Create a ${option.label} version for this event.`);
      return;
    }

    if (!draft) return;

    await sendToConcierge({
      message: `Switch to ${option.label}.`,
      action: "chip",
      requestedOutputs: [option.output],
      echo: `Output: ${option.label}`,
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
    }
  }

  const chatThread = (
    <div
      className={`mx-auto flex min-h-[calc(100vh-5rem)] w-full flex-col justify-end gap-5 px-4 pb-56 pt-8 sm:px-6 sm:pb-60 ${
        shouldShowWorkspacePanel ? "max-w-[26rem]" : "max-w-3xl"
      }`}
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
                className={`max-w-[86%] whitespace-pre-line rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[76%] ${
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
          className="inline-flex w-fit max-w-[86%] self-start items-center gap-2 rounded-full border border-[#eadfff] bg-white/86 px-4 py-2 text-sm text-[#5f5289] shadow-sm"
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

  const workspacePanel = (
    <aside className="order-1 min-h-0 overflow-y-auto border-b border-[#eadfff] bg-[#fbf9ff]/88 lg:order-2 lg:border-b-0 lg:border-l">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#16875f]">
              {liveCardEventId ? (
                <CheckCircle2 className="size-4" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {isGeneratingCard
                ? "Generating product"
                : liveCardEventId
                  ? "Generated product"
                  : "Ready to generate"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#2d1b36]">
              Event Workspace
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#7a6c99]">
              {workspaceTitle} - {currentLiveCardSummary.subheadline}
            </p>
            {lastGeneratedAt ? (
              <p className="mt-1 text-xs font-semibold text-[#8b7aaa]">
                Updated{" "}
                {new Date(lastGeneratedAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
          </div>
          {liveCardEventId ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                void sendGeneratedCardEdit("Regenerate the product with the latest event details.")
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d8caff] bg-white px-4 text-xs font-bold text-[#5f5289] transition hover:bg-[#f7f3ff] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Regenerate
            </button>
          ) : null}
        </div>

        <section className="relative flex min-h-[34rem] flex-1 items-center justify-center overflow-hidden rounded-[1.2rem] border border-[#eadfff] bg-[#f7f3ff] px-5 py-8 shadow-[0_22px_70px_rgba(68,43,112,0.08)] sm:px-8">
          <div className="relative flex aspect-[4/5] w-full max-w-[25rem] flex-col items-center justify-center border border-[#eee7ff] bg-white px-8 py-10 text-center shadow-2xl shadow-[#3f275f]/10">
            <Sparkles className="mb-5 size-7 text-[#7c4dff]" aria-hidden="true" />
            <h3 className="text-4xl font-semibold tracking-normal text-[#2d1b36]">
              {workspaceTitle}
            </h3>
            <p className="mt-3 text-lg italic text-[#6f5b86]">
              {currentLiveCardSummary.subheadline}
            </p>
            <div className="my-7 h-px w-14 bg-[#ded2ff]" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a6c99]">
              {currentLiveCardSummary.scheduleLine}
            </p>
            <p className="mt-3 text-sm font-medium text-[#5b4a72]">
              {currentLiveCardSummary.locationLine}
            </p>
            <span className="mt-8 inline-flex h-10 items-center rounded-sm bg-[#2d1b36] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white">
              RSVP Online
            </span>
          </div>

          {isGeneratingCard ? (
            <div className="absolute inset-0 flex items-end justify-center bg-white/62 p-5 backdrop-blur-[2px]">
              <div
                className="w-full max-w-md rounded-[1.15rem] border border-[#eadfff] bg-white/94 p-4 shadow-xl shadow-[#3f275f]/10"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="size-5 animate-spin text-[#7c4dff]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-[#2d1b36]">
                      {BUILDING_STEPS[currentBuildStep]}
                    </p>
                    <p className="mt-0.5 text-xs text-[#7a6c99]">Building the workspace preview</p>
                  </div>
                </div>
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
        </section>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {liveCardPublicHref ? (
            <a
              href={liveCardPublicHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#197052] px-5 text-sm font-bold text-white shadow-lg shadow-[#197052]/15 transition hover:bg-[#145f46]"
            >
              View product
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          ) : null}
          {liveCardWorkspaceHref ? (
            <a
              href={liveCardWorkspaceHref}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#d8caff] bg-white px-5 text-sm font-bold text-[#5f5289] transition hover:bg-[#f7f3ff]"
            >
              Open workspace
            </a>
          ) : null}
          {!liveCardEventId && !isGeneratingCard ? (
            <button
              type="button"
              disabled={!canGenerateProduct}
              onClick={() => {
                if (draft) void generateProductForDraft(draft);
              }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#197052] px-5 text-sm font-bold text-white shadow-lg shadow-[#197052]/15 transition hover:bg-[#145f46] disabled:cursor-not-allowed disabled:bg-[#a9cabb] disabled:shadow-none"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Generate product
            </button>
          ) : null}
        </div>
        {liveCardEventId ? (
          <p className="mt-4 text-center text-sm leading-6 text-[#6f608c]">
            Refine the workspace in chat to update the generated product.
          </p>
        ) : null}
      </div>
    </aside>
  );

  return (
    <main
      ref={mainRef}
      className="relative min-h-screen overflow-hidden bg-[#f8f5ff] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8f5ff_48%,#efe8ff_100%)] text-[#161129]"
    >
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#7c4dff] text-white shadow-lg shadow-[#7c4dff]/20">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-normal text-[#2d1b36]">
              Envitefy Chat
            </span>
          </div>
        </header>

        <section className="min-h-0 flex-1">
          <div
            className={`grid min-h-[calc(100vh-5rem)] ${
              shouldShowWorkspacePanel
                ? "lg:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)]"
                : "lg:grid-cols-1"
            }`}
          >
            <div
              ref={chatPaneRef}
              className={`order-2 min-h-0 w-full border-t border-[#eadfff] bg-white/48 backdrop-blur-sm lg:order-1 lg:flex lg:flex-col lg:overflow-hidden lg:border-t-0 ${
                shouldShowWorkspacePanel ? "lg:border-r" : "lg:border-r-0"
              }`}
            >
              {isEmptyState ? (
                <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[72rem] flex-col justify-end px-4 pb-56 pt-8 text-center sm:px-6 sm:pb-60">
                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-xl text-3xl font-medium tracking-normal text-[#2d1b36] sm:text-4xl"
                  >
                    What are we celebrating?
                  </motion.h1>
                  <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6f608c] sm:text-base">
                    Start with a few details, choose a format, or upload an invite.
                  </p>
                  <div className="mt-6 w-full">
                    <ChatStudioStarterGrid
                      onSelectCategory={handleStarterCategory}
                      onUploadInvite={() => fileInputRef.current?.click()}
                      isUploading={isUploading}
                    />
                  </div>
                </div>
              ) : (
                chatThread
              )}
            </div>
            {shouldShowWorkspacePanel ? workspacePanel : null}
          </div>
        </section>

        <div
          className={`pointer-events-none fixed bottom-0 z-30 flex w-[calc(100vw-1rem)] -translate-x-1/2 flex-col items-stretch pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-10 sm:w-[calc(100vw-3rem)] sm:pb-8 ${
            shouldShowWorkspacePanel ? "max-w-[26rem]" : "max-w-3xl"
          }`}
          style={{ left: composerCenterLeft }}
        >
          <AnimatePresence>
            {isProductMenuOpen ? (
              <motion.div
                ref={productMenuRef}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                className="pointer-events-auto mb-4 w-full"
              >
                <div className="w-full max-w-[19rem] rounded-[1.35rem] border border-[#eadfff] bg-white p-3 shadow-2xl shadow-[#412a62]/10">
                  <p className="px-3 pb-2 text-[0.66rem] font-bold uppercase text-[#8b7aaa]">
                    Choose output
                  </p>
                  {PRODUCT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = option.output === selectedProductOutput;
                    return (
                      <button
                        key={option.output}
                        type="button"
                        onClick={() => void handleProductOption(option)}
                        className={`flex w-full items-center gap-4 rounded-2xl p-3 text-left transition ${
                          isSelected ? "bg-[#fbf8ff]" : "hover:bg-[#f7f3ff]"
                        }`}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl">
                          <Icon className={`size-5 ${option.iconClassName}`} aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#24183e]">
                            {option.label}
                          </span>
                          <span className="block text-xs leading-5 text-[#8f879a]">
                            {option.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  {shouldShowWorkspacePanel ? (
                    <div className="mt-2 border-t border-[#eadfff] pt-2">
                      <p className="px-3 pb-1 text-[0.66rem] font-bold uppercase text-[#8b7aaa]">
                        Add source
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProductMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-[#f7f3ff]"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl text-[#8f879a]">
                          <Upload className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#24183e]">Upload</span>
                          <span className="block text-xs leading-5 text-[#8f879a]">
                            Add a file or image
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProductMenuOpen(false);
                          cameraInputRef.current?.click();
                        }}
                        className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-[#f7f3ff]"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl text-[#8f879a]">
                          <Camera className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#24183e]">Camera</span>
                          <span className="block text-xs leading-5 text-[#8f879a]">
                            Take a photo
                          </span>
                        </span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="pointer-events-auto w-full">
            <form
              onSubmit={handleSubmit}
              className={`relative grid min-h-14 items-center gap-1.5 rounded-[1.25rem] border border-[#ddd2ef] bg-white/96 p-1.5 shadow-2xl shadow-[#6f4cff]/10 ring-4 ring-white/80 backdrop-blur sm:rounded-full sm:gap-2 ${
                shouldShowWorkspacePanel
                  ? "grid-cols-[auto_minmax(0,1fr)_auto_auto]"
                  : "grid-cols-[auto_auto_auto_minmax(0,1fr)_auto_auto]"
              }`}
            >
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
              <button
                ref={productButtonRef}
                type="button"
                onClick={() => setIsProductMenuOpen((current) => !current)}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#eadfff] bg-[#fbf9ff] px-3 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#7b718c] shadow-sm transition hover:border-[#ded2ff] hover:bg-white hover:text-[#2d1238] active:scale-[0.98] sm:px-4"
                aria-expanded={isProductMenuOpen}
                aria-haspopup="true"
                aria-label="Product menu"
                title="Product menu"
              >
                {isProductMenuOpen ? (
                  <X className="size-4" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                <span>Product</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`size-10 shrink-0 place-items-center rounded-full text-[#9b92a8] transition hover:bg-[#f4efff] hover:text-[#7c4dff] ${
                  shouldShowWorkspacePanel ? "hidden" : "grid"
                }`}
                aria-label="Upload file"
                title="Upload file"
              >
                <Upload className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={`size-10 shrink-0 place-items-center rounded-full text-[#9b92a8] transition hover:bg-[#f4efff] hover:text-[#7c4dff] ${
                  shouldShowWorkspacePanel ? "hidden" : "grid"
                }`}
                aria-label="Use camera"
                title="Use camera"
              >
                <Camera className="size-4" aria-hidden="true" />
              </button>
              <input
                value={input}
                onChange={(event) => setInput(event.currentTarget.value)}
                placeholder={liveCardEventId ? "Refine workspace..." : "Describe your event..."}
                aria-label={liveCardEventId ? "Refine workspace" : "Describe your event"}
                className="h-11 min-w-0 border-0 bg-transparent text-base text-[#161129] outline-none placeholder:text-[#b8b1c4]"
              />
              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={isBusy || isListening}
                className={`grid size-10 shrink-0 place-items-center rounded-full transition ${
                  isListening
                    ? "bg-[#f4efff] text-[#7c4dff]"
                    : "text-[#8f879a] hover:bg-[#f4efff] hover:text-[#7c4dff]"
                } disabled:cursor-not-allowed disabled:opacity-55`}
                aria-label="Use voice input"
                title="Use voice input"
              >
                <Mic className="size-5" aria-hidden="true" />
              </button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.94 }}
                disabled={isBusy || !input.trim()}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-[#7c4dff] text-white shadow-lg shadow-[#7c4dff]/25 transition hover:bg-[#6f43f0] disabled:cursor-not-allowed disabled:bg-[#ded2ff] disabled:shadow-none"
                aria-label="Send"
                title="Send"
              >
                <ArrowUp className="size-5" strokeWidth={2.5} aria-hidden="true" />
              </motion.button>
            </form>
            {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
            <p className="mt-4 text-center text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8d7daf]">
              Envitefy Concierge - Beta
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

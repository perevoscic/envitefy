"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Camera,
  CreditCard,
  Globe2,
  Loader2,
  type LucideIcon,
  Mail,
  Mic,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type {
  ConciergeActiveContext,
  ConciergeEventDraft,
  ConciergeMessageResponse,
  ConciergeOcrContext,
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

type StarterChip = {
  label: string;
  icon?: LucideIcon;
  iconClassName?: string;
};

type ProductOption = {
  label: string;
  description: string;
  output: RequestedOutput;
  icon: LucideIcon;
  iconClassName: string;
};

const CHIPS: StarterChip[] = [
  { label: "Birthday" },
  { label: "Wedding" },
  { label: "Baby shower" },
  { label: "Graduation" },
  { label: "Corporate" },
  { label: "Other" },
];

const PRODUCT_OPTIONS: ProductOption[] = [
  {
    label: "Live Card",
    description: "Mobile RSVP Page",
    output: "live_card",
    icon: CreditCard,
    iconClassName: "text-[#a11cf5] drop-shadow-[0_0_8px_rgba(161,28,245,0.28)]",
  },
  {
    label: "Flyer",
    description: "Shareable Graphic",
    output: "digital_flyer",
    icon: Mail,
    iconClassName: "text-[#db246f] drop-shadow-[0_0_8px_rgba(219,36,111,0.26)]",
  },
  {
    label: "Event Page",
    description: "Full Event Website",
    output: "event_page",
    icon: Globe2,
    iconClassName: "text-[#19a992] drop-shadow-[0_0_8px_rgba(25,169,146,0.24)]",
  },
];

const FAST_UPLOAD_OCR_URL = "/api/ocr?fast=1&turbo=1&timing=1";
const DEFAULT_UPLOAD_OCR_URL = "/api/ocr?fast=0";
const ENABLE_FAST_UPLOAD_OCR = process.env.NEXT_PUBLIC_CONCIERGE_FAST_UPLOADS === "1";

const BUILDING_STEPS = [
  "Analyzing event details",
  "Generating event assets",
  "Syncing workspace data",
  "Finalizing workspace",
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

function isReadyLiveCardDraft(draft: ConciergeEventDraft | null) {
  return Boolean(draft?.requestedOutputs.includes("live_card") && isReadyCreationDraft(draft));
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

function outputLabels(draft: ConciergeEventDraft | null) {
  const outputs = draft?.requestedOutputs || [];
  if (!outputs.length) return ["Live card"];
  return outputs.map((output) => OUTPUT_LABELS[output] || output);
}

function missingFieldLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function ConciergeChatClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const chatPaneRef = useRef<HTMLDivElement | null>(null);
  const productButtonRef = useRef<HTMLButtonElement | null>(null);
  const productMenuRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [selectedProductOutput, setSelectedProductOutput] =
    useState<RequestedOutput>("live_card");
  const [messages, setMessages] = useState<ChatMessage[]>([
    newMessage("assistant", "What are we celebrating?"),
  ]);
  const [draft, setDraft] = useState<ConciergeEventDraft | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [activePreviewTab, setActivePreviewTab] = useState<"creative" | "guests">("creative");
  const [error, setError] = useState<string | null>(null);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [composerCenterLeft, setComposerCenterLeft] = useState("50vw");

  const isEmptyState =
    messages.length === 1 &&
    messages[0]?.role === "assistant" &&
    !draft &&
    !isSending &&
    !isUploading &&
    !isFinalizing;
  const visibleMessages = messages.filter(
    (message, index) =>
      !(index === 0 && message.role === "assistant" && message.text === "What are we celebrating?"),
  );
  const isBusy = isSending || isUploading || isFinalizing;
  const busyLabel = isUploading
    ? "Reading upload"
    : isFinalizing
      ? "Building workspace"
      : "Thinking";
  const currentBuildStep = Math.min(
    Math.floor((buildProgress / 100) * BUILDING_STEPS.length),
    BUILDING_STEPS.length - 1,
  );
  const draftOutputs = outputLabels(draft);
  const selectedProduct =
    PRODUCT_OPTIONS.find((option) => option.output === selectedProductOutput) ||
    PRODUCT_OPTIONS[0];
  const shouldShowWorkspacePreview = isReadyCreationDraft(draft);

  useEffect(() => {
    if (!isProductMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        productMenuRef.current?.contains(target) ||
        productButtonRef.current?.contains(target)
      ) {
        return;
      }
      setIsProductMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isProductMenuOpen]);

  useEffect(() => {
    function updateComposerCenter() {
      const target = shouldShowWorkspacePreview ? chatPaneRef.current : mainRef.current;
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
  }, [shouldShowWorkspacePreview]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isBusy]);

  useEffect(() => {
    if (!isFinalizing) return;
    const interval = window.setInterval(() => {
      setBuildProgress((current) => {
        if (current >= 92) return current;
        return Math.min(92, current + Math.random() * 10 + 4);
      });
    }, 420);
    return () => window.clearInterval(interval);
  }, [isFinalizing]);

  async function openWorkspaceForDraft(draftToSave: ConciergeEventDraft) {
    setError(null);
    setIsFinalizing(true);
    setBuildProgress(8);
    try {
      const response = await fetch("/api/creation/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: "",
          action: "save",
          draft: draftToSave,
          persistSession: true,
        }),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Unable to create workspace.");
      }
      const savedEventId = json.savedEventId;
      if (!savedEventId) throw new Error("Workspace was created without an event id.");
      setBuildProgress(100);
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
      window.setTimeout(() => {
        router.push(`/events/${savedEventId}/workspace`);
      }, 520);
    } catch (err) {
      setIsFinalizing(false);
      setBuildProgress(0);
      setError(err instanceof Error ? err.message : "Unable to create workspace.");
    }
  }

  async function sendToConcierge(params: {
    message: string;
    action?: "message" | "chip" | "ocr_result";
    ocrContext?: ConciergeOcrContext | null;
    activeContext?: ConciergeActiveContext | null;
    requestedOutputs?: RequestedOutput[];
    echo?: string;
  }) {
    const message = params.message.trim();
    if (!message && !params.ocrContext) return;

    setError(null);
    setIsSending(true);
    if (params.echo || message) {
      setMessages((prev) => [...prev, newMessage("user", params.echo || message)]);
    }
    try {
      const activeContext: ConciergeActiveContext = params.activeContext || {
        route: "/chat",
        currentEventId: null,
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
      if (isReadyLiveCardDraft(json.draft)) {
        setMessages((prev) => [
          ...prev,
          newMessage(
            "assistant",
            "Your live card has the key details. Review the preview, then open the workspace when you're ready.",
          ),
        ]);
        return;
      }
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
    } catch (err) {
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
    await sendToConcierge({ message: value });
  }

  async function handleChip(label: string) {
    if (/upload/i.test(label)) {
      fileInputRef.current?.click();
      return;
    }
    await sendToConcierge({
      message: label === "Other" ? "General event" : label,
      action: "chip",
    });
  }

  async function handleProductOption(option: ProductOption) {
    setSelectedProductOutput(option.output);
    setIsProductMenuOpen(false);
    if (!draft || option.output === selectedProductOutput) return;

    await sendToConcierge({
      message: `Switch to ${option.label}.`,
      action: "chip",
      requestedOutputs: [option.output],
      echo: `Product: ${option.label}`,
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
    <div className="space-y-5 px-4 pb-56 pt-8 sm:px-6 sm:pb-60">
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

      {isBusy && !isFinalizing ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#eadfff] bg-white/86 px-4 py-2 text-sm text-[#5f5289] shadow-sm"
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

  const draftWorkspacePreview = draft && shouldShowWorkspacePreview ? (
    <aside className="min-h-0 overflow-y-auto border-t border-[#eadfff] bg-[#fbf9ff]/72 lg:border-l lg:border-t-0">
      <div className="mx-auto w-full max-w-5xl px-5 py-7 lg:px-8 lg:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-normal text-[#211633]">
              Live Card Builder
            </h2>
            <p className="mt-1 text-sm text-[#7a6c99]">
              {draftHeadline(draft)} - {draftLocationLine(draft)}
            </p>
          </div>
          <div className="inline-flex rounded-2xl border border-[#eadfff] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActivePreviewTab("creative")}
              className={`h-9 rounded-xl px-4 text-xs font-bold transition ${
                activePreviewTab === "creative"
                  ? "bg-[#2d1b36] text-white"
                  : "text-[#6d5d8d] hover:bg-[#f4efff]"
              }`}
            >
              Creative
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab("guests")}
              className={`h-9 rounded-xl px-4 text-xs font-bold transition ${
                activePreviewTab === "guests"
                  ? "bg-[#2d1b36] text-white"
                  : "text-[#6d5d8d] hover:bg-[#f4efff]"
              }`}
            >
              Guests & RSVPs
            </button>
          </div>
        </div>

        {activePreviewTab === "creative" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
            <section className="overflow-hidden rounded-[1.6rem] border border-[#eadfff] bg-white shadow-[0_22px_65px_rgba(68,43,112,0.08)]">
              <div className="flex min-h-[30rem] items-center justify-center bg-[#f5f0ff] p-6 sm:p-10">
                <div className="flex aspect-[4/5] w-full max-w-md flex-col items-center justify-center border border-[#eadfff] bg-white px-8 py-10 text-center shadow-2xl shadow-[#3f275f]/10">
                  <Sparkles className="mb-5 size-7 text-[#7c4dff]" aria-hidden="true" />
                  <h3 className="text-4xl font-semibold tracking-normal text-[#2d1b36]">
                    {draftHeadline(draft)}
                  </h3>
                  <p className="mt-3 text-lg italic text-[#6f5b86]">{draftSubheadline(draft)}</p>
                  <div className="my-7 h-px w-14 bg-[#ded2ff]" />
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a6c99]">
                    {draftScheduleLine(draft)}
                  </p>
                  <p className="mt-3 text-sm font-medium text-[#5b4a72]">
                    {draftLocationLine(draft)}
                  </p>
                  <button
                    type="button"
                    disabled={!draft.canPersist || isFinalizing}
                    onClick={() => void openWorkspaceForDraft(draft)}
                    className="mt-9 h-10 rounded-sm bg-[#2d1b36] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#3b2946] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Open Workspace
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eadfff] bg-white px-5 py-4">
                <span className="text-sm font-semibold text-[#6f5b86]">
                  {draftOutputs.join(" + ")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    void sendToConcierge({
                      message: "Create a matching invitation asset.",
                      action: "chip",
                    })
                  }
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#7c4dff]"
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  AI Graphic
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-[1.4rem] border border-[#eadfff] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <Sparkles className="size-4" aria-hidden="true" />
                  </span>
                  <h4 className="text-sm font-bold text-[#2d1b36]">Details to Fill</h4>
                </div>
                <div className="space-y-2">
                  {(draft.missingFields.length
                    ? draft.missingFields
                        .slice(0, 3)
                        .map((field) => `Add ${missingFieldLabel(field)}`)
                    : ["Add RSVP page", "Create a WhatsApp version", "Make it more elegant"]
                  ).map((recommendation) => (
                    <button
                      key={recommendation}
                      type="button"
                      onClick={() =>
                        void sendToConcierge({ message: recommendation, action: "chip" })
                      }
                      className="w-full rounded-2xl bg-[#f7f3ff] px-4 py-3 text-left text-sm font-semibold text-[#2d1b36] transition hover:bg-[#eee6ff]"
                    >
                      {recommendation}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                disabled={!draft.canPersist || isFinalizing}
                onClick={() => void openWorkspaceForDraft(draft)}
                className="h-13 w-full rounded-[1.4rem] bg-[#2d1b36] px-5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-xl shadow-[#2d1b36]/15 transition hover:bg-[#3b2946] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Open Workspace
              </button>
            </section>
          </div>
        ) : (
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Invites Sent", value: "0", sub: "Ready after publishing" },
                { label: "Attending", value: "0", sub: "Confirmed" },
                { label: "Pending", value: "0", sub: "Awaiting replies" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.3rem] border border-[#eadfff] bg-white p-5 shadow-sm"
                >
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#8b7aaa]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#2d1b36]">{stat.value}</p>
                  <p className="mt-1 text-xs text-[#7a6c99]">{stat.sub}</p>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-[1.4rem] border border-[#eadfff] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#eadfff] px-5 py-4">
                <h3 className="text-sm font-bold text-[#2d1b36]">RSVP Management</h3>
                <button
                  type="button"
                  onClick={() =>
                    void sendToConcierge({ message: "Add RSVP details.", action: "chip" })
                  }
                  className="text-sm font-bold text-[#7c4dff]"
                >
                  Add RSVP
                </button>
              </div>
              <div className="px-5 py-10 text-center text-sm text-[#7a6c99]">
                Guest responses will appear in the workspace after publishing.
              </div>
            </div>
          </section>
        )}
      </div>
    </aside>
  ) : null;

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
          {isEmptyState ? (
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col items-center justify-center px-5 pb-36 text-center">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-medium tracking-normal text-[#2d1b36] sm:text-5xl"
              >
                Where should we begin?
              </motion.h1>
              <div className="mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
                {CHIPS.map((chip, index) => {
                  const Icon = chip.icon;
                  return (
                    <motion.button
                      key={chip.label}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + index * 0.04 }}
                      onClick={() => void handleChip(chip.label)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#ded2ff] bg-white/82 px-5 text-sm font-medium text-[#4b3c79] shadow-sm backdrop-blur transition hover:border-[#bfaeff] hover:bg-white hover:text-[#7c4dff] active:scale-[0.98]"
                    >
                      {Icon ? (
                        <Icon
                          className={`size-3.5 ${chip.iconClassName || ""}`}
                          aria-hidden="true"
                        />
                      ) : null}
                      {chip.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className={`grid min-h-[calc(100vh-5rem)] ${
                shouldShowWorkspacePreview
                  ? "lg:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)]"
                  : "place-items-end pb-20"
              }`}
            >
              <div
                ref={chatPaneRef}
                className={`min-h-0 w-full ${
                  shouldShowWorkspacePreview
                    ? "flex flex-col overflow-hidden border-t border-[#eadfff] bg-white/48 backdrop-blur-sm lg:border-r lg:border-t-0"
                    : "mx-auto max-w-3xl"
                }`}
              >
                {chatThread}
              </div>
              {draftWorkspacePreview}
            </div>
          )}
        </section>

        <div
          className={`pointer-events-none fixed bottom-0 z-30 flex -translate-x-1/2 flex-col items-stretch pb-5 pt-12 sm:pb-8 ${
            shouldShowWorkspacePreview
              ? "w-[calc(100vw-2rem)] max-w-[26rem] sm:w-[calc(100vw-3rem)]"
              : "w-[calc(100vw-2.5rem)] max-w-3xl sm:w-[calc(100vw-4rem)]"
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
                role="menu"
              >
                <div className="w-full max-w-[17.5rem] rounded-[1.35rem] border border-[#eadfff] bg-white p-3 shadow-2xl shadow-[#412a62]/10">
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
                        role="menuitem"
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
                  {shouldShowWorkspacePreview ? (
                    <div className="mt-2 border-t border-[#eadfff] pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProductMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-[#f7f3ff]"
                        role="menuitem"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl text-[#8f879a]">
                          <Upload className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#24183e]">
                            Upload
                          </span>
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
                        role="menuitem"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl text-[#8f879a]">
                          <Camera className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#24183e]">
                            Camera
                          </span>
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
              className="relative flex min-h-14 items-center gap-2 rounded-full border border-[#ddd2ef] bg-white/96 p-1.5 shadow-2xl shadow-[#6f4cff]/10 ring-4 ring-white/80 backdrop-blur"
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
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#eadfff] bg-[#fbf9ff] px-4 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#7b718c] shadow-sm transition hover:border-[#ded2ff] hover:bg-white hover:text-[#2d1238] active:scale-[0.98]"
                aria-expanded={isProductMenuOpen}
                aria-haspopup="menu"
                aria-label={`Output: ${selectedProduct.label}`}
                title={`Output: ${selectedProduct.label}`}
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
                  shouldShowWorkspacePreview ? "hidden" : "grid"
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
                  shouldShowWorkspacePreview ? "hidden" : "grid"
                }`}
                aria-label="Use camera"
                title="Use camera"
              >
                <Camera className="size-4" aria-hidden="true" />
              </button>
              <input
                value={input}
                onChange={(event) => setInput(event.currentTarget.value)}
                placeholder="Describe your event..."
                aria-label="Describe your event"
                className="h-11 min-w-0 flex-1 border-0 bg-transparent text-base text-[#161129] outline-none placeholder:text-[#b8b1c4]"
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

      <AnimatePresence>
        {isFinalizing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-6 text-center backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md"
            >
              <div className="mx-auto mb-9 grid size-24 rotate-6 place-items-center rounded-3xl bg-[#7c4dff] text-white shadow-2xl shadow-[#7c4dff]/30">
                <Sparkles className="size-10" aria-hidden="true" />
              </div>
              <h2 className="text-3xl font-medium tracking-normal text-[#2d1b36]">
                {buildProgress >= 100 ? "Ready to launch!" : "Building your workspace"}
              </h2>
              <p className="mt-3 text-sm text-[#7a6c99]">
                {buildProgress >= 100
                  ? "Opening your event workspace."
                  : "Crafting your event experience."}
              </p>
              <div className="mt-10 h-1.5 overflow-hidden rounded-full bg-[#eadfff]">
                <motion.div
                  className="h-full bg-[#7c4dff]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${buildProgress}%` }}
                />
              </div>
              <div className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-[#5f5289]">
                {buildProgress >= 100 ? (
                  <Sparkles className="size-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Loader2 className="size-4 animate-spin text-[#7c4dff]" aria-hidden="true" />
                )}
                {buildProgress >= 100 ? "Workspace finalized" : BUILDING_STEPS[currentBuildStep]}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

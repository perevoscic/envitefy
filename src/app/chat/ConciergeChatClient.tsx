"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, FileText, Image, Loader2, Mic, Plus } from "lucide-react";
import type {
  ConciergeEventDraft,
  ConciergeMessageResponse,
  ConciergeOcrContext,
  ConciergeActiveContext,
} from "@/lib/concierge/types";
import { getUploadAcceptAttribute } from "@/lib/upload-config";
import { validateClientUploadFile } from "@/utils/media-upload-client";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
};

type ComposerAddOption = {
  label: string;
  description: string;
  action: "upload" | "live_card" | "digital_flyer";
};

const CHIPS = [
  "Birthday",
  "Wedding",
  "Baby shower",
  "Graduation",
  "Upload old invite",
  "Surprise me",
];

const ADD_OPTIONS: ComposerAddOption[] = [
  {
    label: "Upload invite",
    description: "Use an existing card, flyer, or screenshot",
    action: "upload",
  },
  {
    label: "Live Card",
    description: "Mobile event card with RSVP",
    action: "live_card",
  },
  {
    label: "Digital Flyer",
    description: "Shareable poster-style invite",
    action: "digital_flyer",
  },
];

function newMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
  };
}

function isReadyLiveCardDraft(draft: ConciergeEventDraft | null) {
  return Boolean(
    draft?.requestedOutputs.includes("live_card") &&
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

export default function ConciergeChatClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    newMessage("assistant", "What are we celebrating?"),
  ]);
  const [draft, setDraft] = useState<ConciergeEventDraft | null>(null);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const isEmptyState =
    messages.length === 1 &&
    messages[0]?.role === "assistant" &&
    !draft &&
    !isSending &&
    !isUploading &&
    !isFinalizing;

  useEffect(() => {
    if (!isAddMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (addMenuRef.current?.contains(target) || addButtonRef.current?.contains(target)) return;
      setIsAddMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isAddMenuOpen]);

  async function openWorkspaceForDraft(draftToSave: ConciergeEventDraft) {
    setError(null);
    setIsFinalizing(true);
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
        throw new Error(json && !json.ok ? json.error : "Unable to create live card.");
      }
      const savedEventId = json.savedEventId;
      if (!savedEventId) throw new Error("Live card was created without an event id.");
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
      router.push(`/events/${savedEventId}/workspace`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create live card.");
    } finally {
      setIsFinalizing(false);
    }
  }

  async function sendToConcierge(params: {
    message: string;
    action?: "message" | "chip" | "ocr_result";
    ocrContext?: ConciergeOcrContext | null;
    activeContext?: ConciergeActiveContext | null;
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
          action: params.action || "message",
        }),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Concierge request failed.");
      }
      setDraft(json.draft);
      if (isReadyLiveCardDraft(json.draft)) {
        setSuggestedReplies(["Open workspace"]);
        setMessages((prev) => [...prev, newMessage("assistant", "Building your live card now.")]);
        await openWorkspaceForDraft(json.draft);
        return;
      }
      setSuggestedReplies(json.suggestedReplies || []);
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
    if (label === "Upload old invite") {
      fileInputRef.current?.click();
      return;
    }
    await sendToConcierge({ message: label, action: "chip" });
  }

  async function handleAddOption(option: ComposerAddOption) {
    setIsAddMenuOpen(false);
    if (option.action === "upload") {
      fileInputRef.current?.click();
      return;
    }

    await sendToConcierge({
      message:
        option.action === "live_card" ? "Make this a live card." : "Make this a digital flyer.",
      action: "chip",
    });
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
    setMessages((prev) => [...prev, newMessage("user", `Uploaded ${file.name}`)]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("scanAttemptId", `concierge-${Date.now()}`);
      const response = await fetch("/api/ocr?fast=0", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Upload failed (${response.status})`);
      }
      await sendToConcierge({
        message: "Seed a draft from this upload.",
        action: "ocr_result",
        ocrContext: normalizeOcrContext(payload),
        echo: "Use this upload to start the event.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ff] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f7f3ff_42%,#eee6ff_100%)] text-[#161129]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 sm:px-6">
        <header className="flex h-16 items-center justify-between">
          <div className="text-sm font-semibold text-[#2f2550]">Envitefy Chat</div>
        </header>

        <section className="flex flex-1 flex-col">
          <div
            className={`mx-auto flex w-full max-w-3xl flex-1 flex-col ${
              isEmptyState ? "justify-center pb-32" : "justify-end pb-6"
            }`}
          >
            {isEmptyState ? (
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-normal text-[#161129] sm:text-3xl">
                  Where should we begin?
                </h1>
                <div className="mx-auto mt-7 flex max-w-2xl flex-wrap justify-center gap-2">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => void handleChip(chip)}
                      className="rounded-full border border-[#ded2ff] bg-white/78 px-3.5 py-2 text-sm font-medium text-[#4b3c79] shadow-sm backdrop-blur transition hover:border-[#c9b8ff] hover:bg-white"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-8">
                {messages.map((message, index) => {
                  const shouldHideOpeningPrompt =
                    index === 0 &&
                    message.role === "assistant" &&
                    message.text === "What are we celebrating?";
                  if (shouldHideOpeningPrompt) return null;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[74%] ${
                          message.role === "user"
                            ? "bg-[#6f4cff] text-white"
                            : "border border-[#e7ddff] bg-white/86 text-[#261d47]"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  );
                })}

                {(isSending || isUploading || isFinalizing) && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#e7ddff] bg-white/86 px-3.5 py-2 text-sm text-[#5b4a8f] shadow-sm">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {isUploading
                      ? "Reading upload"
                      : isFinalizing
                        ? "Building live card"
                        : "Thinking"}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 mx-auto w-full max-w-3xl bg-gradient-to-t from-[#f7f3ff] via-[#f7f3ff] to-transparent pb-5 pt-5">
            {(suggestedReplies.length > 0 || (!isEmptyState && !draft)) && (
              <div className="mb-3 flex flex-wrap justify-center gap-2">
                {(suggestedReplies.length ? suggestedReplies : CHIPS).map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() =>
                      void (reply === "Open workspace" && draft
                        ? openWorkspaceForDraft(draft)
                        : suggestedReplies.length
                          ? sendToConcierge({ message: reply, action: "chip" })
                          : handleChip(reply))
                    }
                    className="rounded-full border border-[#ded2ff] bg-white/78 px-3 py-1.5 text-sm font-medium text-[#4b3c79] shadow-sm transition hover:border-[#c9b8ff] hover:bg-white"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="relative flex min-h-14 items-center gap-2 rounded-full border border-[#d9cbff] bg-white/94 px-3 shadow-[0_22px_60px_rgba(111,76,255,0.16)] backdrop-blur sm:min-h-16 sm:px-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={getUploadAcceptAttribute("attachment")}
                className="hidden"
                onChange={(event) => void handleUpload(event.currentTarget.files?.[0])}
              />
              <button
                ref={addButtonRef}
                type="button"
                onClick={() => setIsAddMenuOpen((current) => !current)}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-[#4b3c79] transition hover:bg-[#f1ebff] focus:outline-none focus:ring-2 focus:ring-[#8f67ff]/35"
                aria-expanded={isAddMenuOpen}
                aria-haspopup="menu"
                aria-label="Add"
                title="Add"
              >
                <Plus className="size-5" aria-hidden="true" />
                <span className="hidden text-sm font-semibold sm:inline">Add</span>
              </button>
              {isAddMenuOpen ? (
                <div
                  ref={addMenuRef}
                  className="absolute bottom-[calc(100%+0.75rem)] left-3 z-20 w-72 overflow-hidden rounded-3xl border border-[#ded2ff] bg-white p-2 shadow-[0_22px_60px_rgba(76,54,145,0.18)]"
                  role="menu"
                >
                  {ADD_OPTIONS.map((option) => {
                    const Icon =
                      option.action === "upload"
                        ? Plus
                        : option.action === "live_card"
                          ? Image
                          : FileText;
                    return (
                      <button
                        key={option.action}
                        type="button"
                        onClick={() => void handleAddOption(option)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[#f5f0ff]"
                        role="menuitem"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f1ebff] text-[#6f4cff]">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#261d47]">
                            {option.label}
                          </span>
                          <span className="block text-xs text-[#7c719d]">{option.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <input
                value={input}
                onChange={(event) => setInput(event.currentTarget.value)}
                placeholder="Ask anything"
                className="h-11 min-w-0 flex-1 border-0 bg-transparent text-base text-[#161129] outline-none placeholder:text-[#7c719d]"
              />
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-full text-[#4b3c79] transition hover:bg-[#f1ebff] focus:outline-none focus:ring-2 focus:ring-[#8f67ff]/35"
                aria-label="Use voice input"
                title="Use voice input"
              >
                <Mic className="size-5" aria-hidden="true" />
              </button>
              <button
                type="submit"
                disabled={isSending || isFinalizing || !input.trim()}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#6f4cff_0%,#8f67ff_100%)] text-white shadow-[0_12px_28px_rgba(111,76,255,0.28)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#b090ff]/55 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Send"
                title="Send"
              >
                <ArrowUp className="size-5" aria-hidden="true" />
              </button>
            </form>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

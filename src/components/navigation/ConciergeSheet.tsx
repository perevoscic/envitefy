"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, UserPlus, X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  signupSuggested?: boolean;
};

type GuestChatApiResponse = {
  ok?: boolean;
  answer?: string;
  error?: string;
  signupSuggested?: boolean;
};

type ConciergeSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignupSelect: () => void;
};

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Tell me what you’re planning, and I’ll help turn it into a polished event page with RSVP, reminders, gifts, registry details, and guest tracking.",
};

const conciergeQuickPrompts = [
  "Plan my event with AI",
  "Upload an invite or flyer",
  "See what guests will see",
  "How do RSVPs work?",
  "Add gifts, registry, or notes",
];

const conciergeLogoMaskStyle = {
  WebkitMask: "url(/logo-colored.png) center / contain no-repeat",
  mask: "url(/logo-colored.png) center / contain no-repeat",
};

function makeMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseGuestChatResponse(value: unknown): GuestChatApiResponse {
  if (!isRecord(value)) return {};
  return {
    ok: typeof value.ok === "boolean" ? value.ok : undefined,
    answer: typeof value.answer === "string" ? value.answer : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
    signupSuggested: typeof value.signupSuggested === "boolean" ? value.signupSuggested : undefined,
  };
}

export default function ConciergeSheet({
  open,
  onOpenChange,
  onSignupSelect,
}: ConciergeSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending, open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: makeMessageId(),
      role: "user",
      text: trimmed.slice(0, 1000),
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/guest-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage.text,
          history: nextMessages.slice(-10).map((message) => ({
            role: message.role,
            text: message.text,
          })),
        }),
      });
      const data = parseGuestChatResponse(await res.json().catch(() => ({})));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Envitefy Concierge is temporarily unavailable.");
      }

      setMessages((current) => [
        ...current,
        {
          id: makeMessageId(),
          role: "assistant",
          text:
            data.answer ||
            "I can help with event ideas, RSVP, gift links, registry details, and guest setup.",
          signupSuggested: Boolean(data.signupSuggested),
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: makeMessageId(),
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "Envitefy Concierge is temporarily unavailable.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  function handleSignupSelect() {
    onOpenChange(false);
    onSignupSelect();
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90] md:hidden" role="presentation">
          <motion.button
            type="button"
            aria-label="Dismiss Envitefy Concierge"
            className="absolute inset-0 bg-[#120b1d]/48 backdrop-blur-[3px]"
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Envitefy Concierge"
            className="absolute inset-x-0 bottom-0 mx-auto flex h-[82vh] max-h-[85vh] min-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] border border-white/12 bg-[#fbf8ff] text-[#211821] shadow-[0_-28px_90px_rgba(20,11,34,0.38)]"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <header className="shrink-0 border-b border-white/10 bg-[linear-gradient(135deg,#171019_0%,#241927_52%,#40233d_100%)] px-4 pb-4 pt-4 text-[#fff9ef] shadow-[0_1px_0_rgba(255,255,255,0.1)_inset]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-9 w-28 shrink-0 bg-[#f6d477] drop-shadow-[0_8px_18px_rgba(246,212,119,0.18)]"
                    style={conciergeLogoMaskStyle}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h2
                      className="truncate text-base font-semibold text-[#f9df94]"
                      style={{ color: "#f9df94" }}
                    >
                      Envitefy Concierge
                    </h2>
                    <p className="truncate text-xs font-semibold text-[#fff7df]">
                      Event ideas, RSVP, gifts & setup
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#f4ead5]/78 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d58f]"
                  aria-label="Close Envitefy Concierge"
                  title="Close"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fbf8ff_0%,#fffaf7_100%)] px-4 py-4"
              aria-live="polite"
            >
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[86%] flex-col ${
                        message.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-full whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
                          message.role === "user"
                            ? "rounded-br-md bg-[linear-gradient(135deg,#5f3cff_0%,#8b4dff_58%,#bd4cba_100%)] text-white shadow-[0_14px_26px_rgba(100,68,210,0.22)]"
                            : "rounded-bl-md border border-[#eadff6] bg-white/95 text-[#352c3b]"
                        }`}
                      >
                        {message.text}
                      </div>
                      {message.role === "assistant" && message.signupSuggested ? (
                        <button
                          type="button"
                          onClick={handleSignupSelect}
                          className="mt-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#241b35] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(56,44,84,0.22)] transition hover:-translate-y-0.5 hover:bg-[#5d4ebb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7be8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf8ff]"
                        >
                          <UserPlus className="h-4 w-4" aria-hidden="true" />
                          Create account
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                {messages.length === 1 && !isSending ? (
                  <div className="grid gap-2 pt-2">
                    {conciergeQuickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        className="rounded-2xl border border-[#e5d9f4] bg-white/86 px-3.5 py-3 text-left text-xs font-semibold leading-5 text-[#51465b] shadow-[0_1px_0_rgba(255,255,255,0.76)_inset] transition hover:border-[#bda6ed] hover:bg-[#faf7ff] hover:text-[#211821]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}

                {isSending ? (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-[#eadff6] bg-white/95 px-3.5 py-2.5 text-sm text-[#665d68] shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-[#8257e6]" aria-hidden="true" />
                      Thinking...
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <form
              className="shrink-0 border-t border-[#e8ddf4] bg-white/96 px-3 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_42px_rgba(64,44,92,0.08)]"
              onSubmit={handleSubmit}
            >
              <div className="flex items-end gap-2 rounded-2xl border border-[#e1d3f2] bg-[#fbf8ff] p-2 focus-within:border-[#9b7beb]">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={1}
                  maxLength={1000}
                  className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-[#211821] outline-none placeholder:text-[#8c8192]"
                  placeholder="Ask Envitefy Concierge..."
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#5f3cff_0%,#8b4dff_58%,#f04fb7_100%)] text-white shadow-[0_10px_22px_rgba(115,76,224,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  aria-label="Send Concierge message"
                  title="Send"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </form>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

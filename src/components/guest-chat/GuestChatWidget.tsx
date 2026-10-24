"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useSession } from "next-auth/react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestGuestChatAnswer } from "@/lib/guest-chat/client";
import { getQuickGuestChatAnswer } from "@/lib/guest-chat/quick-answer";
import { guestChatStarterQuestions } from "@/lib/guest-chat/starters";
import ConciergeLauncher from "../navigation/ConciergeLauncher";
import { useConciergePopover } from "../navigation/concierge-popover";
import popoverStyles from "../navigation/concierge-popover.module.css";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
};

type ContactState =
  | { status: "idle"; message: string }
  | { status: "sending"; message: string }
  | { status: "sent"; message: string }
  | { status: "error"; message: string };

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi, I can answer quick questions about Envitefy event pages, RSVPs, uploads, registry links, and guest actions.",
  createdAt: 0,
};

function makeMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function transcriptFromMessages(messages: ChatMessage[]) {
  return messages
    .map((message) => `${message.role === "user" ? "Visitor" : "Envitefy Concierge"}: ${message.text}`)
    .join("\n\n")
    .slice(-6000);
}

export default function GuestChatWidget({ conciergeLauncher = false }: { conciergeLauncher?: boolean }) {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingReplyId, setStreamingReplyId] = useState<string | null>(null);
  const [handoffSuggested, setHandoffSuggested] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [contactState, setContactState] = useState<ContactState>({
    status: "idle",
    message: "",
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef(true);
  const firstQuestionRef = useRef<HTMLButtonElement | null>(null);
  const focusWelcomeRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const contactRequestRef = useRef<AbortController | null>(null);
  const { panelMotion, motionEnabled } = useConciergePopover({ open, panelRef, launcherRef });

  const resetConversation = useCallback((focusWelcome = false) => {
    focusWelcomeRef.current = focusWelcome;
    const chatRequest = requestRef.current;
    requestRef.current = null;
    chatRequest?.abort();
    const contactRequest = contactRequestRef.current;
    contactRequestRef.current = null;
    contactRequest?.abort();
    setMessages([welcomeMessage]);
    setInput("");
    setIsSending(false);
    setStreamingReplyId(null);
    setHandoffSuggested(false);
    setShowContactForm(false);
    setContactName("");
    setContactEmail("");
    setContactNote("");
    setContactState({ status: "idle", message: "" });
  }, []);

  const closeChat = useCallback(() => {
    resetConversation();
    setOpen(false);
  }, [resetConversation]);

  useEffect(() => () => {
    requestRef.current?.abort();
    requestRef.current = null;
    contactRequestRef.current?.abort();
    contactRequestRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = true;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return;
      if (panelRef.current?.contains(event.target) || launcherRef.current?.contains(event.target)) return;
      restoreFocusRef.current = false;
      closeChat();
    };
    document.addEventListener("focusin", onFocusIn);
    const frame = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      cancelAnimationFrame(frame);
      if (restoreFocusRef.current) previousFocus?.focus({ preventScroll: true });
    };
  }, [open, closeChat]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: messages.length === 1 ? 0 : scrollRef.current.scrollHeight,
      behavior: messages.length === 1 || !motionEnabled ? "instant" : "smooth",
    });
  }, [messages, isSending, open, showContactForm, motionEnabled]);

  useEffect(() => {
    if (!open || !focusWelcomeRef.current) return;
    focusWelcomeRef.current = false;
    firstQuestionRef.current?.focus({ preventScroll: true });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    const onOutsidePointer = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Node)) return;
      if (panelRef.current?.contains(event.target) || launcherRef.current?.contains(event.target)) return;
      restoreFocusRef.current = false;
      closeChat();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutsidePointer, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onOutsidePointer, true);
    };
  }, [closeChat, open]);

  if (status !== "unauthenticated") return null;

  const hasConversation = messages.length > 1 || Boolean(input) || isSending ||
    Boolean(streamingReplyId) || handoffSuggested || showContactForm ||
    Boolean(contactName || contactEmail || contactNote || contactState.message) ||
    contactState.status !== "idle";

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || requestRef.current) return;

    const userMessage: ChatMessage = {
      id: makeMessageId(),
      role: "user",
      text: trimmed.slice(0, 1000),
      createdAt: Date.now(),
    };
    const nextMessages = [...messages, userMessage];
    const history = messages
      .filter((message) => message.id !== welcomeMessage.id)
      .slice(-10)
      .map(({ role, text }) => ({ role, text }));
    const quickAnswer = getQuickGuestChatAnswer(userMessage.text, history);

    setInput("");
    if (quickAnswer) {
      setMessages([
        ...nextMessages,
        {
          id: makeMessageId(),
          role: "assistant",
          text: quickAnswer.answer,
          createdAt: Date.now(),
        },
      ]);
      setHandoffSuggested(quickAnswer.handoffSuggested);
      return;
    }

    setMessages(nextMessages);
    setIsSending(true);
    setHandoffSuggested(false);
    const controller = new AbortController();
    requestRef.current = controller;
    const isCurrentRequest = () => requestRef.current === controller && !controller.signal.aborted;
    const replyId = makeMessageId();
    const showReply = (text: string) => {
      if (!isCurrentRequest()) return;
      setMessages((current) => {
        const reply: ChatMessage = { id: replyId, role: "assistant", text, createdAt: Date.now() };
        return current.some((message) => message.id === replyId)
          ? current.map((message) => message.id === replyId ? reply : message)
          : [...current, reply];
      });
    };
    let streamed = "";

    try {
      const data = await requestGuestChatAnswer(
        {
          message: userMessage.text,
          history: [...history, { role: userMessage.role, text: userMessage.text }],
          onDelta: (text) => {
            if (!isCurrentRequest()) return;
            streamed += text;
            setStreamingReplyId(replyId);
            showReply(streamed);
          },
        },
        { signal: controller.signal },
      );
      if (!isCurrentRequest()) return;
      showReply(data.answer);
      setHandoffSuggested(Boolean(data.handoffSuggested));
    } catch (error) {
      if (!isCurrentRequest()) return;
      const message =
        error instanceof Error ? error.message : "Guest chat is temporarily unavailable.";
      if (!streamed) {
        showReply(`${message} You can still contact Envitefy support from here.`);
      }
      setHandoffSuggested(true);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setStreamingReplyId(null);
        setIsSending(false);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (contactRequestRef.current) return;

    const email = contactEmail.trim();
    const note = contactNote.trim();
    if (!email || !note) {
      setContactState({
        status: "error",
        message: "Add your email and a short note so the team can follow up.",
      });
      return;
    }

    const controller = new AbortController();
    contactRequestRef.current = controller;
    const isCurrentRequest = () => contactRequestRef.current === controller && !controller.signal.aborted;
    setContactState({ status: "sending", message: "Sending..." });
    try {
      const transcript = transcriptFromMessages(messages);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: contactName.trim(),
          email,
          title: "Guest chat support request",
          message: [`Visitor note: ${note}`, "", "Guest chat transcript:", transcript].join("\n"),
        }),
      });
      if (!isCurrentRequest()) return;
      const rawData = await res.json().catch(() => ({}));
      if (!isCurrentRequest()) return;
      const data = isRecord(rawData) ? rawData : {};
      const ok = typeof data.ok === "boolean" ? data.ok : false;
      if (!res.ok || !ok) {
        throw new Error("Unable to send the support request right now.");
      }
      setContactState({
        status: "sent",
        message: "Sent. The Envitefy team can follow up by email.",
      });
      setContactNote("");
    } catch (error) {
      if (!isCurrentRequest()) return;
      setContactState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to send the support request.",
      });
    } finally {
      if (contactRequestRef.current === controller) contactRequestRef.current = null;
    }
  }

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[80] flex flex-col items-end gap-3 sm:right-6">
      <AnimatePresence>
      {open ? (
        <motion.section
          ref={panelRef}
          role="dialog"
          aria-modal={false}
          tabIndex={-1}
          aria-label="Envitefy Concierge chat"
          className={`${popoverStyles.panel} border border-[#d8c495]/80 bg-[#fffaf2] text-[#211821] shadow-[0_28px_80px_rgba(20,15,24,0.3),0_1px_0_rgba(255,255,255,0.8)_inset]`}
          {...panelMotion}
          data-concierge-variant="guest"
          data-concierge-motion={motionEnabled ? "popover" : "reduced"}
        >
          <span data-concierge-arrow className={popoverStyles.arrow} aria-hidden="true" />
          <header className="flex items-center justify-between gap-3 border-b border-[#d7b46a]/28 bg-[linear-gradient(135deg,#171019_0%,#241927_58%,#3a2735_100%)] px-4 py-3 text-[#fff8e9] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#e8c77b]/38 bg-[#f1d28b]/12 text-[#f5d88f] shadow-[0_8px_20px_rgba(0,0,0,0.22),0_1px_0_rgba(255,255,255,0.12)_inset]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold !text-[#fff9ef]">Envitefy Concierge</h2>
                <p className="truncate text-xs text-[#d8c8aa]">Guest questions</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeChat}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[#f4ead5]/78 transition hover:bg-white/10 hover:text-white"
              aria-label="Close Envitefy Concierge chat"
              title="Close"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          {hasConversation ? (
            <div className="border-b border-[#e4d4bb] bg-[#fffaf2] px-4">
              <button
                type="button"
                onClick={() => resetConversation(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-[#463a46] transition hover:bg-[#f8efe3] hover:text-[#201a23] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ad8748]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                New conversation
              </button>
            </div>
          ) : null}

          <div
            ref={scrollRef}
            className="overflow-y-auto bg-[linear-gradient(180deg,#fffaf2_0%,#f8efe3_100%)] px-4 py-4"
            aria-live="polite"
          >
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[84%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
                      message.role === "user"
                        ? "bg-[linear-gradient(135deg,#201622_0%,#352539_100%)] text-[#fff9ef] shadow-[0_12px_24px_rgba(32,22,34,0.22)]"
                        : "border border-[#ead9bd] bg-white/92 text-[#3b3138]"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {messages.length === 1 && !isSending ? (
                <div className="grid gap-2 pt-1">
                  {guestChatStarterQuestions.map((question, index) => (
                    <button
                      key={question}
                      ref={index === 0 ? firstQuestionRef : undefined}
                      type="button"
                      onClick={() => sendMessage(question)}
                      className="rounded-md border border-[#dccaa9] bg-white/86 px-3 py-2 text-left text-xs font-semibold leading-5 text-[#463a46] shadow-[0_1px_0_rgba(255,255,255,0.76)_inset] transition hover:border-[#b9975c] hover:bg-[#fff7e8] hover:text-[#211821]"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              ) : null}

              {isSending && !streamingReplyId ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-lg border border-[#ead9bd] bg-white/92 px-3.5 py-2.5 text-sm text-[#665d68] shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-[#a58042]" aria-hidden="true" />
                    Answering...
                  </div>
                </div>
              ) : null}
            </div>

            {handoffSuggested || showContactForm ? (
              <div className="mt-4 rounded-lg border border-[#ead9bd] bg-white/90 p-3 shadow-sm">
                {!showContactForm ? (
                  <button
                    type="button"
                    onClick={() => setShowContactForm(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,#201622_0%,#3a293d_100%)] px-3 py-2 text-sm font-semibold text-[#fff9ef] shadow-[0_12px_26px_rgba(32,22,34,0.18)] transition hover:bg-[#352a39]"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Contact support
                  </button>
                ) : (
                  <form className="space-y-3" onSubmit={handleContactSubmit}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={contactName}
                        onChange={(event) => setContactName(event.target.value)}
                        className="h-10 rounded-md border border-[#dccaa9] bg-[#fffaf2] px-3 text-sm text-[#211821] outline-none transition placeholder:text-[#8d817f] focus:border-[#ad8748] focus:bg-white"
                        placeholder="Name"
                        autoComplete="name"
                      />
                      <input
                        value={contactEmail}
                        onChange={(event) => setContactEmail(event.target.value)}
                        className="h-10 rounded-md border border-[#dccaa9] bg-[#fffaf2] px-3 text-sm text-[#211821] outline-none transition placeholder:text-[#8d817f] focus:border-[#ad8748] focus:bg-white"
                        placeholder="Email"
                        type="email"
                        autoComplete="email"
                        required
                      />
                    </div>
                    <textarea
                      value={contactNote}
                      onChange={(event) => setContactNote(event.target.value)}
                      className="min-h-20 w-full resize-none rounded-md border border-[#dccaa9] bg-[#fffaf2] px-3 py-2 text-sm leading-5 text-[#211821] outline-none transition placeholder:text-[#8d817f] focus:border-[#ad8748] focus:bg-white"
                      placeholder="What should we follow up on?"
                      required
                    />
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setShowContactForm(false)}
                        className="text-xs font-semibold text-[#665d68] transition hover:text-[#201a23]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={contactState.status === "sending"}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,#201622_0%,#3a293d_100%)] px-3 text-xs font-semibold text-[#fff9ef] transition hover:bg-[#352a39] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {contactState.status === "sending" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        Send
                      </button>
                    </div>
                    {contactState.message ? (
                      <p
                        className={`text-xs leading-5 ${
                          contactState.status === "error" ? "text-rose-600" : "text-[#665d68]"
                        }`}
                      >
                        {contactState.message}
                      </p>
                    ) : null}
                  </form>
                )}
              </div>
            ) : null}
          </div>

          <form
            className="flex items-end gap-2 border-t border-[#e4d4bb] bg-[#fffdf8] p-3"
            onSubmit={handleSubmit}
          >
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
              className="max-h-28 min-h-10 flex-1 resize-none rounded-md border border-[#d8c7a7] bg-[#fffaf2] px-3 py-2 text-sm leading-5 text-[#211821] outline-none transition placeholder:text-[#8d817f] focus:border-[#ad8748] focus:bg-white"
              placeholder="Ask about Envitefy..."
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#d8b972]/42 bg-[linear-gradient(135deg,#201622_0%,#3a293d_100%)] text-[#fff9ef] shadow-[0_10px_22px_rgba(32,22,34,0.2)] transition hover:-translate-y-0.5 hover:bg-[#352a39] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              aria-label="Send Envitefy Concierge message"
              title="Send"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </form>
        </motion.section>
      ) : null}
      </AnimatePresence>

      {conciergeLauncher ? (
        <ConciergeLauncher
          buttonRef={launcherRef}
          open={open}
          onOpen={() => {
            resetConversation();
            setOpen((value) => !value);
          }}
        />
      ) : <motion.button
        ref={launcherRef}
        type="button"
        whileTap={motionEnabled ? { scale: 0.96 } : undefined}
        onClick={() => {
          resetConversation();
          setOpen((value) => !value);
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e4c678]/70 bg-[linear-gradient(135deg,#171019_0%,#302133_100%)] text-[#fff9ef] shadow-[0_18px_48px_rgba(20,15,24,0.34),0_1px_0_rgba(255,255,255,0.12)_inset] transition hover:-translate-y-0.5 hover:border-[#f1d28b] hover:bg-[#352a39] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d58f] focus-visible:ring-offset-2"
        aria-label={open ? "Close Envitefy Concierge" : "Open Envitefy Concierge"}
        title={open ? "Close Concierge" : "Envitefy Concierge"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-6 w-6 -scale-x-100" aria-hidden="true" />
        )}
      </motion.button>}
    </div>
  );
}

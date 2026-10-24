"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Send, UserPlus, X } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestGuestChatAnswer } from "@/lib/guest-chat/client";
import { getQuickGuestChatAnswer } from "@/lib/guest-chat/quick-answer";
import { guestChatStarterQuestions } from "@/lib/guest-chat/starters";
import { useConciergePopover } from "./concierge-popover";
import popoverStyles from "./concierge-popover.module.css";
import styles from "./concierge-sheet.module.css";
import appearanceStyles from "./navigation-appearance.module.css";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
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
  text: "Hi! I'm Envitefy Concierge. Ask me anything about creating or sharing your event.",
};

const conciergeLogoMaskStyle = {
  WebkitMask: "url(/logo-colored.png) center / contain no-repeat",
  mask: "url(/logo-colored.png) center / contain no-repeat",
};

function makeMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ConciergeSheet({
  open,
  onOpenChange,
  onSignupSelect,
}: ConciergeSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingReplyId, setStreamingReplyId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const firstQuestionRef = useRef<HTMLButtonElement | null>(null);
  const focusWelcomeRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const { panelMotion, motionEnabled } = useConciergePopover({ open, panelRef });
  const reducedMotion = !motionEnabled;

  const resetConversation = useCallback(() => {
    const request = requestRef.current;
    requestRef.current = null;
    request?.abort();
    focusWelcomeRef.current = false;
    setMessages([welcomeMessage]);
    setInput("");
    setIsSending(false);
    setStreamingReplyId(null);
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const closeChat = useCallback(() => {
    resetConversation();
    onOpenChange(false);
  }, [onOpenChange, resetConversation]);

  useEffect(() => {
    if (!open) resetConversation();
  }, [open, resetConversation]);

  useEffect(() => () => {
    const request = requestRef.current;
    requestRef.current = null;
    request?.abort();
  }, []);

  useEffect(() => {
    if (open && messages.length === 1 && focusWelcomeRef.current) {
      focusWelcomeRef.current = false;
      firstQuestionRef.current?.focus({ preventScroll: true });
    }
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = true;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleFocusDeparture = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof Node && !panelRef.current?.contains(target) &&
        !(target instanceof Element && target.closest("[data-concierge-launcher]"))) {
        restoreFocusRef.current = false;
        closeChat();
      }
    };
    document.addEventListener("focusin", handleFocusDeparture, true);
    const frame = requestAnimationFrame(() => {
      const target = window.matchMedia("(min-width: 768px)").matches
        ? inputRef.current : panelRef.current;
      target?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("focusin", handleFocusDeparture, true);
      const focusedLauncher = document.activeElement instanceof Element &&
        document.activeElement.closest("[data-concierge-launcher]");
      if (restoreFocusRef.current && !focusedLauncher) previousFocus?.focus({ preventScroll: true });
    };
  }, [open, closeChat]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeChat();
      }
    };
    const handleOutsidePointer = (event: PointerEvent) => {
      if (
        event.button === 0 &&
        event.target instanceof Node &&
        !(event.target instanceof Element && event.target.closest("[data-concierge-launcher]")) &&
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        restoreFocusRef.current = false;
        closeChat();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handleOutsidePointer, true);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handleOutsidePointer, true);
    };
  }, [closeChat, open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: messages.length === 1 ? 0 : scrollRef.current.scrollHeight,
      behavior: messages.length === 1 || reducedMotion ? "instant" : "smooth",
    });
  }, [messages, isSending, open, reducedMotion]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || requestRef.current) return;

    const userMessage: ChatMessage = {
      id: makeMessageId(),
      role: "user",
      text: trimmed.slice(0, 1000),
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
          signupSuggested: quickAnswer.signupSuggested,
        },
      ]);
      return;
    }

    setMessages(nextMessages);
    setIsSending(true);
    const controller = new AbortController();
    requestRef.current = controller;

    const replyId = makeMessageId();
    const isCurrentRequest = () =>
      requestRef.current === controller && !controller.signal.aborted;
    const showReply = (text: string, signupSuggested?: boolean) => {
      if (!isCurrentRequest()) return;
      setMessages((current) => {
        const reply: ChatMessage = { id: replyId, role: "assistant", text, signupSuggested };
        return current.some((message) => message.id === replyId)
          ? current.map((message) => (message.id === replyId ? reply : message))
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
      showReply(data.answer, Boolean(data.signupSuggested));
    } catch (error) {
      // Keep a partly streamed answer rather than replacing it with an error.
      if (!streamed && isCurrentRequest()) {
        showReply(
          error instanceof Error && error.message
            ? error.message
            : "Envitefy Concierge is temporarily unavailable.",
        );
      }
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

  function handleSignupSelect() {
    closeChat();
    onSignupSelect();
  }

  function handleNewConversation() {
    resetConversation();
    focusWelcomeRef.current = true;
  }

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="pointer-events-none fixed inset-0 z-[90]"
          role="presentation"
        >
          <motion.section
            ref={panelRef}
            role="dialog"
            aria-modal={false}
            aria-label="Envitefy Concierge"
            tabIndex={-1}
            data-concierge-motion={motionEnabled ? "popover" : "reduced"}
            className={`${styles.panel} ${popoverStyles.panel} pointer-events-auto border border-white/12 bg-[#fbf8ff] text-[#211821] shadow-[0_18px_48px_rgba(20,11,34,0.22)]`}
            {...panelMotion}
          >
            <span data-concierge-arrow className={popoverStyles.arrow} aria-hidden="true" />
            <header className="shrink-0 border-b border-white/10 bg-[linear-gradient(135deg,#171019_0%,#241927_52%,#40233d_100%)] px-4 py-3 text-[#fff9ef] shadow-[0_1px_0_rgba(255,255,255,0.1)_inset]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`${appearanceStyles.conciergeSymbol} h-9 w-9 shrink-0 bg-[#f6d477] drop-shadow-[0_8px_18px_rgba(246,212,119,0.18)]`}
                    style={conciergeLogoMaskStyle}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h2
                      className={styles.title}
                      style={{ color: "#f9df94" }}
                    >
                      Envitefy Concierge
                    </h2>
                    <p className="truncate text-xs font-semibold text-[#fff7df]">
                      Questions about Envitefy
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeChat}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#f4ead5]/78 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d58f]"
                  aria-label="Close Envitefy Concierge"
                  title="Close"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </header>

            {messages.length > 1 || input || isSending ? (
              <div className="shrink-0 px-3 py-1">
                <button
                  type="button"
                  onClick={handleNewConversation}
                  className={`${styles.starter} inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#51465b] transition hover:bg-[#eee7f6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7be8] focus-visible:ring-inset`}
                  title="Back to the welcome questions"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  New conversation
                </button>
              </div>
            ) : null}

            <div
              ref={scrollRef}
              className={`${styles.messages} min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fbf8ff_0%,#fffaf7_100%)] px-4 py-4`}
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
                    {guestChatStarterQuestions.map((prompt) => (
                      <button
                        ref={prompt === guestChatStarterQuestions[0] ? firstQuestionRef : undefined}
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        className={`${styles.starter} rounded-2xl border border-[#e5d9f4] bg-white/86 px-3.5 py-3 text-left text-xs font-semibold leading-5 text-[#51465b] shadow-[0_1px_0_rgba(255,255,255,0.76)_inset] transition hover:border-[#bda6ed] hover:bg-[#faf7ff] hover:text-[#211821]`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}

                {isSending && !streamingReplyId ? (
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
              className={`${styles.composer} shrink-0 border-t border-[#e8ddf4] bg-white/96 px-3 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_42px_rgba(64,44,92,0.08)]`}
              onSubmit={handleSubmit}
            >
              <div className="flex items-end gap-2 rounded-2xl border border-[#e1d3f2] bg-[#fbf8ff] p-2 focus-within:border-[#9b7beb]">
                <textarea
                  ref={inputRef}
                  aria-label="Question for Envitefy Concierge"
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
                  placeholder="Ask about Envitefy..."
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#5f3cff_0%,#8b4dff_58%,#f04fb7_100%)] text-white shadow-[0_10px_22px_rgba(115,76,224,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  aria-label="Send Envitefy Concierge message"
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

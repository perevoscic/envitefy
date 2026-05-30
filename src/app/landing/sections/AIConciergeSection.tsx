"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  Gift,
  HeartHandshake,
  MessageCircle,
  Palette,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

type ChatMessage = {
  id: string;
  speaker: "Host" | "AI Concierge";
  text: string;
};

type ConciergeFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type FloatingSignal = {
  label: string;
  value: string;
  icon: LucideIcon;
  className: string;
};

type AIConciergeSectionProps = {
  onPrimaryAction: () => void;
};

const chatMessages: ChatMessage[] = [
  {
    id: "planning",
    speaker: "Host",
    text: "I'm planning Mia's baby shower.",
  },
  {
    id: "create-card",
    speaker: "AI Concierge",
    text: "Beautiful! I can help you create a live baby shower card. Who is hosting the event?",
  },
  {
    id: "host-name",
    speaker: "Host",
    text: "Her sister Ana.",
  },
  {
    id: "options",
    speaker: "AI Concierge",
    text: "Perfect. Would you like to add RSVP, registry, and gift options?",
  },
  {
    id: "registry",
    speaker: "Host",
    text: "Yes, add RSVP and an Amazon registry.",
  },
  {
    id: "done",
    speaker: "AI Concierge",
    text: "Done. I'll create a live card with RSVP tracking, registry access, guest reminders, and event details.",
  },
];

const conciergeFeatures: ConciergeFeature[] = [
  {
    title: "Creates Live Event Cards",
    description: "Turn a simple message into a polished event page with all the important details.",
    icon: CalendarCheck2,
  },
  {
    title: "Adds RSVP Automatically",
    description: "Collect guest responses and keep track of who is coming.",
    icon: HeartHandshake,
  },
  {
    title: "Connects Gift Links & Registries",
    description: "Add baby registries, wedding registries, wish lists, or custom gift links.",
    icon: Gift,
  },
  {
    title: "Personalizes the Experience",
    description: "The Concierge adjusts wording, design, and event details based on the occasion.",
    icon: Palette,
  },
  {
    title: "Guides Guests Clearly",
    description: "Guests can find the date, location, RSVP button, registry, and updates in one place.",
    icon: UsersRound,
  },
  {
    title: "Saves Time for Hosts",
    description: "No complicated forms. Just answer a few natural questions.",
    icon: Sparkles,
  },
];

const floatingSignals: FloatingSignal[] = [
  {
    label: "RSVP",
    value: "Tracking ready",
    icon: HeartHandshake,
    className: "left-0 top-[29%] -translate-x-28",
  },
  {
    label: "Registry",
    value: "Amazon added",
    icon: Gift,
    className: "right-0 top-[43%] translate-x-24",
  },
  {
    label: "Ready in seconds",
    value: "Easy shared",
    icon: BellRing,
    className: "left-0 bottom-[19%] -translate-x-24",
  },
];

const previewActions = ["RSVP", "Registry", "Gift Link"];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function ConciergeAvatar() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3d68df,#7d4be8)] text-white shadow-[0_14px_26px_rgba(75,80,190,0.25)] sm:h-9 sm:w-9"
      aria-hidden="true"
    >
      <Sparkles className="h-4 w-4" />
    </span>
  );
}

function HostAvatar() {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1f5cc8,#8c28dc)] text-[9px] font-black text-white shadow-[0_12px_24px_rgba(83,70,199,0.26)] sm:h-8 sm:w-8 sm:text-[10px]"
      aria-hidden="true"
    >
      RJ
    </span>
  );
}

function PhoneConversation() {
  return (
    <div className="relative mx-auto w-full max-w-[22rem] lg:max-w-[24rem]">
      <div
        aria-hidden="true"
        className="absolute inset-x-4 bottom-2 top-12 rounded-[2rem] bg-[linear-gradient(145deg,rgba(137,117,234,0.28),rgba(248,175,199,0.2),rgba(221,179,119,0.12))] blur-3xl"
      />

      {floatingSignals.map((signal, index) => {
        const Icon = signal.icon;
        return (
          <motion.div
            key={signal.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.42, delay: 0.18 + index * 0.08, ease: "easeOut" }}
            className={cx(
              "absolute z-20 hidden min-w-36 rounded-lg border border-white/72 bg-white/78 p-3 text-[#251b47] shadow-[0_22px_50px_rgba(71,60,123,0.16)] backdrop-blur-xl lg:block",
              signal.className,
            )}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f1ecff] text-[#6557cf]">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6a44]">
                  {signal.label}
                </p>
                <p className="mt-0.5 text-xs font-bold text-[#251b47]">{signal.value}</p>
              </div>
            </div>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -1.5 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true, amount: 0.32 }}
        transition={{ duration: 0.58, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2.2rem] border border-[#2f2a3d]/12 bg-[#17141d] p-2 shadow-[0_34px_90px_rgba(49,40,85,0.28)]"
      >
        <div className="relative flex aspect-[9/19.5] min-h-[46rem] flex-col overflow-hidden rounded-[1.75rem] bg-[linear-gradient(180deg,#fff_0%,#fff_35%,#f4f0ff_72%,#ebe4ff_100%)] sm:min-h-[39rem]">
          <div className="flex items-center justify-between border-b border-[#eee8fb] bg-[#f5f1ff]/86 px-5 py-3 text-[11px] font-bold text-[#1f1834]">
            <span>14:36</span>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2 w-4 rounded-[2px] border border-[#1f1834]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#1f1834]/80" />
              <span className="rounded-full bg-[#1f1834] px-1.5 py-0.5 text-[9px] text-white">
                96
              </span>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col px-4 pb-4 pt-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Open Concierge menu"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ebe4fb] bg-white text-[#1f1834] shadow-[0_14px_34px_rgba(72,60,128,0.12)]"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
              <div className="rounded-full border border-[#ebe4fb] bg-white/78 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#7766d8] shadow-[0_12px_26px_rgba(72,60,128,0.08)]">
                Live draft
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.42, delay: 0.18, ease: "easeOut" }}
              className="mx-auto mt-8 w-[86%] rounded-lg border border-white/80 bg-white/76 p-3 text-[#251b47] shadow-[0_18px_46px_rgba(90,77,151,0.14)] backdrop-blur sm:mt-10"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a46b5b]">
                Live card preview
              </p>
              <h3 className="mt-2 text-lg font-semibold leading-tight text-[#251b47]">
                Mia's Baby Shower
              </h3>
              <p className="mt-1 text-xs font-medium text-[#675b7b]">
                Saturday, June 14 · 2:00 PM
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {previewActions.map((action) => (
                  <span
                    key={action}
                    className="rounded-md bg-[#f2edff] px-2 py-1 text-[10px] font-bold text-[#6557cf]"
                  >
                    {action}
                  </span>
                ))}
              </div>
            </motion.div>

            <ol className="mt-auto space-y-2 sm:space-y-3" aria-label="Sample AI Concierge conversation">
              {chatMessages.map((message, index) => {
                const isHost = message.speaker === "Host";
                return (
                  <motion.li
                    key={message.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.75 }}
                    transition={{ duration: 0.36, delay: 0.26 + index * 0.08, ease: "easeOut" }}
                    className={cx("flex items-end gap-2", isHost ? "justify-end" : "justify-start")}
                  >
                    {!isHost ? <ConciergeAvatar /> : null}
                    <p
                      className={cx(
                        "max-w-[78%] rounded-[1.15rem] px-3 py-2 text-[12px] leading-4 shadow-[0_12px_26px_rgba(73,61,128,0.1)] sm:px-4 sm:py-3 sm:text-sm sm:leading-5",
                        isHost
                          ? "rounded-br-md bg-[linear-gradient(135deg,#6257dc,#7a55df)] text-white"
                          : "rounded-bl-md border border-[#ebe5f3] bg-white text-[#292333]",
                      )}
                    >
                      <span className="sr-only">{message.speaker}: </span>
                      {message.text}
                    </p>
                    {isHost ? <HostAvatar /> : null}
                  </motion.li>
                );
              })}
            </ol>

            <div className="mt-4 flex h-12 items-center gap-3 rounded-[1.35rem] border border-[#d8bac7]/80 bg-white/82 px-4 text-xs text-[#a79bab] shadow-[0_18px_44px_rgba(78,61,126,0.12)] sm:mt-5 sm:h-14 sm:text-sm">
              <span className="min-w-0 flex-1 truncate">Or just start typing and let's get going...</span>
              <span
                aria-hidden="true"
                className="h-5 w-5 rounded-full border-2 border-[#9d93aa] border-t-transparent"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AIConciergeSection({ onPrimaryAction }: AIConciergeSectionProps) {
  return (
    <section
      id="concierge"
      className="relative isolate overflow-hidden border-b border-[#ded2bd] bg-[linear-gradient(135deg,#fffdf9_0%,#f8f2ff_42%,#fff6f2_100%)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(140,114,212,0.48),rgba(219,157,142,0.42),transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(96,81,160,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(160,113,96,0.04)_1px,transparent_1px)] bg-[size:4.25rem_4.25rem] opacity-55"
      />

      <div className="relative mx-auto grid min-h-[100svh] w-full max-w-[92rem] items-center gap-12 px-4 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-10 lg:px-10 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="max-w-3xl lg:col-start-1 lg:row-start-1"
        >
          <p className="inline-flex items-center gap-2 rounded-md border border-[#d8c9f2] bg-white/76 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#6557cf] shadow-[0_14px_34px_rgba(86,70,158,0.08)]">
            <Sparkles className="h-4 w-4" />
            Envitefy AI Concierge
          </p>
          <h2
            className="mt-5 text-4xl font-light leading-tight text-[#201a23] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Create Beautiful Event Cards by Simply Chatting
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#66586e] sm:text-lg">
            Tell Envitefy what you're planning, and your AI Concierge will help build a polished
            live event card complete with RSVP, gift links, registry details, reminders, and guest
            tracking.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onPrimaryAction}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#241b35] px-6 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(56,44,84,0.22)] transition hover:-translate-y-0.5 hover:bg-[#5d4ebb] focus:outline-none focus:ring-2 focus:ring-[#8b7be8] focus:ring-offset-2"
            >
              Try the AI Concierge
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <PhoneConversation />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-start-1 lg:row-start-2">
          {conciergeFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.36, delay: index * 0.04, ease: "easeOut" }}
                className="rounded-lg border border-white/80 bg-white/74 p-4 shadow-[0_18px_44px_rgba(72,60,128,0.08)] backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#f1ecff] text-[#6557cf]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#241b35]">{feature.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#66586e]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

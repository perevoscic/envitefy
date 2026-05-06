"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  CalendarDays,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  type LucideIcon,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type {
  ConciergeEventMessageResponse,
  EventAsset,
  EventAssetType,
} from "@/lib/concierge/types";

type ManageTab = "live-card" | "details" | "assets" | "guests" | "assistant";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type EventManageClientProps = {
  eventId: string;
  initialTitle: string;
  initialData: Record<string, unknown>;
  initialAssets: EventAsset[];
  eventHref: string;
};

type RsvpResponse = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  response: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RsvpSummary = {
  stats: { yes: number; no: number; maybe: number };
  numberOfGuests: number;
  remaining: number;
  filled: number;
  responses: RsvpResponse[];
};

const TABS: Array<{ key: ManageTab; label: string; icon: LucideIcon }> = [
  { key: "live-card", label: "Live Card", icon: Sparkles },
  { key: "details", label: "Details", icon: CalendarDays },
  { key: "assets", label: "Assets", icon: FileText },
  { key: "guests", label: "Guests", icon: Users },
  { key: "assistant", label: "Assistant", icon: MessageCircle },
];

const QUICK_ASSETS: Array<{ type: EventAssetType; label: string; description: string }> = [
  { type: "invitation", label: "Invitation", description: "Invite copy and card asset" },
  { type: "rsvp_page", label: "RSVP page", description: "Guest response surface" },
  { type: "whatsapp", label: "WhatsApp", description: "Share-ready message" },
  { type: "instagram_story", label: "Story", description: "Vertical social format" },
  { type: "printable_flyer", label: "Flyer", description: "Print-friendly output" },
  { type: "reminder_message", label: "Reminder", description: "Follow-up copy" },
  { type: "thank_you_card", label: "Thank you", description: "Post-event note" },
];

function newMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
  };
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function assetTypeLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatResponse(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "yes") return "Attending";
  if (normalized === "no") return "Declined";
  if (normalized === "maybe") return "Maybe";
  return value || "Pending";
}

function responseClassName(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "yes") return "bg-[#7c4dff]/10 text-[#7c4dff]";
  if (normalized === "no") return "bg-rose-50 text-rose-600";
  if (normalized === "maybe") return "bg-amber-50 text-amber-700";
  return "bg-[#f1ebff] text-[#6f6286]";
}

function relativeTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function eventHeadline(eventData: Record<string, unknown>, fallbackTitle: string) {
  const liveCard = asRecord(eventData.liveCard);
  return (
    cleanString(liveCard.headline) ||
    cleanString(eventData.headlineTitle) ||
    cleanString(eventData.title) ||
    fallbackTitle ||
    "Untitled event"
  );
}

function eventSubheadline(eventData: Record<string, unknown>) {
  const liveCard = asRecord(eventData.liveCard);
  return (
    cleanString(liveCard.subheadline) ||
    cleanString(eventData.theme) ||
    cleanString(eventData.tone) ||
    "Details ready for the live card"
  );
}

function eventBody(eventData: Record<string, unknown>, fallbackTitle: string) {
  const liveCard = asRecord(eventData.liveCard);
  return (
    cleanString(liveCard.body) ||
    cleanString(eventData.description) ||
    `Please join us for ${eventHeadline(eventData, fallbackTitle)}.`
  );
}

function eventDateLine(eventData: Record<string, unknown>) {
  return (
    cleanString(eventData.dateText) ||
    cleanString(eventData.date) ||
    cleanString(eventData.startAt) ||
    cleanString(eventData.startISO) ||
    cleanString(eventData.start) ||
    "Date pending"
  );
}

function eventTimeLine(eventData: Record<string, unknown>) {
  return cleanString(eventData.timeText) || cleanString(eventData.time);
}

function eventLocationLine(eventData: Record<string, unknown>) {
  const venue = cleanString(eventData.venue);
  const location = cleanString(eventData.location) || cleanString(eventData.address);
  if (venue && location && venue !== location) return `${venue}, ${location}`;
  return venue || location || "Location pending";
}

function copyAssetText(asset: EventAsset) {
  const content = asset.content || {};
  const value =
    cleanString(content.message) ||
    cleanString(content.body) ||
    cleanString(content.headline) ||
    cleanString(content.title) ||
    asset.title;
  return navigator.clipboard.writeText(value);
}

export default function EventManageClient({
  eventId,
  initialTitle,
  initialData,
  initialAssets,
  eventHref,
}: EventManageClientProps) {
  const [title, setTitle] = useState(initialTitle);
  const [eventData, setEventData] = useState(initialData);
  const [assets, setAssets] = useState<EventAsset[]>(initialAssets);
  const [activeTab, setActiveTab] = useState<ManageTab>("live-card");
  const [messages, setMessages] = useState<ChatMessage[]>([
    newMessage("assistant", "I can refine this live card and create matching event assets."),
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingRsvp, setIsLoadingRsvp] = useState(false);
  const [rsvpSummary, setRsvpSummary] = useState<RsvpSummary>({
    stats: { yes: 0, no: 0, maybe: 0 },
    numberOfGuests: 0,
    remaining: 0,
    filled: 0,
    responses: [],
  });
  const [error, setError] = useState<string | null>(null);

  const headline = eventHeadline(eventData, title);
  const subheadline = eventSubheadline(eventData);
  const body = eventBody(eventData, title);
  const dateLine = eventDateLine(eventData);
  const timeLine = eventTimeLine(eventData);
  const locationLine = eventLocationLine(eventData);
  const assetCount = assets.length;
  const totalInvites = Math.max(rsvpSummary.numberOfGuests, rsvpSummary.filled);

  const missingDetails = useMemo(() => {
    const missing: string[] = [];
    if (
      !cleanString(eventData.startAt) &&
      !cleanString(eventData.startISO) &&
      !cleanString(eventData.date)
    ) {
      missing.push("Date");
    }
    if (!cleanString(eventData.location) && !cleanString(eventData.venue)) {
      missing.push("Location");
    }
    if (!eventData.rsvpEnabled && !eventData.rsvp) missing.push("RSVP");
    return missing;
  }, [eventData]);

  useEffect(() => {
    let cancelled = false;
    async function loadRsvp() {
      setIsLoadingRsvp(true);
      try {
        const response = await fetch(`/api/events/${eventId}/rsvp`, {
          credentials: "include",
        });
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.ok || cancelled) return;
        setRsvpSummary({
          stats: {
            yes: Number(json.stats?.yes) || 0,
            no: Number(json.stats?.no) || 0,
            maybe: Number(json.stats?.maybe) || 0,
          },
          numberOfGuests: Number(json.numberOfGuests) || 0,
          remaining: Number(json.remaining) || 0,
          filled: Number(json.filled) || 0,
          responses: Array.isArray(json.responses) ? json.responses : [],
        });
      } finally {
        if (!cancelled) setIsLoadingRsvp(false);
      }
    }

    void loadRsvp();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function sendAssistantMessage(message: string) {
    const text = message.trim();
    if (!text) return;
    setInput("");
    setError(null);
    setIsSending(true);
    setMessages((prev) => [...prev, newMessage("user", text)]);
    try {
      const response = await fetch(`/api/concierge/events/${eventId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text }),
      });
      const json = (await response
        .json()
        .catch(() => null)) as ConciergeEventMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Assistant request failed.");
      }
      setTitle(json.event.title);
      setEventData(json.event.data);
      setAssets(json.assets);
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assistant request failed.");
    } finally {
      setIsSending(false);
    }
  }

  async function createAsset(assetType: EventAssetType) {
    await sendAssistantMessage(`Create a ${assetTypeLabel(assetType)} version.`);
    setActiveTab("assets");
  }

  async function deleteAsset(assetId: string) {
    const response = await fetch(`/api/events/${eventId}/assets/${assetId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendAssistantMessage(input);
  }

  const assistantPanel = (
    <aside className="flex min-h-[34rem] flex-col overflow-hidden rounded-[1.4rem] border border-[#eadfff] bg-white shadow-sm">
      <div className="border-b border-[#eadfff] px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#2d1b36]">
          <MessageCircle className="size-4 text-[#7c4dff]" aria-hidden="true" />
          Assistant
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                  message.role === "user"
                    ? "rounded-tr-md bg-[#7c4dff] text-white"
                    : "rounded-tl-md border border-[#eadfff] bg-[#fbf9ff] text-[#2d1b36]"
                }`}
              >
                {message.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isSending ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#eadfff] bg-[#fbf9ff] px-3.5 py-2 text-sm text-[#6f6286]">
            <Loader2 className="size-4 animate-spin text-[#7c4dff]" aria-hidden="true" />
            Updating event
          </div>
        ) : null}
      </div>
      <div className="border-t border-[#eadfff] px-5 py-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {["Refine the live card", "Add RSVP by April 10", "Create a WhatsApp version"].map(
            (chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void sendAssistantMessage(chip)}
                className="rounded-full bg-[#f4efff] px-3 py-1.5 text-xs font-semibold text-[#5f5289] transition hover:bg-[#eadfff]"
              >
                {chip}
              </button>
            ),
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder="Ask for changes or assets"
            className="h-11 min-w-0 flex-1 rounded-full border border-[#d8caff] px-4 text-sm text-[#161129] outline-none focus:border-[#7c4dff]"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[#2d1b36] text-white transition hover:bg-[#3b2946] disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Send"
            title="Send"
          >
            <ArrowUp className="size-5" aria-hidden="true" />
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </aside>
  );

  return (
    <main className="min-h-screen bg-transparent text-[#161129]">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-6">
        <header className="mb-5 flex flex-col gap-4 rounded-[1.4rem] border border-[#eadfff] bg-white/86 px-5 py-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b7aaa]">
              Manage live card
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[#2d1b36]">
              {headline}
            </h1>
            <p className="mt-1 text-sm text-[#6f6286]">
              {[dateLine, timeLine].filter(Boolean).join(" at ")} - {locationLine}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={eventHref}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d8caff] bg-white px-4 text-sm font-semibold text-[#4b3c79] transition hover:bg-[#f7f3ff]"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Public event
            </Link>
            <button
              type="button"
              onClick={() =>
                void navigator.clipboard.writeText(
                  new URL(eventHref, window.location.origin).toString(),
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2d1b36] px-4 text-sm font-semibold text-white transition hover:bg-[#3b2946]"
            >
              <Copy className="size-4" aria-hidden="true" />
              Share
            </button>
          </div>
        </header>

        <div
          className="mb-5 overflow-x-auto rounded-[1.2rem] border border-[#eadfff] bg-white/86 p-1 shadow-sm backdrop-blur"
          role="tablist"
          aria-label="Event tools sections"
        >
          <div className="flex min-w-max gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
                    activeTab === tab.key
                      ? "bg-[#2d1b36] text-white"
                      : "text-[#6f6286] hover:bg-[#f4efff] hover:text-[#2d1b36]"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="min-h-[34rem] rounded-[1.4rem] border border-[#eadfff] bg-white/86 p-5 shadow-sm backdrop-blur">
            {activeTab === "live-card" ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
                <div className="overflow-hidden rounded-[1.35rem] border border-[#eadfff] bg-white shadow-[0_22px_65px_rgba(68,43,112,0.08)]">
                  <div className="flex min-h-[34rem] items-center justify-center bg-[#f5f0ff] p-6 sm:p-10">
                    <div className="flex aspect-[4/5] w-full max-w-md flex-col items-center justify-center border border-[#eadfff] bg-white px-8 py-10 text-center shadow-2xl shadow-[#3f275f]/10">
                      <Sparkles className="mb-5 size-7 text-[#7c4dff]" aria-hidden="true" />
                      <h2 className="text-4xl font-semibold tracking-normal text-[#2d1b36]">
                        {headline}
                      </h2>
                      <p className="mt-3 text-lg italic text-[#6f5b86]">{subheadline}</p>
                      <div className="my-7 h-px w-14 bg-[#ded2ff]" />
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a6c99]">
                        {[dateLine, timeLine].filter(Boolean).join(" at ")}
                      </p>
                      <p className="mt-3 text-sm font-medium text-[#5b4a72]">{locationLine}</p>
                      <p className="mt-6 max-w-sm text-sm leading-6 text-[#6f6286]">{body}</p>
                      <Link
                        href={eventHref}
                        className="mt-8 inline-flex h-10 items-center rounded-sm bg-[#2d1b36] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#3b2946]"
                      >
                        RSVP
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eadfff] bg-white px-5 py-4">
                    <span className="text-sm font-semibold text-[#6f5b86]">Live Card Preview</span>
                    <button
                      type="button"
                      onClick={() => void createAsset("invitation")}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#7c4dff]"
                    >
                      {isSending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Sparkles className="size-4" aria-hidden="true" />
                      )}
                      Create invite asset
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                    {[
                      {
                        icon: CalendarDays,
                        label: "Details",
                        value: missingDetails.length ? `${missingDetails.length} missing` : "Ready",
                      },
                      { icon: FileText, label: "Assets", value: `${assetCount} outputs` },
                      { icon: Users, label: "Guests", value: `${rsvpSummary.filled} replies` },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="rounded-[1.2rem] border border-[#eadfff] bg-white p-5 shadow-sm"
                        >
                          <Icon className="mb-3 size-5 text-[#7c4dff]" aria-hidden="true" />
                          <p className="text-sm font-bold text-[#2d1b36]">{item.label}</p>
                          <p className="mt-1 text-sm text-[#6f6286]">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-[1.35rem] border border-[#eadfff] bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                        <Sparkles className="size-4" aria-hidden="true" />
                      </span>
                      <h3 className="text-sm font-bold text-[#2d1b36]">AI Recommendations</h3>
                    </div>
                    <div className="space-y-2">
                      {(missingDetails.length
                        ? missingDetails.slice(0, 3).map((field) => `Add ${field}`)
                        : ["Create a WhatsApp version", "Add RSVP details", "Refine the live card"]
                      ).map((recommendation) => (
                        <button
                          key={recommendation}
                          type="button"
                          onClick={() => void sendAssistantMessage(recommendation)}
                          className="w-full rounded-2xl bg-[#f7f3ff] px-4 py-3 text-left text-sm font-semibold text-[#2d1b36] transition hover:bg-[#eee6ff]"
                        >
                          {recommendation}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={eventHref}
                    className="inline-flex h-13 w-full items-center justify-center rounded-[1.35rem] bg-[#2d1b36] px-5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-xl shadow-[#2d1b36]/15 transition hover:bg-[#3b2946]"
                  >
                    Open Public Event
                  </Link>
                </div>
              </div>
            ) : null}

            {activeTab === "guests" ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      label: "Invites Sent",
                      value: totalInvites,
                      sub: totalInvites ? "Tracked guests" : "No guest cap set",
                    },
                    { label: "Attending", value: rsvpSummary.stats.yes, sub: "Confirmed" },
                    { label: "Pending", value: rsvpSummary.remaining, sub: "Awaiting replies" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[1.2rem] border border-[#eadfff] bg-white p-5 shadow-sm"
                    >
                      <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#8b7aaa]">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-[#2d1b36]">{stat.value}</p>
                      <p className="mt-1 text-xs text-[#7a6c99]">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-[1.35rem] border border-[#eadfff] bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfff] px-5 py-4">
                    <h2 className="text-sm font-bold text-[#2d1b36]">RSVP Management</h2>
                    <button
                      type="button"
                      onClick={() =>
                        void sendAssistantMessage(
                          "Add RSVP details and create a matching RSVP page.",
                        )
                      }
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-[#f4efff] px-3 text-sm font-bold text-[#7c4dff] transition hover:bg-[#eadfff]"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Add RSVP
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[42rem] text-left">
                      <thead className="bg-[#fbf9ff]">
                        <tr>
                          <th className="px-5 py-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8b7aaa]">
                            Guest
                          </th>
                          <th className="px-5 py-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8b7aaa]">
                            Email Address
                          </th>
                          <th className="px-5 py-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8b7aaa]">
                            RSVP
                          </th>
                          <th className="px-5 py-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8b7aaa]">
                            Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eadfff]">
                        {rsvpSummary.responses.length ? (
                          rsvpSummary.responses.map((item, index) => (
                            <tr key={`${item.email || item.name || "guest"}-${index}`}>
                              <td className="px-5 py-4 text-sm font-semibold text-[#2d1b36]">
                                {cleanString(item.name) || "Guest"}
                              </td>
                              <td className="px-5 py-4 text-sm text-[#6f6286]">
                                {cleanString(item.email) || "-"}
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${responseClassName(item.response)}`}
                                >
                                  {formatResponse(item.response)}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm text-[#8b7aaa]">
                                {relativeTime(item.updatedAt || item.createdAt) || "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-5 py-12 text-center text-sm text-[#7a6c99]"
                            >
                              {isLoadingRsvp ? "Loading RSVPs..." : "No RSVP responses yet."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "assets" ? (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {QUICK_ASSETS.map((asset) => (
                    <button
                      key={asset.type}
                      type="button"
                      onClick={() => void createAsset(asset.type)}
                      className="rounded-[1.2rem] border border-[#eadfff] bg-white p-4 text-left shadow-sm transition hover:border-[#cbbdff] hover:bg-[#fbf9ff]"
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-[#2d1b36]">
                        <Plus className="size-4 text-[#7c4dff]" aria-hidden="true" />
                        {asset.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#7a6c99]">
                        {asset.description}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {assets.length ? (
                    assets.map((asset) => (
                      <article
                        key={asset.id}
                        className="rounded-[1.2rem] border border-[#eadfff] bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8b7aaa]">
                              {assetTypeLabel(asset.asset_type)}
                            </p>
                            <h3 className="mt-1 text-base font-semibold text-[#2d1b36]">
                              {asset.title}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => void deleteAsset(asset.id)}
                            className="grid size-8 place-items-center rounded-full text-[#8b7aaa] transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Delete asset"
                            title="Delete"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6f6286]">
                          {cleanString(asset.content.message) ||
                            cleanString(asset.content.body) ||
                            cleanString(asset.content.headline) ||
                            "Draft asset"}
                        </p>
                        <button
                          type="button"
                          onClick={() => void copyAssetText(asset)}
                          className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-[#f4efff] px-3 text-sm font-semibold text-[#5f5289]"
                        >
                          <Copy className="size-4" aria-hidden="true" />
                          Copy text
                        </button>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-[#7a6c99]">No generated assets yet.</p>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === "assistant" ? assistantPanel : null}

            {activeTab === "details" ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b7aaa]">
                      Details
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[#2d1b36]">
                      Event details for the live card
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => void sendAssistantMessage("Fill in missing event details.")}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-[#f4efff] px-3 text-sm font-bold text-[#7c4dff] transition hover:bg-[#eadfff]"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add details
                  </button>
                </div>

                <dl className="grid gap-3 text-sm md:grid-cols-2">
                  {[
                    { label: "Title", value: headline },
                    { label: "Date", value: dateLine },
                    { label: "Time", value: timeLine || "Time pending" },
                    { label: "Location", value: locationLine },
                    {
                      label: "RSVP",
                      value:
                        eventData.rsvpEnabled || eventData.rsvp ? "Enabled" : "Not enabled yet",
                    },
                    { label: "Category", value: cleanString(eventData.category) || "Event" },
                    { label: "Status", value: cleanString(eventData.status) || "draft" },
                    { label: "Assets", value: `${assetCount} outputs` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1.1rem] border border-[#eadfff] bg-white p-4"
                    >
                      <dt className="font-bold text-[#8b7aaa]">{item.label}</dt>
                      <dd className="mt-1 text-[#2d1b36]">{item.value}</dd>
                    </div>
                  ))}
                </dl>

                {missingDetails.length ? (
                  <div className="rounded-[1.2rem] border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                    Missing: {missingDetails.join(", ")}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <div className={activeTab === "assistant" ? "hidden" : ""}>{assistantPanel}</div>
        </div>
      </div>
    </main>
  );
}

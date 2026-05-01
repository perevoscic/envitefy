"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import type { ConciergeEventMessageResponse, EventAsset, EventAssetType } from "@/lib/concierge/types";

type WorkspaceTab =
  | "overview"
  | "invitation"
  | "rsvp"
  | "guests"
  | "assets"
  | "assistant"
  | "settings";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type EventWorkspaceClientProps = {
  eventId: string;
  initialTitle: string;
  initialData: Record<string, unknown>;
  initialAssets: EventAsset[];
  eventHref: string;
};

const TABS: Array<{ key: WorkspaceTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "invitation", label: "Invitation" },
  { key: "rsvp", label: "RSVP" },
  { key: "guests", label: "Guests" },
  { key: "assets", label: "Assets" },
  { key: "assistant", label: "Assistant" },
  { key: "settings", label: "Settings" },
];

const QUICK_ASSETS: Array<{ type: EventAssetType; label: string }> = [
  { type: "whatsapp", label: "WhatsApp" },
  { type: "instagram_story", label: "Story" },
  { type: "printable_flyer", label: "Flyer" },
  { type: "reminder_message", label: "Reminder" },
  { type: "thank_you_card", label: "Thank you" },
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

function assetTypeLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
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

export default function EventWorkspaceClient({
  eventId,
  initialTitle,
  initialData,
  initialAssets,
  eventHref,
}: EventWorkspaceClientProps) {
  const [title, setTitle] = useState(initialTitle);
  const [eventData, setEventData] = useState(initialData);
  const [assets, setAssets] = useState<EventAsset[]>(initialAssets);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [messages, setMessages] = useState<ChatMessage[]>([
    newMessage("assistant", "I can edit this event and create matching outputs."),
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missingDetails = useMemo(() => {
    const missing: string[] = [];
    if (!cleanString(eventData.startAt) && !cleanString(eventData.startISO) && !cleanString(eventData.date)) {
      missing.push("Date");
    }
    if (!cleanString(eventData.location) && !cleanString(eventData.venue)) {
      missing.push("Location");
    }
    if (!eventData.rsvpEnabled && !eventData.rsvp) missing.push("RSVP");
    return missing;
  }, [eventData]);

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
      const json = (await response.json().catch(() => null)) as ConciergeEventMessageResponse | null;
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

  const dateLine =
    cleanString(eventData.dateText) ||
    cleanString(eventData.startAt) ||
    cleanString(eventData.startISO) ||
    cleanString(eventData.date) ||
    "Date pending";
  const locationLine =
    [cleanString(eventData.venue), cleanString(eventData.location)]
      .filter(Boolean)
      .join(", ") || "Location pending";

  const assistantPanel = (
    <aside className="flex min-h-[32rem] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MessageCircle className="size-4" aria-hidden="true" />
          Event Assistant
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isSending ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Updating workspace
          </div>
        ) : null}
      </div>
      <div className="border-t border-slate-200 px-4 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {["Make it more elegant", "Add RSVP by April 10", "Create a WhatsApp version"].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => void sendAssistantMessage(chip)}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
            >
              {chip}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder="Ask for edits or outputs"
            className="h-11 min-w-0 flex-1 rounded-full border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-950 text-white disabled:opacity-45"
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
    <main className="min-h-screen bg-[#f7f5f0] text-slate-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-6">
        <header className="mb-5 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Event workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">{dateLine} · {locationLine}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={eventHref}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Preview
            </Link>
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(new URL(eventHref, window.location.origin).toString())}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Copy className="size-4" aria-hidden="true" />
              Share
            </button>
          </div>
        </header>

        <div className="mb-5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <div className="flex min-w-max gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`h-10 rounded-md px-3 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="min-h-[32rem] rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            {activeTab === "overview" ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-4">
                  <Sparkles className="mb-3 size-5 text-slate-500" aria-hidden="true" />
                  <h2 className="text-base font-semibold">Next actions</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {missingDetails.length ? `Missing: ${missingDetails.join(", ")}` : "Core event details are ready."}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <FileText className="mb-3 size-5 text-slate-500" aria-hidden="true" />
                  <h2 className="text-base font-semibold">Assets</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{assets.length} generated outputs in this workspace.</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <Users className="mb-3 size-5 text-slate-500" aria-hidden="true" />
                  <h2 className="text-base font-semibold">Guests</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">RSVP responses stay attached to this event.</p>
                </div>
              </div>
            ) : null}

            {activeTab === "invitation" ? (
              <div>
                <h2 className="text-lg font-semibold">Invitation</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Live card and invitation edits are applied to this event.</p>
                <button
                  type="button"
                  onClick={() => void createAsset("invitation")}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Generate invitation asset
                </button>
              </div>
            ) : null}

            {activeTab === "rsvp" ? (
              <div>
                <h2 className="text-lg font-semibold">RSVP</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Status: {eventData.rsvpEnabled || eventData.rsvp ? "Enabled" : "Not enabled yet"}
                </p>
                <button
                  type="button"
                  onClick={() => void sendAssistantMessage("Create a matching RSVP page for this event.")}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Create RSVP page
                </button>
              </div>
            ) : null}

            {activeTab === "guests" ? (
              <div>
                <h2 className="text-lg font-semibold">Guests</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Guest and RSVP tools connect to the existing event response system.</p>
              </div>
            ) : null}

            {activeTab === "assets" ? (
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {QUICK_ASSETS.map((asset) => (
                    <button
                      key={asset.type}
                      type="button"
                      onClick={() => void createAsset(asset.type)}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      {asset.label}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {assets.length ? (
                    assets.map((asset) => (
                      <article key={asset.id} className="rounded-lg border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{assetTypeLabel(asset.asset_type)}</p>
                            <h3 className="mt-1 text-base font-semibold">{asset.title}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => void deleteAsset(asset.id)}
                            className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete asset"
                            title="Delete"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                          {cleanString(asset.content.message) || cleanString(asset.content.body) || cleanString(asset.content.headline) || "Draft asset"}
                        </p>
                        <button
                          type="button"
                          onClick={() => void copyAssetText(asset)}
                          className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-700"
                        >
                          <Copy className="size-4" aria-hidden="true" />
                          Copy text
                        </button>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No generated assets yet.</p>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === "assistant" ? assistantPanel : null}

            {activeTab === "settings" ? (
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Settings className="size-5" aria-hidden="true" />
                  Settings
                </h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <dt className="font-semibold text-slate-500">Status</dt>
                    <dd className="mt-1 text-slate-900">{cleanString(eventData.status) || "draft"}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <dt className="font-semibold text-slate-500">Ownership</dt>
                    <dd className="mt-1 text-slate-900">{cleanString(eventData.ownership) || "owned"}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </section>

          <div className={activeTab === "assistant" ? "hidden" : ""}>{assistantPanel}</div>
        </div>
      </div>
    </main>
  );
}

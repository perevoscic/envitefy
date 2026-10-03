"use client";

import {
  CalendarDays,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  type LucideIcon,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  EventAsset,
  EventAssetType,
} from "@/lib/concierge/types";

type ManageTab = "live-card" | "details" | "assets" | "guests";

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
  const title = initialTitle;
  const eventData = initialData;
  const [assets, setAssets] = useState<EventAsset[]>(initialAssets);
  const [activeTab, setActiveTab] = useState<ManageTab>("live-card");
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

  async function createAsset(assetType: EventAssetType) {
    setError(null);
    setIsSending(true);
    try {
      const response = await fetch(`/api/events/${eventId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ assetType }),
      });
      const json = (await response.json()) as { asset?: EventAsset; error?: string };
      const asset = json.asset;
      if (!response.ok || !asset) throw new Error(json.error || "Unable to create asset.");
      setAssets(current => [asset, ...current]);
      setActiveTab("assets");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create asset.");
    } finally {
      setIsSending(false);
    }
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

  return (
    <main className="min-h-screen bg-transparent text-[#161129]">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
        <header className="mb-5 flex flex-col gap-4 rounded-[1.4rem] border border-[#eadfff] bg-white/86 px-5 py-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b7aaa]">
              Live card tools
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[#2d1b36]">
              {headline}
            </h1>
            <p className="mt-1 text-sm text-[#6f6286]">
              {[dateLine, timeLine].filter(Boolean).join(" at ")} - {locationLine}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link
              href={eventHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d8caff] bg-white px-4 text-sm font-semibold text-[#4b3c79] transition hover:bg-[#f7f3ff]"
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2d1b36] px-4 text-sm font-semibold text-white transition hover:bg-[#3b2946]"
            >
              <Copy className="size-4" aria-hidden="true" />
              Share
            </button>
          </div>
        </header>

        <div
          className="mb-5 rounded-[1.2rem] border border-[#eadfff] bg-white/86 p-1 shadow-sm backdrop-blur"
          role="tablist"
          aria-label="Event tools sections"
        >
          <div className="grid grid-cols-2 gap-1 sm:flex">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition sm:justify-start ${
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

        {error ? <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
        <div className="grid gap-5">
          <section className="min-h-[26rem] min-w-0 rounded-[1.4rem] border border-[#eadfff] bg-white/86 p-3 shadow-sm backdrop-blur sm:min-h-[34rem] sm:p-5">
            {activeTab === "live-card" ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
                <div className="overflow-hidden rounded-[1.35rem] border border-[#eadfff] bg-white shadow-[0_22px_65px_rgba(68,43,112,0.08)]">
                  <div className="flex min-h-[26rem] items-center justify-center bg-[#f5f0ff] p-3 sm:min-h-[34rem] sm:p-10">
                    <div className="flex aspect-[4/5] w-full max-w-md flex-col items-center justify-center border border-[#eadfff] bg-white px-5 py-8 text-center shadow-2xl shadow-[#3f275f]/10 sm:px-8 sm:py-10">
                      <Sparkles className="mb-5 size-7 text-[#7c4dff]" aria-hidden="true" />
                      <h2 className="text-2xl font-semibold tracking-normal text-[#2d1b36] sm:text-4xl">
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
                        className="mt-8 inline-flex min-h-11 items-center rounded-sm bg-[#2d1b36] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#3b2946]"
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
                      className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-[#7c4dff]"
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
                    <h2 className="text-sm font-bold text-[#2d1b36]">RSVP Dashboard</h2>
                  </div>
                  <div className="space-y-3 p-4 md:hidden" aria-live="polite">
                    {rsvpSummary.responses.length ? (
                      rsvpSummary.responses.map((item, index) => (
                        <article
                          key={`${item.email || item.name || "guest"}-mobile-${index}`}
                          className="rounded-2xl border border-[#eadfff] bg-[#fbf9ff] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-bold text-[#2d1b36]">
                                {cleanString(item.name) || "Guest"}
                              </h3>
                              <p className="mt-1 break-all text-sm text-[#6f6286]">
                                {cleanString(item.email) || "No email provided"}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${responseClassName(item.response)}`}
                            >
                              {formatResponse(item.response)}
                            </span>
                          </div>
                          <p className="mt-3 text-xs text-[#8b7aaa]">
                            Updated {relativeTime(item.updatedAt || item.createdAt) || "recently"}
                          </p>
                        </article>
                      ))
                    ) : (
                      <p className="py-8 text-center text-sm text-[#7a6c99]">
                        {isLoadingRsvp ? "Loading RSVPs..." : "No RSVP responses yet."}
                      </p>
                    )}
                  </div>
                  <div className="hidden md:block">
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
                            className="grid size-11 place-items-center rounded-full text-[#8b7aaa] transition hover:bg-rose-50 hover:text-rose-600"
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
                          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f4efff] px-4 text-sm font-semibold text-[#5f5289]"
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

        </div>
      </div>
    </main>
  );
}

"use client";

import {
  CalendarDays,
  CheckCircle2,
  CloudSun,
  Copy,
  ExternalLink,
  Gift,
  LayoutDashboard,
  Loader2,
  MapPin,
  Pencil,
  Share2,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type {
  ConciergeEventDraft,
  ConciergeWeatherContext,
  RequestedOutput,
} from "@/lib/concierge/types";
import type { ChatPreviewSummary } from "./chat-preview-adapters";

type RsvpPreviewBadge = {
  count: number;
  isLoading: boolean;
  error: string | null;
};

type ChatProductPreviewProps = {
  draft: ConciergeEventDraft | null;
  summary: ChatPreviewSummary;
  selectedOutput: RequestedOutput;
  previewImageUrl: string;
  isGenerating: boolean;
  buildProgress: number;
  currentBuildStep: string;
  liveEventId: string | null;
  publicHref: string | null;
  rsvpDashboardHref: string | null;
  hasDraftProduct: boolean;
  isReceivedInviteDraft?: boolean;
  publishActionLabel?: string;
  publishBusyLabel?: string;
  skinLabel: string | null;
  isPublishing: boolean;
  onPublish: () => void;
  onEdit: () => void;
  rsvp: RsvpPreviewBadge;
  weatherContext: ConciergeWeatherContext | null;
  mobileView: "chat" | "preview";
};

function cleanPreviewText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function previewBodyText(draft: ConciergeEventDraft | null, summary: ChatPreviewSummary) {
  return (
    cleanPreviewText(draft?.previewCopy.body) ||
    cleanPreviewText(draft?.eventPurpose) ||
    summary.subheadline ||
    "Details coming together"
  );
}

function previewCategoryText(draft: ConciergeEventDraft | null) {
  const raw = cleanPreviewText(draft?.eventType);
  if (!raw || raw === "unknown") return "Celebration";
  if (raw === "baby_shower") return "Baby Shower";
  if (raw === "gender_reveal") return "Gender Reveal";
  if (raw === "bridal_shower") return "Bridal Shower";
  if (["gym_meet", "game_day", "football", "sport_event"].includes(raw)) return "Game Day";
  if (raw === "field_trip") return "Field Trip/Day";
  if (raw === "open_house") return "Open House";
  if (raw === "smart_signup") return "Smart Sign-up";
  return raw
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function publicActionLabelForOutput(selectedOutput: RequestedOutput) {
  if (selectedOutput === "live_card") return "Open Live Card";
  if (selectedOutput === "event_page") return "Open Event Page";
  if (selectedOutput === "signup_form") return "Open Sign-up";
  if (selectedOutput === "digital_flyer" || selectedOutput === "printable_flyer") {
    return "Open Flyer/Invitation";
  }
  if (selectedOutput === "invitation") return "Open Flyer/Invitation";
  return "Open Product";
}

function outputLabelForPanel(selectedOutput: RequestedOutput) {
  if (selectedOutput === "live_card") return "Live card";
  if (selectedOutput === "event_page") return "Event page";
  if (selectedOutput === "signup_form") return "Smart sign-up";
  if (selectedOutput === "digital_flyer" || selectedOutput === "printable_flyer") {
    return "Flyer/invitation";
  }
  if (selectedOutput === "invitation") return "Flyer/invitation";
  return "Event product";
}

function previewProcessStatusText({
  hasDraftProduct,
  publicHref,
  isReceivedInviteDraft,
}: {
  hasDraftProduct: boolean;
  publicHref: string | null;
  isReceivedInviteDraft?: boolean;
}) {
  if (publicHref && isReceivedInviteDraft) {
    return "Saved invite: open the link to review it in Invited events.";
  }
  if (publicHref) return "Published preview: open the link to review what guests will see.";
  if (isReceivedInviteDraft && hasDraftProduct) {
    return "Received invite review: details are locked to the upload. Save it to Invited events when it looks right.";
  }
  return "Generated draft: review it here, then save/publish when ready.";
}

function rsvpStatusText({
  draft,
  rsvp,
}: {
  draft: ConciergeEventDraft | null;
  rsvp: RsvpPreviewBadge;
}) {
  if (rsvp.isLoading) return "Checking responses";
  if (rsvp.error) return "RSVP status unavailable";
  if (rsvp.count > 0) return `${rsvp.count} response${rsvp.count === 1 ? "" : "s"}`;
  if (draft?.rsvpEnabled === true) {
    return draft.numberOfGuests ? `Tracking up to ${draft.numberOfGuests} guests` : "RSVP is on";
  }
  return "RSVP is off";
}

function weatherStatusText(weatherContext: ConciergeWeatherContext | null) {
  if (!weatherContext) return "Forecast not checked";
  if (weatherContext.status === "available") {
    const temp = typeof weatherContext.tempF === "number" ? `${Math.round(weatherContext.tempF)}F` : "";
    return [weatherContext.summary, temp].filter(Boolean).join(" - ") || "Forecast available";
  }
  return weatherContext.message || "Forecast unavailable";
}

type DetailRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-[#e6e1ee] bg-white/78 px-4 py-3 shadow-[0_10px_28px_rgba(35,24,72,0.06)]">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#f3effb] text-[#5c4cd5]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.64rem] font-black uppercase tracking-[0.16em] text-[#8a819b]">
          {label}
        </span>
        <span className="mt-1 block break-words text-sm font-bold leading-5 text-[#24183e]">
          {value}
        </span>
      </span>
    </div>
  );
}

export default function ChatProductPreview({
  draft,
  summary,
  selectedOutput,
  previewImageUrl,
  isGenerating,
  buildProgress,
  currentBuildStep,
  liveEventId,
  publicHref,
  rsvpDashboardHref,
  hasDraftProduct,
  isReceivedInviteDraft = false,
  publishActionLabel = "Save / Publish",
  publishBusyLabel = "Publishing...",
  isPublishing,
  onPublish,
  mobileView,
  skinLabel,
  rsvp,
  weatherContext,
  onEdit,
}: ChatProductPreviewProps) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const hasGeneratedProduct = Boolean(liveEventId || hasDraftProduct);
  const publicActionLabel = publicActionLabelForOutput(selectedOutput);
  const panelOutputLabel = outputLabelForPanel(selectedOutput);
  const previewProcessStatus = previewProcessStatusText({
    hasDraftProduct,
    publicHref,
    isReceivedInviteDraft,
  });
  const shouldShowDraftActions = hasDraftProduct && !publicHref;
  const hasShareAction = Boolean(publicHref);
  const body = previewBodyText(draft, summary);
  const category = previewCategoryText(draft);
  const registryLink = cleanPreviewText(draft?.registryLink || draft?.giftRegistryLink);

  async function handleShare() {
    if (!publicHref || typeof window === "undefined") return;
    const url = new URL(publicHref, window.location.origin).toString();
    const sharePayload = {
      title: summary.headline,
      text: body,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        window.prompt("Copy this link", url);
      }
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1600);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState("idle");
    }
  }

  return (
    <aside
      className={`min-h-0 flex-col overflow-hidden bg-[#f8f7fb]/96 backdrop-blur-xl md:static md:border-l md:border-[#e5dff0] md:bg-white/58 ${
        mobileView === "preview"
          ? "fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+3.25rem)] z-30 flex rounded-t-[1.75rem] shadow-[0_-24px_70px_rgba(35,24,72,0.18)] md:rounded-none md:shadow-none"
          : "hidden md:flex"
      }`}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6 md:pb-7 md:pt-6">
          <div className="mx-auto flex w-full max-w-[34rem] flex-col gap-4">
            <header className="rounded-[1.45rem] border border-white/80 bg-white/78 p-4 shadow-[0_18px_52px_rgba(35,24,72,0.08)] ring-1 ring-[#f2eefb]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-7 items-center rounded-full bg-[#eaf8f2] px-3 text-[0.66rem] font-black uppercase tracking-[0.14em] text-[#167453]">
                      Draft ready
                    </span>
                    <span className="inline-flex h-7 max-w-full items-center rounded-full bg-[#f0eefb] px-3 text-[0.66rem] font-black uppercase tracking-[0.14em] text-[#5c4cd5]">
                      <span className="truncate">{panelOutputLabel}</span>
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-black leading-tight tracking-normal text-[#1f1735] sm:text-2xl">
                    {summary.headline}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#ded6ef] bg-white text-[#4f416a] shadow-sm transition hover:border-[#c9bbed] hover:text-[#5c5be5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
                  aria-label="Edit in chat"
                  title="Edit in chat"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#675b7b]">{body}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[0.68rem] font-black uppercase tracking-[0.13em] text-[#675b7b]">
                <span className="rounded-full bg-[#f6f2ea] px-3 py-1.5 text-[#81622d]">
                  {category}
                </span>
                {skinLabel ? (
                  <span className="rounded-full bg-[#eef6ff] px-3 py-1.5 text-[#2f6690]">
                    {skinLabel}
                  </span>
                ) : null}
                {registryLink ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0f5] px-3 py-1.5 text-[#9a4267]">
                    <Gift className="size-3" aria-hidden="true" />
                    Registry
                  </span>
                ) : null}
              </div>
            </header>

            <section className="relative overflow-hidden rounded-[1.55rem] border border-white/80 bg-white/78 p-3 shadow-[0_22px_60px_rgba(35,24,72,0.09)] ring-1 ring-[#edf0f7]">
              <div className="grid gap-4 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-[#eee8f6] shadow-[0_16px_36px_rgba(35,24,72,0.12)]">
                  <img
                    src={previewImageUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,15,35,0.08),rgba(20,15,35,0.48))]" />
                  <div className="absolute inset-x-3 bottom-3">
                    <p className="line-clamp-2 text-sm font-black leading-4 text-white drop-shadow">
                      {summary.headline}
                    </p>
                  </div>
                </div>
                {isGenerating ? (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-white/82 text-[#8b8298] backdrop-blur-[3px]">
                    <Loader2 className="size-10 animate-spin text-[#5c5be5]" aria-hidden="true" />
                    <div className="w-full max-w-[17rem] px-4 text-center">
                      <p className="text-sm font-bold text-[#2d1b36]">{currentBuildStep}</p>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eadfff]">
                        <div
                          className="h-full rounded-full bg-[#5c5be5] transition-[width] duration-300"
                          style={{ width: `${buildProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {hasGeneratedProduct ? (
                      <CheckCircle2 className="size-5 text-[#18956f]" aria-hidden="true" />
                    ) : null}
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-[#8a819b]">
                      Generated artwork
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#24183e]">
                    Visual is ready. Use the event details below as the source of truth before
                    saving or sharing.
                  </p>
                  <p className="mt-3 text-xs font-semibold leading-5 text-[#7a708b]">
                    Want different colors, layout, copy, or imagery? Tap Edit and tell the
                    concierge what to change.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-3">
              <DetailRow
                icon={<CalendarDays className="size-4" aria-hidden="true" />}
                label="When"
                value={summary.scheduleLine}
              />
              <DetailRow
                icon={<MapPin className="size-4" aria-hidden="true" />}
                label="Where"
                value={summary.locationLine}
              />
              <DetailRow
                icon={<Users className="size-4" aria-hidden="true" />}
                label="Guests"
                value={rsvpStatusText({ draft, rsvp })}
              />
              <DetailRow
                icon={<CloudSun className="size-4" aria-hidden="true" />}
                label="Weather"
                value={weatherStatusText(weatherContext)}
              />
            </section>

            <p className="px-2 text-center text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#5d5174]">
              {previewProcessStatus}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 z-40 border-t border-[#e6e1ee] bg-white/92 px-4 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-3 shadow-[0_-16px_44px_rgba(35,24,72,0.1)] backdrop-blur-xl sm:px-6 md:static md:pb-5">
          <div className="mx-auto grid w-full max-w-[34rem] grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border border-[#d8caff] bg-white px-4 text-sm font-black text-[#3b2468] shadow-sm transition hover:border-[#c2aef3] hover:bg-[#fbf9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
            >
              <Pencil className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Edit</span>
            </button>
            {publicHref ? (
              <a
                href={publicHref}
                className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-[#24183e] px-4 text-sm font-black text-white shadow-lg shadow-[#24183e]/20 transition hover:bg-[#180f2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
              >
                <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{publicActionLabel}</span>
              </a>
            ) : shouldShowDraftActions ? (
              <button
                type="button"
                onClick={onPublish}
                disabled={isPublishing}
                className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-[#24183e] px-4 text-sm font-black text-white shadow-lg shadow-[#24183e]/20 transition hover:bg-[#180f2d] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
              >
                {isPublishing ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">
                  {isPublishing ? publishBusyLabel : publishActionLabel}
                </span>
              </button>
            ) : (
              <span className="inline-flex h-12 min-w-0 items-center justify-center rounded-2xl border border-[#e4dff0] bg-[#f8f6fb] px-4 text-sm font-black text-[#8a819b]">
                Reviewing
              </span>
            )}
            {hasShareAction ? (
              <button
                type="button"
                onClick={() => void handleShare()}
                className="col-span-2 inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border border-[#d8caff] bg-[#fbf9ff] px-4 text-sm font-black text-[#3b2468] transition hover:border-[#c2aef3] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
              >
                {shareState === "copied" ? (
                  <Copy className="size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Share2 className="size-4 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">{shareState === "copied" ? "Link copied" : "Share"}</span>
              </button>
            ) : null}
            {rsvpDashboardHref ? (
              <a
                href={rsvpDashboardHref}
                className="col-span-2 inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border border-[#d8caff] bg-white px-4 text-sm font-black text-[#3b2468] transition hover:border-[#c2aef3] hover:bg-[#fbf9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
              >
                <LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Open Dashboard</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

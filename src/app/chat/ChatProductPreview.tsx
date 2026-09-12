"use client";

import {
  CalendarDays,
  CloudSun,
  Copy,
  ExternalLink,
  Expand,
  Gift,
  LayoutDashboard,
  Loader2,
  MapPin,
  Pencil,
  Share2,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import StudioShowcaseLiveCard from "@/components/studio/StudioShowcaseLiveCard";
import type {
  ConciergeEventDraft,
  ConciergeWeatherContext,
  RequestedOutput,
} from "@/lib/concierge/types";
import { buildChatShowcasePreview, type ChatPreviewSummary } from "./chat-preview-adapters";
import ScannedSchedule from "@/components/ScannedSchedule";
import EventPreviewViewport from "@/components/EventPreviewViewport";
import ArtworkPreviewDialog from "@/components/ArtworkPreviewDialog";

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
  artworkNotice?: string;
  isGenerating: boolean;
  hasStreamingPreview?: boolean;
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
  return "Draft preview: review the design here, then choose Publish when ready.";
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
    const temp =
      typeof weatherContext.tempF === "number" ? `${Math.round(weatherContext.tempF)}F` : "";
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
  artworkNotice,
  isGenerating,
  hasStreamingPreview = false,
  currentBuildStep,
  liveEventId,
  publicHref,
  rsvpDashboardHref,
  hasDraftProduct,
  isReceivedInviteDraft = false,
  publishActionLabel = "Publish",
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isEventPagePreview = selectedOutput === "event_page";
  const previewDialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!isPreviewOpen || !isEventPagePreview) return;
    const dialog = previewDialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isPreviewOpen, isEventPagePreview]);
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
  // Hosted drafts use the guest card controls; received invites retain their source review.
  const isLiveCard = selectedOutput === "live_card" && !isReceivedInviteDraft;
  const liveCardPreview = buildChatShowcasePreview({
    draft,
    summary,
    selectedOutput,
    imageUrl: previewImageUrl,
    sharePath: publicHref,
    eventId: liveEventId,
  });

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
      aria-label={`${panelOutputLabel} preview`}
      className={`min-h-0 min-w-0 flex-col overflow-hidden bg-[#f8f7fb]/96 backdrop-blur-xl lg:static lg:border-l lg:border-[#e5dff0] lg:bg-white/58 ${
        mobileView === "preview"
          ? "fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+3.25rem)] z-30 flex rounded-t-[1.75rem] shadow-[0_-24px_70px_rgba(35,24,72,0.18)] lg:rounded-none lg:shadow-none"
          : "hidden lg:flex"
      }`}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-5 pt-3 sm:px-6 lg:pt-6">
          <div className="mx-auto flex w-full max-w-[34rem] flex-col gap-3">
            {isEventPagePreview && draft?.scanSchedule ? <ScannedSchedule schedule={draft.scanSchedule} interactive={false} /> : null}
            {isLiveCard ? (
              <h2 className="sr-only">{summary.headline}</h2>
            ) : (
              <header className="rounded-[1.45rem] border border-white/80 bg-white/78 p-3 shadow-[0_18px_52px_rgba(35,24,72,0.08)] ring-1 ring-[#f2eefb]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-7 items-center rounded-full bg-[#eaf8f2] px-3 text-[0.66rem] font-black uppercase tracking-[0.14em] text-[#167453]">
                        {isGenerating
                          ? "Building preview"
                          : publicHref
                            ? "Published"
                            : hasGeneratedProduct
                              ? "Draft ready"
                              : "Draft"}
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
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#ded6ef] bg-white text-[#4f416a] shadow-sm transition hover:border-[#c9bbed] hover:text-[#5c5be5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
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
            )}

            {isLiveCard ? (
              <section aria-label="Interactive guest preview" className="relative">
                <div
                  className="mx-auto w-full max-w-[min(100%,max(16rem,calc((100svh-16rem)*2/3)))] lg:max-w-full"
                  inert={isGenerating}
                >
                  <StudioShowcaseLiveCard
                    preview={liveCardPreview}
                    previewMode
                    imageLoading="eager"
                    className="!rounded-[1.5rem]"
                  />
                </div>
                {isGenerating ? (
                  <div
                    role="status"
                    className={hasStreamingPreview
                      ? "mt-3 flex items-center justify-center gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-sm font-bold text-[#3b2468]"
                      : "absolute inset-0 flex items-center justify-center gap-3 rounded-[1.5rem] bg-white/85 p-6 text-sm font-bold text-[#3b2468] backdrop-blur-sm"}
                  >
                    <Loader2
                      className="size-6 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    {currentBuildStep}
                  </div>
                ) : null}
                <p className="mt-2 text-center text-xs leading-5 text-[#5d5174]">
                  Tap the card buttons to try the guest experience.
                </p>
              </section>
            ) : (
              <section aria-label="Invitation artwork" className="relative overflow-hidden rounded-[1.5rem] bg-white shadow-[0_22px_60px_rgba(35,24,72,0.12)]">
                <img
                  src={previewImageUrl}
                  alt={summary.headline}
                  className="block h-auto w-full object-contain"
                />
                {isGenerating ? (
                  <div role="status" className={hasStreamingPreview
                    ? "flex items-center justify-center gap-3 bg-violet-50 p-4 text-[#3b2468]"
                    : "absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/85 p-6 text-[#3b2468] backdrop-blur-sm"}>
                    <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <p className="text-sm font-bold">{currentBuildStep}</p>
                  </div>
                ) : null}
              </section>
            )}

            {artworkNotice ? <p role="status" className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">{artworkNotice}</p> : null}
            <section className="grid gap-3" aria-label="Saved event details">
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

            <p className="px-2 text-center text-xs leading-5 text-[#5d5174]">
              {previewProcessStatus}
            </p>
          </div>
        </div>

        <div className="z-40 shrink-0 border-t border-[#e6e1ee] bg-white/92 px-4 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-3 shadow-[0_-16px_44px_rgba(35,24,72,0.1)] backdrop-blur-xl sm:px-6">
          <div className="mx-auto grid w-full max-w-[34rem] grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              disabled={isGenerating || !hasGeneratedProduct}
              aria-haspopup="dialog"
              className="disabled:cursor-wait disabled:opacity-50 inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border border-[#d8caff] bg-white px-4 text-sm font-black text-[#3b2468] shadow-sm transition hover:border-[#c2aef3] hover:bg-[#fbf9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
            >
              <Expand className="size-4 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">Preview</span>
            </button>
            {publicHref ? (
              <a
                href={publicHref}
                className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-[#24183e] px-4 py-2 text-sm font-black text-white shadow-lg shadow-[#24183e]/20 transition hover:bg-[#180f2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
              >
                <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words text-center">{publicActionLabel}</span>
              </a>
            ) : shouldShowDraftActions ? (
              <button
                type="button"
                onClick={onPublish}
                disabled={isPublishing || isGenerating}
                className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-[#24183e] px-4 py-2 text-sm font-black text-white shadow-lg shadow-[#24183e]/20 transition hover:bg-[#180f2d] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
              >
                {isPublishing ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                )}
                <span className="min-w-0 break-words text-center">
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
                <span className="truncate">
                  {shareState === "copied" ? "Link copied" : "Share"}
                </span>
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
      {isEventPagePreview ? (
        <dialog
          ref={previewDialogRef}
          aria-label="Full-screen preview"
          onClose={() => setIsPreviewOpen(false)}
          className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-[#f8f7fb] p-0 text-[#24183e] backdrop:bg-[#24183e]/50"
        >
          {isPreviewOpen ? (
            <EventPreviewViewport title={summary.headline} onClose={() => setIsPreviewOpen(false)}>
              <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8f7fb] p-4">
                <img src={previewImageUrl} alt={summary.headline} className="max-h-[calc(100dvh-2rem)] max-w-full rounded-2xl object-contain" />
              </div>
            </EventPreviewViewport>
          ) : null}
        </dialog>
      ) : (
        <ArtworkPreviewDialog
          open={isPreviewOpen}
          title={`${summary.headline} preview`}
          aspectRatio={isLiveCard && liveCardPreview.invitationData.heroTextMode !== "image" ? 9 / 16 : 2 / 3}
          onClose={() => setIsPreviewOpen(false)}
        >
          {isLiveCard ? (
            <StudioShowcaseLiveCard
              preview={liveCardPreview}
              previewMode
              imageLoading="eager"
              className="!rounded-[1.5rem]"
            />
          ) : (
            <img src={previewImageUrl} alt={summary.headline} className="h-full max-h-full w-full rounded-2xl object-contain" />
          )}
        </ArtworkPreviewDialog>
      )}
    </aside>
  );
}

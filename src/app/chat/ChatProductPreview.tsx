"use client";

import {
  ExternalLink,
  FileImage,
  Gift,
  Globe2,
  LayoutDashboard,
  Loader2,
  Menu,
} from "lucide-react";
import StudioShowcaseLiveCard from "@/components/studio/StudioShowcaseLiveCard";
import type {
  ConciergeEventDraft,
  ConciergeWeatherContext,
  RequestedOutput,
} from "@/lib/concierge/types";
import { buildChatShowcasePreview, type ChatPreviewSummary } from "./chat-preview-adapters";

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
  isPublishing: boolean;
  onPublish: () => void;
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

function previewProcessStatusText({
  draft,
  hasDraftProduct,
  publicHref,
}: {
  draft: ConciergeEventDraft | null;
  hasDraftProduct: boolean;
  publicHref: string | null;
}) {
  if (publicHref) return "Published preview: open the link to review what guests will see.";
  if (hasDraftProduct) return "Generated draft: review it here, then save/publish when ready.";
  if (draft?.currentQuestion) return "Placeholder preview: not a final product yet.";
  return "Placeholder preview: generate when the details look ready.";
}

type OutputPreviewSurfaceProps = {
  draft: ConciergeEventDraft | null;
  summary: ChatPreviewSummary;
  selectedOutput: RequestedOutput;
  previewImageUrl: string;
  preview: ReturnType<typeof buildChatShowcasePreview>;
  hasGeneratedProduct: boolean;
};

function ChatFlyerInvitePreview({
  draft,
  summary,
  previewImageUrl,
}: Pick<OutputPreviewSurfaceProps, "draft" | "summary" | "previewImageUrl">) {
  const body = previewBodyText(draft, summary);
  const category = previewCategoryText(draft);

  return (
    <div
      role="img"
      aria-label="Flyer/invitation preview"
      className="relative h-full w-full overflow-hidden rounded-[2.2rem] border border-white/70 bg-[#fff9f0] shadow-[0_24px_70px_rgba(68,45,20,0.16)]"
    >
      <img
        src={previewImageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,18,28,0.18),rgba(255,248,239,0.1)_34%,rgba(255,248,239,0.95)_66%,#fffaf2)]" />
      <div className="absolute inset-x-5 top-5 flex items-center justify-between text-[0.56rem] font-black uppercase tracking-[0.2em] text-white drop-shadow">
        <span>{category}</span>
        <FileImage className="size-4" aria-hidden="true" />
      </div>
      <div className="absolute inset-x-5 bottom-5 rounded-[1.45rem] border border-white/74 bg-white/88 p-5 text-[#24183e] shadow-[0_18px_46px_rgba(64,40,18,0.16)] backdrop-blur-md">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-[#c1655a]">
          Flyer/Invitation
        </p>
        <h3 className="mt-2 line-clamp-3 font-serif text-3xl font-bold italic leading-[0.98] text-[#251724]">
          {summary.headline}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-5 text-[#6f5b55]">{body}</p>
        <div className="mt-4 grid grid-cols-1 gap-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#5f4b44]">
          <span className="truncate rounded-xl bg-[#fff1df] px-3 py-2">{summary.scheduleLine}</span>
          <span className="truncate rounded-xl bg-[#f2ecff] px-3 py-2">{summary.locationLine}</span>
        </div>
      </div>
    </div>
  );
}

function ChatEventPagePreview({
  draft,
  summary,
  previewImageUrl,
  hasGeneratedProduct,
}: Pick<
  OutputPreviewSurfaceProps,
  "draft" | "summary" | "previewImageUrl" | "hasGeneratedProduct"
>) {
  const body = previewBodyText(draft, summary);
  const category = previewCategoryText(draft);
  const hasRsvp = draft?.rsvpEnabled === true;
  const hasRegistry = Boolean(draft?.registryLink || draft?.giftRegistryLink);

  return (
    <div
      role="img"
      aria-label="Event page preview"
      className="relative h-full w-full overflow-hidden rounded-[2.2rem] border border-[#dfe5f2] bg-[#f8fbff] shadow-[0_24px_70px_rgba(21,36,68,0.16)]"
    >
      <div className="flex h-9 items-center gap-1.5 border-b border-[#e5ebf5] bg-white/90 px-4">
        <span className="size-2 rounded-full bg-[#ff7a7a]" />
        <span className="size-2 rounded-full bg-[#ffd36a]" />
        <span className="size-2 rounded-full bg-[#69d18f]" />
        <span className="ml-2 truncate text-[0.56rem] font-bold uppercase tracking-[0.14em] text-[#8a94aa]">
          envitefy.com/event
        </span>
      </div>
      <div className="h-[calc(100%-2.25rem)] overflow-hidden">
        <div className="flex h-10 items-center justify-between border-b border-[#e5ebf5] bg-white px-4">
          <span className="truncate text-[0.58rem] font-black uppercase tracking-[0.18em] text-[#5d4b82]">
            {category}
          </span>
          <div className="flex items-center gap-2 text-[0.56rem] font-black uppercase tracking-[0.12em] text-[#73809a]">
            <span>Details</span>
            {hasRsvp ? <span>RSVP</span> : null}
            {hasRegistry ? <Gift className="size-3" aria-hidden="true" /> : null}
            <Menu className="size-3.5" aria-hidden="true" />
          </div>
        </div>
        <div className="relative h-40 overflow-hidden">
          <img
            src={previewImageUrl}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,24,42,0.18),rgba(20,24,42,0.58))]" />
          <div className="absolute inset-x-5 bottom-5 text-white">
            <div className="mb-3 flex items-center justify-end">
              <Globe2 className="size-4" aria-hidden="true" />
            </div>
            <h3 className="line-clamp-3 font-serif text-3xl font-bold italic leading-[0.96]">
              {summary.headline}
            </h3>
          </div>
        </div>
        <div className="space-y-4 p-5 text-[#253049]">
          <p className="line-clamp-4 text-sm leading-6 text-[#647087]">{body}</p>
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-2xl border border-[#e7edf6] bg-white p-4 shadow-sm">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-[#8a94aa]">
                When
              </p>
              <p className="mt-1 truncate text-sm font-bold">{summary.scheduleLine}</p>
            </div>
            <div className="rounded-2xl border border-[#e7edf6] bg-white p-4 shadow-sm">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-[#8a94aa]">
                Where
              </p>
              <p className="mt-1 truncate text-sm font-bold">{summary.locationLine}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-[#24183e] p-4 text-white">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-white/64">
              {hasGeneratedProduct ? "Guest actions" : "RSVP"}
            </p>
            {hasRsvp ? (
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {["Yes", "No", "Maybe"].map((choice) => (
                  <span
                    key={choice}
                    className="rounded-lg bg-white/12 px-2 py-2 text-center text-[0.58rem] font-black uppercase tracking-[0.12em]"
                  >
                    {choice}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-bold">{draft?.previewCopy.cta || "View details"}</p>
            )}
            {hasRegistry ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[0.62rem] font-black uppercase tracking-[0.14em]">
                <Gift className="size-3" aria-hidden="true" />
                Registry
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatOutputPreviewSurface({
  draft,
  summary,
  selectedOutput,
  previewImageUrl,
  preview,
  hasGeneratedProduct,
}: OutputPreviewSurfaceProps) {
  if (
    selectedOutput === "digital_flyer" ||
    selectedOutput === "printable_flyer" ||
    selectedOutput === "invitation"
  ) {
    return (
      <ChatFlyerInvitePreview draft={draft} summary={summary} previewImageUrl={previewImageUrl} />
    );
  }

  if (selectedOutput === "event_page") {
    return (
      <ChatEventPagePreview
        draft={draft}
        summary={summary}
        previewImageUrl={previewImageUrl}
        hasGeneratedProduct={hasGeneratedProduct}
      />
    );
  }

  return (
    <StudioShowcaseLiveCard
      preview={preview}
      compactChrome
      buttonChromeSize="compact"
      interactive={hasGeneratedProduct}
      imageLoading="eager"
      imageFetchPriority="high"
      className="h-full w-full rounded-[2.2rem] !border-transparent"
    />
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
  isPublishing,
  onPublish,
  mobileView,
}: ChatProductPreviewProps) {
  const preview = buildChatShowcasePreview({
    draft,
    summary,
    selectedOutput,
    imageUrl: previewImageUrl,
    sharePath: publicHref,
    eventId: liveEventId,
  });
  const hasGeneratedProduct = Boolean(liveEventId || hasDraftProduct);
  const publicActionLabel = publicActionLabelForOutput(selectedOutput);
  const previewProcessStatus = previewProcessStatusText({
    draft,
    hasDraftProduct,
    publicHref,
  });
  const shouldShowDraftActions = hasDraftProduct && !publicHref;

  return (
    <aside
      className={`min-h-0 flex-col overflow-y-auto bg-white/48 backdrop-blur-sm md:border-l md:border-[#e5dff0] ${
        mobileView === "preview" ? "flex" : "hidden md:flex"
      }`}
    >
      <div className="flex h-full min-h-0 flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:px-6 sm:pb-8">
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 overflow-visible pb-2 pt-20 sm:pb-4 sm:pt-24">
          <section className="relative mx-auto flex w-full flex-none items-center justify-center">
            <div className="relative aspect-[9/17] h-[min(34rem,calc(100dvh-12rem))] max-w-full w-auto sm:aspect-[9/16] sm:h-[min(36rem,calc(100dvh-12rem))]">
              {isGenerating ? (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 rounded-[2.2rem] bg-white/78 text-[#8b8298] backdrop-blur-[3px]">
                  <Loader2 className="size-11 animate-spin text-[#5c5be5]" aria-hidden="true" />
                  <div className="w-full max-w-[18rem] px-4 text-center">
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
              <ChatOutputPreviewSurface
                draft={draft}
                summary={summary}
                selectedOutput={selectedOutput}
                previewImageUrl={previewImageUrl}
                preview={preview}
                hasGeneratedProduct={hasGeneratedProduct}
              />
            </div>
          </section>

          <div
            className={`flex shrink-0 flex-col items-center pb-1 ${
              publicHref || shouldShowDraftActions
                ? "min-h-[5.5rem] justify-start sm:min-h-[5.75rem]"
                : "min-h-[4.75rem] justify-end"
            }`}
          >
            {publicHref ? (
              <div className="flex w-full flex-wrap items-center justify-center gap-2">
                <a
                  href={publicHref}
                  className="inline-flex h-12 max-w-full items-center justify-center gap-2 rounded-2xl bg-[#3b2468] px-5 text-sm font-bold text-[#f6efff] shadow-lg shadow-[#3b2468]/20 transition hover:bg-[#2f1a55]"
                >
                  <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{publicActionLabel}</span>
                </a>
                {rsvpDashboardHref ? (
                  <a
                    href={rsvpDashboardHref}
                    className="inline-flex h-12 max-w-full items-center justify-center gap-2 rounded-2xl border border-[#d8caff] bg-white/82 px-5 text-sm font-bold text-[#3b2468] shadow-sm shadow-[#3b2468]/10 transition hover:border-[#c2aef3] hover:bg-white"
                  >
                    <LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">Open Dashboard</span>
                  </a>
                ) : null}
              </div>
            ) : null}
            {shouldShowDraftActions ? (
              <div className="flex w-full flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={isPublishing}
                  className="inline-flex h-12 max-w-full items-center justify-center gap-2 rounded-2xl bg-[#3b2468] px-5 text-sm font-bold text-[#f6efff] shadow-lg shadow-[#3b2468]/20 transition hover:bg-[#2f1a55] disabled:cursor-wait disabled:opacity-70"
                >
                  {isPublishing ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                  ) : (
                    <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate">
                    {isPublishing ? "Publishing..." : "Save / Publish"}
                  </span>
                </button>
              </div>
            ) : null}
            <p className="mt-3 max-w-full px-3 text-center text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#4f416a]">
              {previewProcessStatus}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

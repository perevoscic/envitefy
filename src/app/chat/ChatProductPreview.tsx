"use client";

import {
  Calendar,
  ChevronDown,
  ExternalLink,
  FileImage,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Umbrella,
  Users,
} from "lucide-react";
import { useState } from "react";
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
  rsvp: RsvpPreviewBadge;
  weatherContext: ConciergeWeatherContext | null;
  mobileView: "chat" | "preview";
};

function detailToneClass(value: string, fallback: string) {
  return value === fallback ? "text-[#b7afc3]" : "text-[#62546f]";
}

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
  if (raw === "gym_meet") return "Game Day";
  return raw
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function publicActionLabelForOutput(selectedOutput: RequestedOutput) {
  if (selectedOutput === "live_card") return "Open Live Card";
  if (selectedOutput === "event_page") return "Open Event Page";
  return "View invite";
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
      aria-label="Flyer invite preview"
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
          Flyer Invite
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

function ChatInvitationPreview({
  draft,
  summary,
  previewImageUrl,
}: Pick<OutputPreviewSurfaceProps, "draft" | "summary" | "previewImageUrl">) {
  const body = previewBodyText(draft, summary);
  const category = previewCategoryText(draft);

  return (
    <div
      role="img"
      aria-label="Invitation preview"
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2.2rem] bg-[#f7f1ea] p-5 shadow-[0_24px_70px_rgba(61,44,30,0.14)]"
    >
      <img
        src={previewImageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-24"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.86),rgba(247,241,234,0.58)_36%,rgba(247,241,234,0.96)_100%)]" />
      <div className="relative flex h-full w-full flex-col items-center justify-between rounded-[1.7rem] border border-[#d7c7b6] bg-[#fffdf8]/92 px-6 py-8 text-center text-[#261b2d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)]">
        <div className="flex flex-col items-center gap-3">
          <Mail className="size-5 text-[#8b5f4e]" aria-hidden="true" />
          <p className="text-[0.62rem] font-black uppercase tracking-[0.28em] text-[#8b5f4e]">
            {category}
          </p>
        </div>
        <div className="max-w-full">
          <p className="mx-auto mb-5 h-px w-16 bg-[#d8c1ad]" />
          <h3 className="line-clamp-4 font-serif text-4xl font-bold italic leading-[0.96] text-[#221a35]">
            {summary.headline}
          </h3>
          <p className="mx-auto mt-5 max-w-[14rem] text-sm leading-6 text-[#6b5b61]">{body}</p>
          <p className="mx-auto mt-5 h-px w-16 bg-[#d8c1ad]" />
        </div>
        <div className="w-full space-y-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#7a6860]">
          <p className="truncate">{summary.scheduleLine}</p>
          <p className="truncate">{summary.locationLine}</p>
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
        <div className="relative h-48 overflow-hidden">
          <img
            src={previewImageUrl}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,24,42,0.18),rgba(20,24,42,0.58))]" />
          <div className="absolute inset-x-5 bottom-5 text-white">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-white/18 px-3 py-1 text-[0.56rem] font-black uppercase tracking-[0.2em] backdrop-blur">
                {category}
              </span>
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
            <p className="mt-2 text-sm font-bold">{draft?.previewCopy.cta || "RSVP"}</p>
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
  if (selectedOutput === "digital_flyer" || selectedOutput === "printable_flyer") {
    return (
      <ChatFlyerInvitePreview draft={draft} summary={summary} previewImageUrl={previewImageUrl} />
    );
  }

  if (selectedOutput === "invitation") {
    return (
      <ChatInvitationPreview draft={draft} summary={summary} previewImageUrl={previewImageUrl} />
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
      className="h-full w-full rounded-[2.2rem]"
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
  rsvp,
  weatherContext,
  mobileView,
}: ChatProductPreviewProps) {
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const preview = buildChatShowcasePreview({
    draft,
    summary,
    selectedOutput,
    imageUrl: previewImageUrl,
    sharePath: publicHref,
    eventId: liveEventId,
  });
  const hasGeneratedProduct = Boolean(liveEventId);
  const publicActionLabel = publicActionLabelForOutput(selectedOutput);
  const rsvpLabel = rsvp.isLoading
    ? "Loading responses"
    : rsvp.error
      ? "RSVPs unavailable"
      : `${rsvp.count} ${rsvp.count === 1 ? "response" : "responses"}`;

  return (
    <aside
      className={`min-h-0 flex-col overflow-y-auto border-l border-[#e5dff0] bg-white/48 backdrop-blur-sm ${
        mobileView === "preview" ? "flex" : "hidden md:flex"
      }`}
    >
      <div className="flex h-full min-h-0 flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:px-6 sm:pb-8">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-visible">
          <section className="relative z-40 shrink-0 overflow-visible rounded-[1.3rem] border border-[#eee8f6] bg-white p-4 shadow-sm">
            <button
              type="button"
              className="mb-0 flex w-full items-center justify-between gap-3 text-left md:pointer-events-none md:mb-3"
              aria-expanded={isMobileDetailsOpen}
              onClick={() => setIsMobileDetailsOpen((value) => !value)}
            >
              <span className="block min-w-0 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8b8298]">
                Details captured
              </span>
              <ChevronDown
                className={`size-5 shrink-0 text-[#8b8298] transition md:hidden ${
                  isMobileDetailsOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            <div
              className={`${
                isMobileDetailsOpen
                  ? "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 grid rounded-[1.3rem] border border-[#eee8f6] bg-white p-4 shadow-[0_18px_46px_rgba(38,28,55,0.16)]"
                  : "hidden"
              } gap-3 md:static md:mt-0 md:grid md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
            >
              <div
                className={`flex items-center gap-3 ${detailToneClass(summary.scheduleLine, "Date TBD")}`}
              >
                <span className="grid size-9 place-items-center rounded-lg bg-[#fff3e8] text-[#e5751f]">
                  <Calendar className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{summary.scheduleLine}</span>
              </div>
              <div
                className={`flex items-center gap-3 ${detailToneClass(summary.locationLine, "Location TBD")}`}
              >
                <span className="grid size-9 place-items-center rounded-lg bg-[#eaf3ff] text-[#3477d2]">
                  <MapPin className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{summary.locationLine}</span>
              </div>
              <div className="flex items-center gap-3 text-[#62546f]">
                <span className="grid size-9 place-items-center rounded-lg bg-[#f3ecff] text-[#7c4dff]">
                  <Users className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {hasGeneratedProduct ? rsvpLabel : "Guest list coming soon"}
                </span>
              </div>
              {weatherContext ? (
                <div className="flex items-center gap-3 text-[#62546f]">
                  <span className="grid size-9 place-items-center rounded-lg bg-[#eafaf4] text-[#197052]">
                    <Umbrella className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm leading-5">{weatherContext.message}</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="relative mx-auto flex w-full flex-none items-center justify-center">
            <div className="relative aspect-[9/16] w-full max-w-[22rem] sm:max-w-[23rem]">
              {isGenerating ? (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 rounded-[2.2rem] bg-white/78 text-[#8b8298] backdrop-blur-[3px]">
                  <Loader2 className="size-11 animate-spin text-[#7c4dff]" aria-hidden="true" />
                  <div className="w-full max-w-[18rem] px-4 text-center">
                    <p className="text-sm font-bold text-[#2d1b36]">{currentBuildStep}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eadfff]">
                      <div
                        className="h-full rounded-full bg-[#7c4dff] transition-[width] duration-300"
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
              publicHref
                ? "min-h-[5.5rem] justify-start sm:min-h-[5.75rem]"
                : "min-h-[4.75rem] justify-end"
            }`}
          >
            {publicHref ? (
              <a
                href={publicHref}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-full min-w-full max-w-none items-center justify-center gap-2 self-stretch rounded-2xl bg-[#3b2468] px-5 text-sm font-bold text-[#f6efff] shadow-lg shadow-[#3b2468]/20 transition hover:bg-[#2f1a55]"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                {publicActionLabel}
              </a>
            ) : null}
            {!hasGeneratedProduct ? (
              <p className="max-w-full px-3 text-center text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#4f416a]">
                This is a mockup, not your product.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

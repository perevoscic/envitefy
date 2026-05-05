"use client";

import {
  Calendar,
  ChevronDown,
  ExternalLink,
  Loader2,
  MapPin,
  Sparkles,
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
  categoryLabel: string;
  isGenerating: boolean;
  buildProgress: number;
  currentBuildStep: string;
  canGenerate: boolean;
  liveEventId: string | null;
  publicHref: string | null;
  rsvp: RsvpPreviewBadge;
  weatherContext: ConciergeWeatherContext | null;
  onGenerate: () => void;
  mobileView: "chat" | "preview";
};

function detailToneClass(value: string, fallback: string) {
  return value === fallback ? "text-[#b7afc3]" : "text-[#62546f]";
}

export default function ChatProductPreview({
  draft,
  summary,
  selectedOutput,
  previewImageUrl,
  categoryLabel,
  isGenerating,
  buildProgress,
  currentBuildStep,
  canGenerate,
  liveEventId,
  publicHref,
  rsvp,
  weatherContext,
  onGenerate,
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
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <section className="shrink-0 rounded-[1.3rem] border border-[#eee8f6] bg-white p-4 shadow-sm">
            <button
              type="button"
              className="mb-0 flex w-full items-start justify-between gap-3 text-left md:pointer-events-none md:mb-3"
              aria-expanded={isMobileDetailsOpen}
              onClick={() => setIsMobileDetailsOpen((value) => !value)}
            >
              <span className="min-w-0">
                <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8b8298]">
                  Details captured
                </span>
                <span className="mt-1 block truncate font-serif text-2xl font-bold italic text-[#221a35]">
                  {summary.headline}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className="inline-flex h-8 max-w-[10rem] items-center rounded-full border border-[#dfd6ea] bg-[#fbf9ff] px-3 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#7c4dff]"
                  title={`Category: ${categoryLabel}`}
                >
                  <span className="truncate">{categoryLabel}</span>
                </span>
                <ChevronDown
                  className={`size-5 text-[#8b8298] transition md:hidden ${
                    isMobileDetailsOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>

            <div className={`${isMobileDetailsOpen ? "mt-3 grid" : "hidden"} gap-3 md:mt-0 md:grid`}>
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

          <section className="relative mx-auto flex min-h-0 w-full flex-[1_1_0] items-center justify-center [container-type:size]">
            <div
              className="relative aspect-[9/16] h-full max-h-full max-w-full"
              style={{
                width: "min(100cqw, 56.25cqh)",
                height: "min(100cqh, 177.7778cqw)",
              }}
            >
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
              <StudioShowcaseLiveCard
                preview={preview}
                compactChrome
                buttonChromeSize="compact"
                interactive={hasGeneratedProduct}
                imageLoading="eager"
                imageFetchPriority="high"
                className="h-full w-full rounded-[2.2rem]"
              />
            </div>
          </section>

          <div className="shrink-0 space-y-3">
            {publicHref ? (
              <a
                href={publicHref}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-full min-w-full max-w-none items-center justify-center gap-2 self-stretch rounded-2xl bg-[#197052] px-5 text-sm font-bold text-white shadow-lg shadow-[#197052]/15 transition hover:bg-[#145f46]"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                View invite
              </a>
            ) : (
              <button
                type="button"
                disabled={!canGenerate}
                onClick={onGenerate}
                className="flex h-12 w-full min-w-full max-w-none items-center justify-center gap-2 self-stretch rounded-2xl bg-[#7c4dff] px-5 text-sm font-bold text-white shadow-lg shadow-[#7c4dff]/20 transition hover:bg-[#6f43f0] disabled:cursor-not-allowed disabled:bg-[#d8caff] disabled:shadow-none"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Generate invite
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

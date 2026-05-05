"use client";

import {
  Calendar,
  ExternalLink,
  Loader2,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import StudioShowcaseLiveCard from "@/components/studio/StudioShowcaseLiveCard";
import type { ConciergeEventDraft, RequestedOutput } from "@/lib/concierge/types";
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
  isBusy: boolean;
  isGenerating: boolean;
  buildProgress: number;
  currentBuildStep: string;
  canGenerate: boolean;
  liveEventId: string | null;
  publicHref: string | null;
  advancedEditorHref: string | null;
  rsvp: RsvpPreviewBadge;
  onGenerate: () => void;
  onRegenerate: () => void;
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
  isBusy,
  isGenerating,
  buildProgress,
  currentBuildStep,
  canGenerate,
  liveEventId,
  publicHref,
  advancedEditorHref,
  rsvp,
  onGenerate,
  onRegenerate,
  mobileView,
}: ChatProductPreviewProps) {
  const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
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
      <div className="flex min-h-full flex-col px-4 pb-24 pt-4 sm:px-6 sm:pb-8">
        <div className="flex-1 space-y-5 overflow-y-auto pb-5">
          <section className="rounded-[1.3rem] border border-[#eee8f6] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8b8298]">
                  Details captured
                </p>
                <h3 className="mt-1 truncate font-serif text-2xl font-bold italic text-[#221a35]">
                  {summary.headline}
                </h3>
              </div>
              <span
                className="inline-flex h-8 max-w-[10rem] shrink-0 items-center rounded-full border border-[#dfd6ea] bg-[#fbf9ff] px-3 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#7c4dff]"
                title={`Category: ${categoryLabel}`}
              >
                <span className="truncate">{categoryLabel}</span>
              </span>
            </div>

            <div className="grid gap-3">
              <div className={`flex items-center gap-3 ${detailToneClass(summary.scheduleLine, "Date TBD")}`}>
                <span className="grid size-9 place-items-center rounded-lg bg-[#fff3e8] text-[#e5751f]">
                  <Calendar className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{summary.scheduleLine}</span>
              </div>
              <div className={`flex items-center gap-3 ${detailToneClass(summary.locationLine, "Location TBD")}`}>
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
            </div>
          </section>

          <section className="relative mx-auto w-full max-w-[22rem]">
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
              className="w-full rounded-[2.2rem]"
            />
          </section>

          <div className="space-y-3">
            {publicHref ? (
              <a
                href={publicHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#197052] px-5 text-sm font-bold text-white shadow-lg shadow-[#197052]/15 transition hover:bg-[#145f46]"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                View product
              </a>
            ) : (
              <button
                type="button"
                disabled={!canGenerate}
                onClick={onGenerate}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c4dff] px-5 text-sm font-bold text-white shadow-lg shadow-[#7c4dff]/20 transition hover:bg-[#6f43f0] disabled:cursor-not-allowed disabled:bg-[#d8caff] disabled:shadow-none"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Create preview
              </button>
            )}

            {hasGeneratedProduct ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsManageMenuOpen((current) => !current)}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-[#d8caff] bg-white px-5 text-sm font-bold text-[#5f5289] transition hover:bg-[#f7f3ff]"
                  aria-expanded={isManageMenuOpen}
                >
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                  Manage
                </button>
                {isManageMenuOpen ? (
                  <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-40 overflow-hidden rounded-2xl border border-[#eadfff] bg-white p-2 shadow-xl shadow-[#3f275f]/10">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setIsManageMenuOpen(false);
                        onRegenerate();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#5f5289] transition hover:bg-[#fbf9ff] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <RefreshCw className="size-4 text-[#7c4dff]" aria-hidden="true" />
                      Regenerate
                    </button>
                    {advancedEditorHref ? (
                      <a
                        href={advancedEditorHref}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#5f5289] transition hover:bg-[#fbf9ff]"
                      >
                        <ExternalLink className="size-4 text-[#7c4dff]" aria-hidden="true" />
                        Open advanced editor
                      </a>
                    ) : null}
                    {advancedEditorHref ? (
                      <a
                        href={advancedEditorHref}
                        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#5f5289] transition hover:bg-[#fbf9ff]"
                      >
                        <span>RSVP responses</span>
                        <span className="rounded-full bg-[#f1ebff] px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-[#7c4dff]">
                          {rsvp.count}
                        </span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

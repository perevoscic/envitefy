"use client";

import { Image as ImageIcon, Layout, Loader2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import StudioShowcaseLiveCard from "@/components/studio/StudioShowcaseLiveCard";
import StudioLiveCardActionSurface from "@/components/studio/StudioLiveCardActionSurface";
import { getStudioCategoryShowcasePreview } from "@/lib/studio/showcase-previews";
import { getStudioShareTitle } from "../studio-workspace-builders";
import type {
  ActiveTab,
  EventDetails,
  MediaItem,
} from "../studio-workspace-types";

type StudioPhonePreviewPaneProps = {
  details: EventDetails;
  currentProjectWithVisualDraft: MediaItem | null;
  currentProjectDisplayUrl: string;
  currentProjectHasUnsavedChanges: boolean;
  currentProjectSaveLabel: string;
  savedCurrentProject: MediaItem | null;
  currentProjectPreviewTab: ActiveTab;
  setCurrentProjectPreviewTab: Dispatch<SetStateAction<ActiveTab>>;
  currentProjectPreviewShareUrl: string;
  isGenerating: boolean;
  sharingId: string | null;
  copySuccess: boolean;
  isFullscreenPreview?: boolean;
  saveCurrentProjectToLibrary: () => void;
  openCurrentLiveCardFullscreen: () => void;
  shareCurrentProject: () => void;
  openCurrentImage: () => void;
  handleMediaImageLoadError: (item: MediaItem) => void;
};

export function StudioPhonePreviewPane({
  details,
  currentProjectWithVisualDraft,
  currentProjectDisplayUrl,
  currentProjectHasUnsavedChanges,
  currentProjectSaveLabel,
  savedCurrentProject,
  currentProjectPreviewTab,
  setCurrentProjectPreviewTab,
  currentProjectPreviewShareUrl,
  isGenerating,
  sharingId,
  copySuccess,
  isFullscreenPreview = false,
  saveCurrentProjectToLibrary,
  openCurrentLiveCardFullscreen,
  shareCurrentProject,
  openCurrentImage,
  handleMediaImageLoadError,
}: StudioPhonePreviewPaneProps) {
  const hasPreview = Boolean(currentProjectWithVisualDraft);
  const showcasePreview = getStudioCategoryShowcasePreview(details.category);
  const saveCurrentProjectDisabled =
    !currentProjectWithVisualDraft ||
    currentProjectWithVisualDraft.status !== "ready" ||
    (!currentProjectHasUnsavedChanges && Boolean(savedCurrentProject));

  return (
    <div className="studio-phone-stage relative flex w-full flex-col items-center justify-start gap-4 pb-4 lg:h-full lg:justify-center lg:gap-5 lg:pb-0 lg:translate-x-6">
      <div
        className="relative flex w-full items-start justify-center lg:min-h-0 lg:flex-1 lg:items-center"
        role="region"
        aria-label="Live card phone preview"
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[78%] w-[72%] -translate-y-1/2 rounded-[3.5rem] bg-[radial-gradient(circle,_rgba(255,255,255,0.52)_0%,_rgba(251,226,238,0.42)_38%,_rgba(245,198,222,0.2)_62%,_transparent_82%)] blur-[28px]" />
        <div className="studio-phone-frame group relative aspect-[9/16] w-full max-w-[min(100%,340px)] overflow-hidden rounded-[3rem] border-[10px] border-[var(--studio-ink,#1A1A1A)] bg-[var(--studio-paper,#f7f2ec)] shadow-[0_28px_70px_rgba(255,255,255,0.18),0_42px_90px_rgba(240,192,220,0.18),0_36px_80px_rgba(31,18,52,0.16)] lg:h-full lg:w-auto lg:max-h-[min(82vh,620px)] lg:max-w-full">
          <div className="absolute left-1/2 top-3 z-20 h-1.5 w-20 -translate-x-1/2 rounded-full bg-[var(--studio-ink,#1A1A1A)]/80" />

          {isGenerating && !hasPreview ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[var(--studio-paper,#f7f2ec)]/90 px-6 text-center backdrop-blur-md">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--studio-brand,#7c5cd1)]/30 bg-white/85 shadow-[0_18px_44px_rgba(124,92,209,0.18)]">
                <Loader2 className="h-7 w-7 animate-spin text-[var(--studio-brand,#7c5cd1)]" />
              </div>
              <p className="font-[var(--font-playfair)] text-2xl text-[var(--studio-ink,#1A1A1A)]">
                Crafting Magic
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--studio-ink-soft,#6f5e8c)]">
                Composing your invitation
              </p>
            </div>
          ) : null}

          {hasPreview && currentProjectWithVisualDraft ? (
            <div
              className={`relative h-full w-full overflow-hidden bg-[#efe7dc] ${
                currentProjectWithVisualDraft.details.orientation === "portrait"
                  ? "aspect-[9/16]"
                  : "aspect-[16/9]"
              }`}
            >
              {currentProjectWithVisualDraft.status === "loading" ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-[var(--studio-brand,#7c5cd1)]" />
                  <span className="animate-pulse text-xs font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft,#6f5e8c)]">
                    Processing {currentProjectWithVisualDraft.type}...
                  </span>
                </div>
              ) : currentProjectWithVisualDraft.status === "error" ? (
                <div className="flex h-full w-full items-center justify-center p-8 text-center">
                  <div>
                    <p className="mb-2 font-semibold text-red-600">Generation Failed</p>
                    {currentProjectWithVisualDraft.errorMessage ? (
                      <p className="mb-4 text-sm leading-6 text-[var(--studio-ink-soft,#6f5e8c)]">
                        {currentProjectWithVisualDraft.errorMessage}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={currentProjectDisplayUrl}
                    alt={currentProjectWithVisualDraft.theme}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => handleMediaImageLoadError(currentProjectWithVisualDraft)}
                  />
                  {currentProjectWithVisualDraft.type === "page" ? (
                    <>
                      <LiveCardHeroTextOverlay
                        invitationData={currentProjectWithVisualDraft.data}
                      />
                      {!isFullscreenPreview ? (
                        <>
                          <StudioLiveCardActionSurface
                            title={getStudioShareTitle(currentProjectWithVisualDraft)}
                            invitationData={currentProjectWithVisualDraft.data}
                            activeTab={currentProjectPreviewTab}
                            onActiveTabChange={setCurrentProjectPreviewTab}
                            positions={currentProjectWithVisualDraft.positions}
                            shareUrl={currentProjectPreviewShareUrl}
                            onShare={shareCurrentProject}
                            shareState={
                              sharingId === currentProjectWithVisualDraft.id
                                ? "pending"
                                : copySuccess
                                  ? "success"
                                  : "idle"
                            }
                            showExtendedDetails
                            buttonChromeSize="compact"
                            registryHelperText={
                              currentProjectWithVisualDraft.data?.interactiveMetadata?.shareNote
                            }
                          />
                          <button
                            type="button"
                            onClick={saveCurrentProjectToLibrary}
                            disabled={saveCurrentProjectDisabled}
                            className="absolute right-3 top-5 z-20 inline-flex min-h-8.5 items-center justify-center rounded-full bg-white/94 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink,#1A1A1A)] shadow-[0_14px_34px_rgba(49,32,17,0.18)] backdrop-blur-md transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {currentProjectSaveLabel}
                          </button>
                        </>
                      ) : null}
                      <div className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-center lg:flex">
                        <button
                          type="button"
                          onClick={openCurrentLiveCardFullscreen}
                          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/96 px-5 py-3 text-sm font-medium text-[#1A1A1A] shadow-[0_14px_34px_rgba(49,32,17,0.18)] opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
                        >
                          <Layout className="h-4 w-4" />
                          Open live card
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={openCurrentImage}
                      className="absolute bottom-6 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-ink,#1A1A1A)] shadow-[0_14px_34px_rgba(49,32,17,0.18)]"
                    >
                      <ImageIcon className="h-4 w-4" />
                      View Full Image
                    </button>
                  )}
                </>
              )}

            </div>
          ) : (
            <StudioShowcaseLiveCard
              preview={showcasePreview}
              buttonChromeSize="compact"
              className="h-full w-full rounded-none border-0 bg-transparent shadow-none aspect-auto"
              imageLoading="eager"
              imageFetchPriority="high"
            />
          )}
        </div>
      </div>
      {hasPreview && currentProjectWithVisualDraft?.type === "image" ? (
        <div className="flex w-full max-w-[20rem] flex-col items-center justify-center gap-2">
          <button
            type="button"
            onClick={saveCurrentProjectToLibrary}
            disabled={saveCurrentProjectDisabled}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[var(--studio-ink,#1A1A1A)] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-paper,#F5F2EF)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {currentProjectSaveLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

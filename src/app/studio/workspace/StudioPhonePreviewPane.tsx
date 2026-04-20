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
  saveCurrentProjectToLibrary: () => void;
  shareCurrentProject: () => void;
  openCurrentImage: () => void;
  handleMediaImageLoadError: (item: MediaItem) => void;
  showSaveButton?: boolean;
  showImageOpenButton?: boolean;
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
  saveCurrentProjectToLibrary,
  shareCurrentProject,
  openCurrentImage,
  handleMediaImageLoadError,
  showSaveButton = true,
  showImageOpenButton = true,
}: StudioPhonePreviewPaneProps) {
  const hasPreview = Boolean(currentProjectWithVisualDraft);
  const showcasePreview = getStudioCategoryShowcasePreview(details.category);

  return (
    <div className="studio-phone-stage relative flex w-full flex-col items-center justify-start gap-4 pb-4 lg:h-full lg:justify-center lg:gap-5 lg:pb-0 lg:translate-x-6">
      <div
        className="relative flex w-full items-start justify-center lg:min-h-0 lg:flex-1 lg:items-center"
        role="region"
        aria-label="Live card phone preview"
      >
        <div className="studio-phone-frame relative aspect-[9/16] w-full max-w-[min(100%,340px)] overflow-hidden rounded-[3rem] border-[10px] border-[var(--studio-ink,#1A1A1A)] bg-[var(--studio-paper,#f7f2ec)] shadow-[0_36px_80px_rgba(31,18,52,0.18)] lg:h-full lg:w-auto lg:max-h-[min(82vh,620px)] lg:max-w-full">
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
                        registryHelperText={
                          currentProjectWithVisualDraft.data?.interactiveMetadata?.shareNote
                        }
                      />
                    </>
                  ) : showImageOpenButton ? (
                    <button
                      type="button"
                      onClick={openCurrentImage}
                      className="absolute bottom-6 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-ink,#1A1A1A)] shadow-[0_14px_34px_rgba(49,32,17,0.18)]"
                    >
                      <ImageIcon className="h-4 w-4" />
                      View Full Image
                    </button>
                  ) : null}
                  
                </>
              )}

              <div className="absolute right-3 top-5 z-20 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink,#1A1A1A)]">
                {currentProjectHasUnsavedChanges ? "Unsaved" : "Saved"}
              </div>
              <div className="absolute left-3 top-5 z-20 inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink,#1A1A1A)]">
                {currentProjectWithVisualDraft.type === "page" ? (
                  <>
                    <Layout className="h-3 w-3 text-emerald-600" />
                    Live Card
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3 w-3 text-sky-600" />
                    Image
                  </>
                )}
              </div>
            </div>
          ) : (
            <StudioShowcaseLiveCard
              preview={showcasePreview}
              className="h-full w-full rounded-none border-0 bg-transparent shadow-none aspect-auto"
              imageLoading="eager"
              imageFetchPriority="high"
            />
          )}
        </div>
      </div>
      {showSaveButton && hasPreview && currentProjectWithVisualDraft ? (
        <div className="flex w-full max-w-[22rem] items-center justify-center">
          <button
            type="button"
            onClick={saveCurrentProjectToLibrary}
            disabled={
              currentProjectWithVisualDraft.status !== "ready" ||
              (!currentProjectHasUnsavedChanges && Boolean(savedCurrentProject))
            }
            className="inline-flex items-center justify-center rounded-full bg-[var(--studio-ink,#1A1A1A)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-paper,#F5F2EF)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {currentProjectSaveLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

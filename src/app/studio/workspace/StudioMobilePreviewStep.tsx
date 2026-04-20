"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Image as ImageIcon, Share2 } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { ActiveTab, EventDetails, MediaItem } from "../studio-workspace-types";
import { StudioPhonePreviewPane } from "./StudioPhonePreviewPane";

type StudioMobilePreviewStepProps = {
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
  onOpenDetailsStep: () => void;
  onOpenIdeaComposer: () => void;
  ideaActionLabel: string;
  ideaComposerSheet: ReactNode;
};

export function StudioMobilePreviewStep({
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
  onOpenDetailsStep,
  onOpenIdeaComposer,
  ideaActionLabel,
  ideaComposerSheet,
}: StudioMobilePreviewStepProps) {
  const readyProject = currentProjectWithVisualDraft?.status === "ready" ? currentProjectWithVisualDraft : null;
  const canSave =
    Boolean(readyProject) &&
    (currentProjectHasUnsavedChanges || !savedCurrentProject);
  const canShare = Boolean(readyProject?.type === "page");
  const canViewImage = Boolean(readyProject?.type === "image");

  return (
    <motion.div
      key="mobile-preview"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-[100dvh] w-full bg-[#f4f1fb]"
    >
      <div className="sticky top-0 z-20 border-b border-[#ddd5cb] bg-[#f4f1fb]/95 px-5 pb-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenDetailsStep}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d8cdc0] bg-white/90 text-[var(--studio-ink,#1A1A1A)] shadow-[0_10px_24px_rgba(31,18,52,0.08)] transition-colors hover:bg-white"
            aria-label="Back to details"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8C7B65]">
              {details.category}
            </p>
            <p className="truncate text-sm font-semibold text-[var(--studio-ink,#1A1A1A)]">
              Preview
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-[calc(env(safe-area-inset-bottom,0px)+10rem)] pt-6">
        <StudioPhonePreviewPane
          details={details}
          currentProjectWithVisualDraft={currentProjectWithVisualDraft}
          currentProjectDisplayUrl={currentProjectDisplayUrl}
          currentProjectHasUnsavedChanges={currentProjectHasUnsavedChanges}
          currentProjectSaveLabel={currentProjectSaveLabel}
          savedCurrentProject={savedCurrentProject}
          currentProjectPreviewTab={currentProjectPreviewTab}
          setCurrentProjectPreviewTab={setCurrentProjectPreviewTab}
          currentProjectPreviewShareUrl={currentProjectPreviewShareUrl}
          isGenerating={isGenerating}
          sharingId={sharingId}
          copySuccess={copySuccess}
          saveCurrentProjectToLibrary={saveCurrentProjectToLibrary}
          shareCurrentProject={shareCurrentProject}
          openCurrentImage={openCurrentImage}
          handleMediaImageLoadError={handleMediaImageLoadError}
          showSaveButton={false}
          showImageOpenButton={false}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ddd5cb] bg-[#f4f1fb]/96 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
          {canShare ? (
            <button
              type="button"
              onClick={shareCurrentProject}
              disabled={!readyProject || sharingId === readyProject.id}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#d8cdc0] bg-white text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-ink,#1A1A1A)] shadow-[0_10px_24px_rgba(31,18,52,0.08)] transition-colors hover:bg-[#fcfaf7] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Share2 className={`h-4 w-4 ${sharingId === readyProject?.id ? "animate-pulse" : ""}`} />
              Share
            </button>
          ) : null}
          {canViewImage ? (
            <button
              type="button"
              onClick={openCurrentImage}
              disabled={!readyProject}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#d8cdc0] bg-white text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-ink,#1A1A1A)] shadow-[0_10px_24px_rgba(31,18,52,0.08)] transition-colors hover:bg-[#fcfaf7] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ImageIcon className="h-4 w-4" />
              View Full Image
            </button>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onOpenIdeaComposer}
              className="inline-flex h-14 items-center justify-center rounded-full border border-[#d8cdc0] bg-white text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-ink,#1A1A1A)] shadow-[0_12px_30px_rgba(31,18,52,0.08)] transition-colors hover:bg-[#fcfaf7]"
            >
              {ideaActionLabel}
            </button>
            <button
              type="button"
              onClick={saveCurrentProjectToLibrary}
              disabled={!canSave}
              className="inline-flex h-14 items-center justify-center rounded-full bg-[var(--studio-brand,#1A1A1A)] px-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white shadow-[0_20px_40px_rgba(31,18,52,0.22)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {currentProjectSaveLabel}
            </button>
          </div>
        </div>
      </div>

      {ideaComposerSheet}
    </motion.div>
  );
}

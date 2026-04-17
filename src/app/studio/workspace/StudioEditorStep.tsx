"use client";

import { motion } from "framer-motion";
import {
  ChevronRight,
  Image as ImageIcon,
  Layout,
  Loader2,
  WandSparkles,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import StudioLiveCardActionSurface from "@/components/studio/StudioLiveCardActionSurface";
import { clean, formatDate, getStudioShareTitle } from "../studio-workspace-builders";
import {
  studioWorkspaceMediaBadgeClass,
  studioWorkspaceMediaCardClass,
  studioWorkspaceShellClass,
} from "../studio-workspace-ui-classes";
import type {
  ActiveTab,
  EventDetails,
  MediaItem,
  MediaType,
  StudioLikenessStrength,
  StudioVisualStyleMode,
} from "../studio-workspace-types";

type Option<T extends string> = {
  value: T;
  label: string;
};

type StudioEditorStepProps = {
  details: EventDetails;
  setDetails: Dispatch<SetStateAction<EventDetails>>;
  studioIdeaLabel: string;
  studioIdeaPlaceholder: string;
  showStudioCreativeControls: boolean;
  likenessOptions: Array<Option<StudioLikenessStrength>>;
  visualStyleOptions: Array<Option<StudioVisualStyleMode>>;
  currentProjectWithVisualDraft: MediaItem | null;
  currentProjectDisplayUrl: string;
  currentProjectHasUnsavedChanges: boolean;
  currentProjectSaveLabel: string;
  savedCurrentProject: MediaItem | null;
  currentProjectPreviewTab: ActiveTab;
  setCurrentProjectPreviewTab: Dispatch<SetStateAction<ActiveTab>>;
  currentProjectPreviewShareUrl: string;
  isGenerating: boolean;
  isEditingLiveCard: boolean;
  editingLiveCardHeroTextMode: unknown;
  editPrompt: string;
  setEditPrompt: Dispatch<SetStateAction<string>>;
  sharingId: string | null;
  copySuccess: boolean;
  generateMedia: (type: MediaType) => void;
  saveCurrentProjectToLibrary: () => void;
  shareCurrentProject: () => void;
  downloadCurrentProject: () => void;
  clearCurrentProject: () => void;
  openCurrentImage: () => void;
  handleMediaImageLoadError: (item: MediaItem) => void;
};

export function StudioEditorStep({
  details,
  setDetails,
  studioIdeaLabel,
  studioIdeaPlaceholder,
  showStudioCreativeControls,
  likenessOptions,
  visualStyleOptions,
  currentProjectWithVisualDraft,
  currentProjectDisplayUrl,
  currentProjectHasUnsavedChanges,
  currentProjectSaveLabel,
  savedCurrentProject,
  currentProjectPreviewTab,
  setCurrentProjectPreviewTab,
  currentProjectPreviewShareUrl,
  isGenerating,
  isEditingLiveCard,
  editingLiveCardHeroTextMode,
  editPrompt,
  setEditPrompt,
  sharingId,
  copySuccess,
  generateMedia,
  saveCurrentProjectToLibrary,
  shareCurrentProject,
  downloadCurrentProject,
  clearCurrentProject,
  openCurrentImage,
  handleMediaImageLoadError,
}: StudioEditorStepProps) {
  const shellClass = studioWorkspaceShellClass;
  const mediaCardClass = studioWorkspaceMediaCardClass;
  const mediaBadgeClass = studioWorkspaceMediaBadgeClass;

  return (
    <motion.div
      key="editor"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="mr-auto grid max-w-[1440px] gap-8 lg:grid-cols-[380px_minmax(0,1fr)] xl:gap-10"
    >
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-6 lg:pt-[5.25rem]">
          <div className={`${shellClass} space-y-3`}>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
              {studioIdeaLabel}
            </label>
            <textarea
              placeholder={studioIdeaPlaceholder}
              className="min-h-[120px] w-full resize-none border-0 border-b border-[#1A1A1A]/18 bg-transparent px-0 py-2 font-[var(--font-playfair)] text-2xl text-[#1A1A1A] transition-colors focus:border-[#1A1A1A] focus:outline-none focus:ring-0 [&::placeholder]:text-[rgba(26,26,26,0.1)] [&::placeholder]:italic [&::placeholder]:opacity-100"
              value={details.theme}
              onChange={(event) =>
                setDetails((prev) => ({ ...prev, theme: event.target.value }))
              }
            />
            <p className="text-sm leading-7 text-[#6B5E4E]">
              Describe your invitation in your own words. We&apos;ll generate it for you.
            </p>
          </div>

          {showStudioCreativeControls ? (
            <div className="space-y-4 rounded-[1.75rem] border border-[#d8cdc0]/85 bg-[#fbf8f4] p-5">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                  Creative Upgrade
                </p>
                <p className="text-sm leading-7 text-[#6B5E4E]">
                  Use these controls when you want the uploaded person transformed into the theme
                  instead of simply blended into the scene.
                </p>
              </div>

              <div className="space-y-4 border-t border-[#1A1A1A]/8 pt-4">
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                    Likeness Strength
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {likenessOptions.map((option) => {
                      const active = details.likenessStrength === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setDetails((prev) => ({
                              ...prev,
                              likenessStrength: option.value,
                              subjectTransformMode: "premium_makeover",
                            }))
                          }
                          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                            active
                              ? "border-[#1A1A1A] bg-[#1A1A1A] text-[#F5F2EF]"
                              : "border-[#d8cdc0] bg-white text-[#5F5345] hover:border-[#8C7B65]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                    Visual Style
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {visualStyleOptions.map((option) => {
                      const active = details.visualStyleMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setDetails((prev) => ({
                              ...prev,
                              visualStyleMode: option.value,
                              subjectTransformMode: "premium_makeover",
                            }))
                          }
                          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                            active
                              ? "border-[#1A1A1A] bg-[#1A1A1A] text-[#F5F2EF]"
                              : "border-[#d8cdc0] bg-white text-[#5F5345] hover:border-[#8C7B65]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-3 pt-6">
            {isEditingLiveCard ? (
              <div className="rounded-[1.5rem] border border-[#d8cdc0]/85 bg-[#fbf8f4] p-4">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                  {editingLiveCardHeroTextMode === "image"
                    ? "Edit current invitation art"
                    : "Edit current background"}
                </label>
                <textarea
                  placeholder="e.g. soften the gold lighting, simplify the florals, and keep the same composition"
                  className="min-h-[120px] w-full resize-none border-0 border-b border-[#1A1A1A]/18 bg-transparent px-0 py-2 font-[var(--font-playfair)] text-2xl text-[#1A1A1A] transition-colors focus:border-[#1A1A1A] focus:outline-none focus:ring-0 [&::placeholder]:text-[rgba(26,26,26,0.1)] [&::placeholder]:italic [&::placeholder]:opacity-100"
                  value={editPrompt}
                  onChange={(event) => setEditPrompt(event.target.value)}
                />
              </div>
            ) : null}
            <div className="space-y-3">
              <button
                onClick={() => generateMedia("page")}
                disabled={isGenerating}
                className="group flex h-14 w-full items-center justify-center gap-3 bg-[#1A1A1A] px-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F5F2EF] shadow-[0_20px_50px_rgba(26,26,26,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#262626] disabled:opacity-50"
              >
                <Layout className="h-5 w-5" />
                {isEditingLiveCard ? "Update Invitation" : "Create Live Card"}
                <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </button>

              <button
                onClick={() => generateMedia("image")}
                disabled={isGenerating}
                className="group flex h-14 w-full items-center justify-center gap-3 border border-[#d8cdc0] bg-[#fbf8f4] text-[10px] font-semibold uppercase tracking-[0.28em] text-[#1A1A1A] shadow-[0_12px_30px_rgba(49,32,17,0.08)] transition-all hover:-translate-y-0.5 hover:bg-[#fffdf9] disabled:opacity-50"
              >
                <ImageIcon className="h-5 w-5" />
                Generate Image
                <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <section className="space-y-8">
        {currentProjectWithVisualDraft ? (
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveCurrentProjectToLibrary}
                disabled={
                  currentProjectWithVisualDraft.status !== "ready" ||
                  (!currentProjectHasUnsavedChanges && Boolean(savedCurrentProject))
                }
                className="inline-flex items-center justify-center rounded-full bg-[#1A1A1A] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#F5F2EF] transition-all hover:-translate-y-0.5 hover:bg-[#262626] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {currentProjectSaveLabel}
              </button>
              <button
                type="button"
                onClick={shareCurrentProject}
                disabled={
                  currentProjectWithVisualDraft.status !== "ready" ||
                  sharingId === currentProjectWithVisualDraft.id
                }
                className="inline-flex items-center justify-center rounded-full border border-[#d8cdc0] bg-[#fbf8f4] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#1A1A1A] transition-all hover:-translate-y-0.5 hover:bg-[#fffdf9] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {sharingId === currentProjectWithVisualDraft.id ? "Sharing..." : "Share"}
              </button>
              <button
                type="button"
                onClick={downloadCurrentProject}
                disabled={!currentProjectWithVisualDraft.url}
                className="inline-flex items-center justify-center rounded-full border border-[#d8cdc0] bg-[#fbf8f4] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#1A1A1A] transition-all hover:-translate-y-0.5 hover:bg-[#fffdf9] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Download
              </button>
              <button
                type="button"
                onClick={clearCurrentProject}
                className="inline-flex items-center justify-center rounded-full border border-[#e6d7c7] bg-[#fffaf4] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7a5e47] transition-all hover:-translate-y-0.5 hover:bg-[#fffdf9]"
              >
                {currentProjectHasUnsavedChanges ? "Discard" : "Clear Studio"}
              </button>
            </div>
          </div>
        ) : null}

        {currentProjectWithVisualDraft ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,25rem)_16rem] xl:justify-center">
            <div className={`${mediaCardClass} overflow-hidden`}>
              <div
                className={`relative mx-auto flex items-center justify-center overflow-hidden bg-[#efe7dc] ${
                  currentProjectWithVisualDraft.details.orientation === "portrait"
                    ? "aspect-[9/16] w-full"
                    : "aspect-[16/9] w-full max-w-[38rem]"
                }`}
              >
                {currentProjectWithVisualDraft.status === "loading" ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#8C7B65]" />
                    <span className="animate-pulse text-xs font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                      Processing {currentProjectWithVisualDraft.type}...
                    </span>
                  </div>
                ) : currentProjectWithVisualDraft.status === "error" ? (
                  <div className="max-w-md p-8 text-center">
                    <p className="mb-2 font-semibold text-red-600">Generation Failed</p>
                    {currentProjectWithVisualDraft.errorMessage ? (
                      <p className="mb-4 text-sm leading-6 text-[#6B5E4E]">
                        {currentProjectWithVisualDraft.errorMessage}
                      </p>
                    ) : null}
                    <button
                      onClick={() => generateMedia(currentProjectWithVisualDraft.type)}
                      className="text-sm font-medium text-[#5F5345] underline hover:text-[#1A1A1A]"
                    >
                      Try Again
                    </button>
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
                        <LiveCardHeroTextOverlay invitationData={currentProjectWithVisualDraft.data} />
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
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,rgba(27,20,15,0.12),rgba(27,20,15,0.58))] opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                        <button
                          onClick={openCurrentImage}
                          className="flex items-center gap-2 rounded-full bg-[#fbf8f4] px-6 py-3 text-sm font-semibold text-[#1A1A1A] shadow-[0_14px_34px_rgba(49,32,17,0.18)] transition-transform hover:scale-[1.02]"
                        >
                          <ImageIcon className="h-5 w-5" />
                          View Full Image
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className={`absolute left-4 top-4 ${mediaBadgeClass}`}>
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
                <div className="absolute right-4 top-4 rounded-full border border-[#efe4d7] bg-[#f8f3ed] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5F5345] shadow-[0_10px_24px_rgba(49,32,17,0.12)]">
                  {currentProjectHasUnsavedChanges ? "Unsaved" : "Saved"}
                </div>
              </div>
            </div>

            <div className={`${shellClass} space-y-4 self-start`}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8C7B65]">
                  Current Project
                </p>
                <h3 className="mt-2 font-[var(--font-playfair)] text-3xl tracking-[-0.03em] text-[#1A1A1A]">
                  {getStudioShareTitle(currentProjectWithVisualDraft)}
                </h3>
              </div>
              <div className="space-y-3 text-sm text-[#6B5E4E]">
                <p>{currentProjectWithVisualDraft.details.category}</p>
                {currentProjectWithVisualDraft.details.eventDate ? (
                  <p>{formatDate(currentProjectWithVisualDraft.details.eventDate)}</p>
                ) : null}
                {clean(currentProjectWithVisualDraft.details.location) ? (
                  <p>{clean(currentProjectWithVisualDraft.details.location)}</p>
                ) : null}
              </div>
              <div className="space-y-3 border-t border-[#1A1A1A]/8 pt-4 text-sm leading-7 text-[#6B5E4E]">
                <p>
                  Save this project to keep it in Library. If you clear Studio without saving, it
                  will be discarded.
                </p>
                {currentProjectWithVisualDraft.type === "image" ? (
                  <button
                    type="button"
                    onClick={openCurrentImage}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] underline decoration-[#8C7B65]/50 underline-offset-4"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Open current image
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[304px] items-center justify-center rounded-[2rem] border border-dashed border-[#d8cdc0] bg-[#fbf8f4] px-8 py-12 text-center shadow-[0_20px_55px_rgba(49,32,17,0.05)] lg:mt-[5.25rem]">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex rounded-full bg-[#f0e7db] p-6 shadow-[0_10px_24px_rgba(49,32,17,0.08)]">
                <WandSparkles className="h-12 w-12 text-[#8C7B65]" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold tracking-[-0.02em] text-[#1A1A1A]">
                No current project yet
              </h3>
              <p className="mx-auto max-w-xl text-sm leading-7 text-[#6B5E4E]">
                Generate a live card or image here, then save it to Library only when you want to
                keep it.
              </p>
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
}

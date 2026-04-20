"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Layout,
  Loader2,
} from "lucide-react";
import { type Dispatch, type ReactNode, type SetStateAction, useState } from "react";
import {
  getStudioImageFinishPresets,
  resolveStudioImageFinishPreset,
} from "@/lib/studio/image-finish-presets";
import {
  CATEGORY_FIELDS,
  SHARED_BASICS,
  STUDIO_COMPACT_CATEGORY_FORM_CONFIG,
} from "../studio-workspace-field-config";
import { studioWorkspaceFieldLabelClass } from "../studio-workspace-ui-classes";
import type {
  ActiveTab,
  EventDetails,
  FieldConfig,
  MediaItem,
  MediaType,
  StudioLikenessStrength,
  StudioVisualStyleMode,
} from "../studio-workspace-types";
import { StudioFieldGrid } from "./StudioFieldControls";
import { StudioOptionalMediaRow } from "./StudioOptionalMediaRow";
import { StudioPhonePreviewPane } from "./StudioPhonePreviewPane";

type Option<T extends string> = {
  value: T;
  label: string;
};

export type StudioFormStepProps = {
  details: EventDetails;
  setDetails: Dispatch<SetStateAction<EventDetails>>;
  onOpenTypeStep: () => void;
  isFormValid: boolean;
  editingId: string | null;
  onUploadFlyer: (file: File) => Promise<void>;
  onRemoveFlyer: () => void;
  onUploadSubjectPhotos: (files: File[]) => Promise<void>;
  onRemoveSubjectPhoto: (index: number) => void;
  isFlyerUploading: boolean;
  isSubjectPhotoUploading: boolean;
  flyerUploadError: string | null;
  subjectPhotoUploadError: string | null;
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
  isMobileViewport: boolean;
  sharingId: string | null;
  copySuccess: boolean;
  generateMedia: (type: MediaType) => void;
  desktopIdeaComposer?: ReactNode;
  saveCurrentProjectToLibrary: () => void;
  shareCurrentProject: () => void;
  openCurrentImage: () => void;
  handleMediaImageLoadError: (item: MediaItem) => void;
};

export function StudioFormStep({
  details,
  setDetails,
  onOpenTypeStep,
  isFormValid,
  editingId,
  onUploadFlyer,
  onRemoveFlyer,
  onUploadSubjectPhotos,
  onRemoveSubjectPhoto,
  isFlyerUploading,
  isSubjectPhotoUploading,
  flyerUploadError,
  subjectPhotoUploadError,
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
  isMobileViewport,
  sharingId,
  copySuccess,
  generateMedia,
  desktopIdeaComposer,
  saveCurrentProjectToLibrary,
  shareCurrentProject,
  openCurrentImage,
  handleMediaImageLoadError,
}: StudioFormStepProps) {
  const formConfig = STUDIO_COMPACT_CATEGORY_FORM_CONFIG[details.category];
  const primaryCategoryFields = formConfig.primaryFields;
  const secondaryCategoryFields = formConfig.secondaryFields || [];
  const sharedPrimaryFields = SHARED_BASICS.filter((field) =>
    ["eventDate", "startTime", "location"].includes(field.key),
  );
  const isBirthday = details.category === "Birthday";
  const mobileBirthdayLeadFields =
    isMobileViewport && isBirthday
      ? primaryCategoryFields.filter((field) => ["name", "age"].includes(field.key))
      : primaryCategoryFields;
  const mobileBirthdayTrailingFields =
    isMobileViewport && isBirthday
      ? primaryCategoryFields.filter((field) => !["name", "age"].includes(field.key))
      : [];
  const mobileSharedLeadFields = isMobileViewport
    ? sharedPrimaryFields.filter((field) => ["eventDate", "startTime"].includes(field.key))
    : sharedPrimaryFields;
  const mobileSharedTrailingFields = isMobileViewport
    ? sharedPrimaryFields.filter((field) => !["eventDate", "startTime"].includes(field.key))
    : [];
  const imageFinishPresets = getStudioImageFinishPresets(details.category);
  const selectedImageFinishPreset = resolveStudioImageFinishPreset(
    details.category,
    details.imageFinishPreset,
  );
  const ideaValue = details.theme || details.detailsDescription || "";

  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const allCategoryFields: FieldConfig[] = CATEGORY_FIELDS[details.category] || [];
  const renderedKeys = new Set<string>([
    ...primaryCategoryFields.map((f) => f.key),
    ...secondaryCategoryFields.map((f) => f.key),
  ]);
  const moreDetailFields = isBirthday
    ? []
    : allCategoryFields.filter((field) => !renderedKeys.has(field.key));

  function updateIdeaText(value: string) {
    setDetails((prev) => ({
      ...prev,
      theme: value,
      detailsDescription: value,
    }));
  }

  const generateImageButton = (
    <button
      type="button"
      onClick={() => generateMedia("image")}
      disabled={!isFormValid || isGenerating}
      className="group flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[var(--studio-card-border,#d8cdc0)] bg-white text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--studio-ink,#1A1A1A)] shadow-[0_12px_30px_rgba(124,92,209,0.12)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ImageIcon className="h-5 w-5" />
      Generate Image
      <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
    </button>
  );

  const generateLiveCardButton = (
    <button
      type="button"
      onClick={() => generateMedia("page")}
      disabled={!isFormValid || isGenerating}
      className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[var(--studio-brand,#1A1A1A)] px-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-white shadow-[0_20px_50px_rgba(124,92,209,0.28)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isGenerating ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Layout className="h-5 w-5" />
      )}
      {isEditingLiveCard ? "Update Invitation" : editingId ? "Regenerate Live Card" : "Create Live Card"}
      <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
    </button>
  );

  return (
    <motion.div
      key="form"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`mr-auto max-w-[1440px] lg:h-full lg:max-w-none ${isMobileViewport ? "w-full max-w-none" : ""}`}
    >
      {isMobileViewport ? (
        <div className="-mx-6 mb-6 border-b border-[#ddd5cb] bg-[#f4f1fb]/95 px-6 pb-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur-xl sm:-mx-8 sm:px-8 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenTypeStep}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d8cdc0] bg-white/90 text-[var(--studio-ink,#1A1A1A)] shadow-[0_10px_24px_rgba(31,18,52,0.08)] transition-colors hover:bg-white"
              aria-label="Back to invite types"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8C7B65]">
                {details.category}
              </p>
              <p className="truncate text-sm font-semibold text-[var(--studio-ink,#1A1A1A)]">
                Details
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="lg:flex lg:h-full lg:min-h-0 lg:w-full lg:overflow-hidden">
        <section
          className={`space-y-8 lg:flex lg:h-full lg:min-h-0 lg:w-auto lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-0 lg:pr-8 lg:[scrollbar-gutter:stable] ${isMobileViewport ? "w-full pr-0 pb-[calc(env(safe-area-inset-bottom,0px)+7.5rem)]" : "w-1/2 shrink-0 pr-4"}`}
        >
          <div className="w-full max-w-4xl">
          <div className="studio-form-card rounded-[2rem] border p-6 sm:p-8 lg:flex lg:min-h-full lg:flex-1 lg:flex-col lg:p-10">
            <div className="space-y-12 pt-2 md:pt-4 lg:flex lg:min-h-full lg:flex-1 lg:flex-col">
              {primaryCategoryFields.length ? (
                <div className="space-y-4">
                  {isMobileViewport && isBirthday ? (
                    <div className="space-y-8">
                      <StudioFieldGrid
                        details={details}
                        setDetails={setDetails}
                        fields={mobileBirthdayLeadFields}
                        columnsClassName="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-x-6 gap-y-8"
                      />
                      {mobileBirthdayTrailingFields.length ? (
                        <StudioFieldGrid
                          details={details}
                          setDetails={setDetails}
                          fields={mobileBirthdayTrailingFields}
                          columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8"
                        />
                      ) : null}
                    </div>
                  ) : (
                    <StudioFieldGrid
                      details={details}
                      setDetails={setDetails}
                      fields={primaryCategoryFields}
                      columnsClassName={
                        isBirthday
                          ? "grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1.6fr)]"
                          : "grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-3"
                      }
                    />
                  )}
                </div>
              ) : null}

              {sharedPrimaryFields.length ? (
                <div className="space-y-4">
                  {isMobileViewport ? (
                    <div className="space-y-8">
                      <StudioFieldGrid
                        details={details}
                        setDetails={setDetails}
                        fields={mobileSharedLeadFields}
                        columnsClassName="grid grid-cols-2 gap-x-6 gap-y-8"
                      />
                      {mobileSharedTrailingFields.length ? (
                        <StudioFieldGrid
                          details={details}
                          setDetails={setDetails}
                          fields={mobileSharedTrailingFields}
                          columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8"
                        />
                      ) : null}
                    </div>
                  ) : (
                    <StudioFieldGrid
                      details={details}
                      setDetails={setDetails}
                      fields={sharedPrimaryFields}
                      columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-[11.5rem_9rem_minmax(0,1fr)]"
                    />
                  )}
                </div>
              ) : null}

              {secondaryCategoryFields.length ? (
                <div className="space-y-4">
                  <StudioFieldGrid
                    details={details}
                    setDetails={setDetails}
                    fields={secondaryCategoryFields}
                    columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-3"
                  />
                </div>
              ) : null}

              <div className="space-y-3">
                <label
                  className={studioWorkspaceFieldLabelClass}
                  htmlFor="studio-idea-and-details"
                >
                  Invitation Idea & Details
                </label>
                <textarea
                  id="studio-idea-and-details"
                  rows={3}
                  data-studio-idea-label={studioIdeaLabel}
                  placeholder={studioIdeaPlaceholder}
                  className="font-[var(--font-playfair)] min-h-[96px] w-full resize-none border-0 border-b border-[var(--studio-ink,#1A1A1A)]/18 bg-transparent px-0 py-2 text-[1.65rem] leading-[1.35] text-[var(--studio-ink,#1A1A1A)] transition-colors focus:border-[var(--studio-ink,#1A1A1A)] focus:outline-none focus:ring-0 sm:text-2xl [&::placeholder]:text-[1.2rem] [&::placeholder]:italic [&::placeholder]:leading-[1.3] [&::placeholder]:text-[rgba(28,21,48,0.18)] sm:[&::placeholder]:text-[1.5rem]"
                  value={ideaValue}
                  onChange={(event) => updateIdeaText(event.target.value)}
                />
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--studio-ink-soft,#8C7B65)]">
                  <span className="mr-1 text-[var(--studio-ink,#1A1A1A)]/35">*</span> Required fields
                </p>
              </div>

              {imageFinishPresets.length > 0 ? (
                <div className="space-y-4 rounded-[1.25rem] border border-[#e8d8e8] bg-[#f7edf7] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-7">
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft,#8C7B65)]">
                      Image Finish (Optional)
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {imageFinishPresets.map((preset) => {
                      const active = selectedImageFinishPreset?.label === preset.label;
                      return (
                        <motion.button
                          key={preset.label}
                          type="button"
                          aria-pressed={active}
                          whileHover={{ opacity: 0.92, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setDetails((prev) => ({
                              ...prev,
                              imageFinishPreset: active ? "" : preset.label,
                            }))
                          }
                          className={`studio-finish-chip flex min-h-[60px] w-full items-center justify-center rounded-[0.45rem] border px-4 text-center text-[12px] font-semibold uppercase leading-tight tracking-[0.05em] text-white transition-all ${
                            active
                              ? "border-[var(--studio-brand,#7c5cd1)] bg-[var(--studio-brand,#7c5cd1)] shadow-[0_10px_24px_rgba(124,92,209,0.24)] ring-2 ring-[var(--studio-brand,#7c5cd1)]/22 ring-offset-2 ring-offset-[#f7edf7]"
                              : "border-[#8e78d8] bg-[var(--studio-brand,#7c5cd1)] shadow-[0_8px_20px_rgba(124,92,209,0.16)] hover:-translate-y-0.5 hover:border-[#7b63cf] hover:bg-[#8366d7] hover:shadow-[0_10px_24px_rgba(124,92,209,0.22)]"
                          }`}
                        >
                          {preset.label}
                        </motion.button>
                      );
                    })}
                  </div>
                  {selectedImageFinishPreset ? (
                    <p className="text-sm leading-6 text-[var(--studio-ink-soft,#6B5E4E)]">
                      {selectedImageFinishPreset.description}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {showStudioCreativeControls ? (
                <div className="space-y-4 rounded-[1.75rem] border border-[var(--studio-card-border,#d8cdc0)] bg-[var(--studio-paper-soft,#fbf8f4)] p-5">
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft,#8C7B65)]">
                      Creative Upgrade
                    </p>
                    <p className="text-sm leading-7 text-[var(--studio-ink-soft,#6B5E4E)]">
                      Use these controls when you want the uploaded person transformed into the theme
                      instead of simply blended into the scene.
                    </p>
                  </div>

                  <div className="space-y-4 border-t border-[var(--studio-ink,#1A1A1A)]/8 pt-4">
                    <div className="space-y-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft,#8C7B65)]">
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
                                  ? "border-[var(--studio-brand,#1A1A1A)] bg-[var(--studio-brand,#1A1A1A)] text-white"
                                  : "border-[var(--studio-card-border,#d8cdc0)] bg-white text-[var(--studio-ink,#5F5345)] hover:border-[var(--studio-brand,#8C7B65)]"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft,#8C7B65)]">
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
                                  ? "border-[var(--studio-brand,#1A1A1A)] bg-[var(--studio-brand,#1A1A1A)] text-white"
                                  : "border-[var(--studio-card-border,#d8cdc0)] bg-white text-[var(--studio-ink,#5F5345)] hover:border-[var(--studio-brand,#8C7B65)]"
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

              {moreDetailFields.length ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowMoreDetails((prev) => !prev)}
                    className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft,#8C7B65)] transition-colors hover:text-[var(--studio-ink,#1A1A1A)]"
                    aria-expanded={showMoreDetails}
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        showMoreDetails ? "rotate-180" : ""
                      }`}
                    />
                    More details
                  </button>
                  {showMoreDetails ? (
                    <div className="space-y-4 pt-3">
                      <StudioFieldGrid
                        details={details}
                        setDetails={setDetails}
                        fields={moreDetailFields}
                        columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-7 pt-4 lg:mt-auto">
                <StudioOptionalMediaRow
                  details={details}
                  onUploadFlyer={onUploadFlyer}
                  onRemoveFlyer={onRemoveFlyer}
                  onUploadSubjectPhotos={onUploadSubjectPhotos}
                  onRemoveSubjectPhoto={onRemoveSubjectPhoto}
                  isFlyerUploading={isFlyerUploading}
                  isSubjectPhotoUploading={isSubjectPhotoUploading}
                  flyerUploadError={flyerUploadError}
                  subjectPhotoUploadError={subjectPhotoUploadError}
                />

                <div className="space-y-3">
                  {!isMobileViewport ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {generateImageButton}
                      {generateLiveCardButton}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <aside className="hidden w-1/2 shrink-0 pl-4 lg:flex lg:h-full lg:min-h-0 lg:w-[500px] lg:shrink-0 lg:justify-center lg:border-l lg:border-[#ddd5cb]/70 lg:bg-transparent lg:pl-8 lg:pr-4 lg:pb-14 lg:pt-8">
          <div className="flex h-full w-full max-w-[380px] flex-col items-center gap-5">
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
            />
            {desktopIdeaComposer ? (
              <div className="w-full">
                {desktopIdeaComposer}
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {isMobileViewport ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ddd5cb] bg-[#f4f1fb]/96 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4 backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-3">
            {generateImageButton}
            {generateLiveCardButton}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

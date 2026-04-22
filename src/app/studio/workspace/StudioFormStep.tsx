"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Layout,
  Loader2,
  Wand2,
  X,
} from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
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
  onOpenEditorStep: () => void;
  isFormValid: boolean;
  editingId: string | null;
  onRemoveFlyer: () => void;
  onUploadSubjectPhotos: (files: File[]) => Promise<void>;
  onRemoveSubjectPhoto: (index: number) => void;
  isSubjectPhotoUploading: boolean;
  flyerUploadError: string | null;
  subjectPhotoUploadError: string | null;
  studioDesignIdeaPlaceholder: string;
  studioEventDetailsPlaceholder: string;
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
  generationNote: string | null;
  isEditingLiveCard: boolean;
  isMobileViewport: boolean;
  mobilePane: "composer" | "preview";
  sharingId: string | null;
  copySuccess: boolean;
  generateMedia: (type: MediaType) => void;
  saveCurrentProjectToLibrary: () => void;
  openCurrentLiveCardFullscreen: () => void;
  showPromptComposer: () => void;
  showPreviewPane: () => void;
  shareCurrentProject: () => void;
  openCurrentImage: () => void;
  handleMediaImageLoadError: (item: MediaItem) => void;
};

function stylePickerLabel(label: string | null | undefined) {
  return label ? label.toUpperCase() : "CHOOSE A STYLE (OPTIONAL)";
}

export function StudioFormStep({
  details,
  setDetails,
  onOpenEditorStep: _onOpenEditorStep,
  isFormValid,
  editingId,
  onRemoveFlyer,
  onUploadSubjectPhotos,
  onRemoveSubjectPhoto,
  isSubjectPhotoUploading,
  flyerUploadError,
  subjectPhotoUploadError,
  studioDesignIdeaPlaceholder,
  studioEventDetailsPlaceholder,
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
  generationNote,
  isEditingLiveCard,
  isMobileViewport,
  mobilePane,
  sharingId,
  copySuccess,
  generateMedia,
  saveCurrentProjectToLibrary,
  openCurrentLiveCardFullscreen,
  showPromptComposer,
  showPreviewPane,
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
  const flyerProvidesVisualDirection =
    details.sourceMediaMode === "flyer" && details.sourceFlyerUrl.trim().length > 0;

  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const stylePickerRef = useRef<HTMLDivElement | null>(null);
  const allCategoryFields: FieldConfig[] = CATEGORY_FIELDS[details.category] || [];
  const renderedKeys = new Set<string>([
    ...primaryCategoryFields.map((f) => f.key),
    ...secondaryCategoryFields.map((f) => f.key),
  ]);
  const moreDetailFields = isBirthday
    ? []
    : allCategoryFields.filter((field) => !renderedKeys.has(field.key));
  const liveCardActionLabel = isEditingLiveCard
    ? "Update Live Card"
    : editingId
      ? "Regenerate Live Card"
      : "Preview Live Card";

  useEffect(() => {
    if (!showStylePicker || isMobileViewport || typeof window === "undefined") return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!stylePickerRef.current?.contains(event.target as Node)) {
        setShowStylePicker(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isMobileViewport, showStylePicker]);

  function updateEventDetailsText(value: string) {
    setDetails((prev) => ({
      ...prev,
      detailsDescription: value,
    }));
  }

  function updateDesignIdeaText(value: string) {
    setDetails((prev) => ({
      ...prev,
      theme: value,
    }));
  }

  function updateImageFinishPreset(label: string) {
    setDetails((prev) => ({
      ...prev,
      imageFinishPreset: prev.imageFinishPreset === label ? "" : label,
    }));
    setShowStylePicker(false);
  }

  const stylePickerButton = (
    <div className="relative" ref={stylePickerRef}>
      <button
        type="button"
        aria-expanded={showStylePicker}
        aria-label="Choose visual style"
        onClick={() => setShowStylePicker((prev) => !prev)}
        className="flex min-h-14 w-full items-center justify-between rounded-[1rem] border border-[#e6ebf2] bg-white px-5 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.02em] text-[#23345a] transition-all hover:border-[#dbe2ec] hover:bg-white"
      >
        <div className="flex items-center gap-3">
          <Wand2 className="h-4 w-4 text-[#d1d9e6]" />
          <span>{stylePickerLabel(selectedImageFinishPreset?.label)}</span>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-[#d0d8e6] transition-transform ${showStylePicker ? "rotate-90" : ""}`}
        />
      </button>

      {!isMobileViewport ? (
        <AnimatePresence>
          {showStylePicker ? (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="absolute left-0 right-0 top-[calc(100%+0.65rem)] z-30 rounded-[1.25rem] border border-[#e8edf4] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
            >
              <div className="grid grid-cols-2 gap-2">
                {imageFinishPresets.map((preset) => {
                  const active = selectedImageFinishPreset?.label === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => updateImageFinishPreset(preset.label)}
                      className={`flex min-h-[76px] flex-col items-center justify-center rounded-[1.1rem] border px-4 py-3 text-center transition-all ${
                        active
                          ? "border-[#5b43f2] bg-[#5b43f2] text-white shadow-[0_12px_24px_rgba(91,67,242,0.18)]"
                          : "border-[#eef2f7] bg-[#fbfcfe] text-[#70819f] hover:border-[#e1e8f1] hover:bg-white"
                      }`}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.02em]">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </div>
  );

  const sharedFormContent = (
    <div className="space-y-10">
      {isMobileViewport ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8ea0c4]">
            The Basics
          </p>
        </div>
      ) : null}

      {primaryCategoryFields.length ? (
        <div className="space-y-4">
          {isMobileViewport && isBirthday ? (
            <div className="space-y-8">
              <StudioFieldGrid
                details={details}
                setDetails={setDetails}
                fields={mobileBirthdayLeadFields}
                columnsClassName="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-x-6 gap-y-8"
                isMobileViewport={isMobileViewport}
              />
              {mobileBirthdayTrailingFields.length ? (
                <StudioFieldGrid
                  details={details}
                  setDetails={setDetails}
                  fields={mobileBirthdayTrailingFields}
                  columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8"
                  isMobileViewport={isMobileViewport}
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
              isMobileViewport={isMobileViewport}
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
                columnsClassName="grid grid-cols-[minmax(7.75rem,1.12fr)_minmax(8.15rem,0.94fr)] gap-x-4 gap-y-8"
                isMobileViewport={isMobileViewport}
              />
              {mobileSharedTrailingFields.length ? (
                <StudioFieldGrid
                  details={details}
                  setDetails={setDetails}
                  fields={mobileSharedTrailingFields}
                  columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8"
                  isMobileViewport={isMobileViewport}
                />
              ) : null}
            </div>
          ) : (
            <StudioFieldGrid
              details={details}
              setDetails={setDetails}
              fields={sharedPrimaryFields}
              columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-[8.5rem_9.25rem_minmax(0,1fr)] md:gap-x-4"
              isMobileViewport={isMobileViewport}
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
            isMobileViewport={isMobileViewport}
          />
        </div>
      ) : null}

      <div className="space-y-4 pt-2">
        <div className="space-y-3 rounded-[1.35rem] border border-[#eef2f7] bg-[#fcfdff] px-5 py-4">
          <div className="space-y-1">
            <label className={studioWorkspaceFieldLabelClass} htmlFor="studio-event-details">
              Event Details
            </label>
            <p className="text-sm leading-7 text-[#707b8e]">
              What guests should know.
            </p>
          </div>
          <textarea
            id="studio-event-details"
            rows={3}
            placeholder={studioEventDetailsPlaceholder}
            className="min-h-[108px] w-full resize-none border-0 border-b border-[#dde5f1] bg-transparent px-0 py-2 font-[var(--font-playfair)] text-[1.7rem] leading-[1.35] text-[#262b36] transition-colors focus:border-[#c8d3e6] focus:outline-none focus:ring-0 sm:text-[1.95rem] [&::placeholder]:text-[1.2rem] [&::placeholder]:italic [&::placeholder]:leading-[1.35] [&::placeholder]:text-[#d9dfe9] sm:[&::placeholder]:text-[1.55rem]"
            value={details.detailsDescription}
            onChange={(event) => updateEventDetailsText(event.target.value)}
          />
        </div>

        <div className="space-y-3 rounded-[1.35rem] border border-[#eef2f7] bg-[#fcfdff] px-5 py-4">
          <div className="space-y-1">
            <label className={studioWorkspaceFieldLabelClass} htmlFor="studio-design-idea">
              Design Idea
            </label>
            <p className="text-sm leading-7 text-[#707b8e]">
              {flyerProvidesVisualDirection
                ? "Describe the visual/theme direction for the invite. Flyer uploads can leave this blank if the flyer already sets the look."
                : "Describe the visual/theme direction for the invite."}
            </p>
          </div>
          <textarea
            id="studio-design-idea"
            rows={3}
            placeholder={studioDesignIdeaPlaceholder}
            className="min-h-[108px] w-full resize-none border-0 border-b border-[#dde5f1] bg-transparent px-0 py-2 font-[var(--font-playfair)] text-[1.7rem] leading-[1.35] text-[#262b36] transition-colors focus:border-[#c8d3e6] focus:outline-none focus:ring-0 sm:text-[1.95rem] [&::placeholder]:text-[1.2rem] [&::placeholder]:italic [&::placeholder]:leading-[1.35] [&::placeholder]:text-[#d9dfe9] sm:[&::placeholder]:text-[1.55rem]"
            value={details.theme}
            onChange={(event) => updateDesignIdeaText(event.target.value)}
          />
        </div>

        <p className="text-[11px] uppercase tracking-[0.18em] text-[#96a6c5]">
          <span className="mr-1 text-[#b8c2d4]">*</span>
          {flyerProvidesVisualDirection
            ? "Event Details required. Design Idea optional when a flyer is uploaded."
            : "Event Details and Design Idea required."}
        </p>
      </div>

      {imageFinishPresets.length > 0 ? (
        <div className="space-y-3 border-t border-[#eef2f7] pt-7">
          <label className={studioWorkspaceFieldLabelClass}>Visual Style</label>
          {stylePickerButton}
        </div>
      ) : null}

      {moreDetailFields.length ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowMoreDetails((prev) => !prev)}
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#96a6c5] transition-colors hover:text-[#262b36]"
            aria-expanded={showMoreDetails}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showMoreDetails ? "rotate-180" : ""}`}
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
                isMobileViewport={isMobileViewport}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <StudioOptionalMediaRow
        details={details}
        onRemoveFlyer={onRemoveFlyer}
        onUploadSubjectPhotos={onUploadSubjectPhotos}
        onRemoveSubjectPhoto={onRemoveSubjectPhoto}
        isSubjectPhotoUploading={isSubjectPhotoUploading}
        flyerUploadError={flyerUploadError}
        subjectPhotoUploadError={subjectPhotoUploadError}
      />

      {showStudioCreativeControls ? (
        <div className="space-y-5 rounded-[1.5rem] border border-[#eef2f7] bg-[#fcfdff] p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#96a6c5]">
              Creative Upgrade
            </p>
            <p className="text-sm leading-7 text-[#707b8e]">
              Use these controls when you want the uploaded person transformed into the theme
              instead of simply blended into the scene.
            </p>
          </div>

          <div className="space-y-5 border-t border-[#eef2f7] pt-5">
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#96a6c5]">
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
                      className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                        active
                          ? "border-[#262b36] bg-[#262b36] text-white"
                          : "border-[#e1e7f1] bg-white text-[#6f7c93] hover:border-[#d4dce8]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#96a6c5]">
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
                      className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                        active
                          ? "border-[#262b36] bg-[#262b36] text-white"
                          : "border-[#e1e7f1] bg-white text-[#6f7c93] hover:border-[#d4dce8]"
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
    </div>
  );

  return (
    <motion.div
      key="form"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="mr-auto max-w-[1440px] lg:h-full lg:max-w-none"
    >
      <div className="overflow-hidden rounded-[2rem] border border-[#eef2f7] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.04)] lg:flex lg:h-full lg:min-h-0 lg:w-full lg:rounded-none lg:border-0 lg:shadow-none">
        <section
          className={`relative flex min-h-0 flex-1 flex-col bg-white ${
            isMobileViewport
              ? mobilePane === "composer"
                ? "w-full"
                : "hidden"
              : "lg:w-3/5 lg:flex-none lg:border-r lg:border-[#eff3f8]"
          }`}
        >
          <div className="flex-1 overflow-y-auto px-6 pb-32 pt-7 sm:px-8 lg:px-8 lg:pb-10 lg:pt-10">
            {sharedFormContent}
          </div>

          <div className="hidden border-t border-[#eff3f8] bg-white px-6 py-5 lg:flex lg:justify-end lg:px-8">
            <button
              type="button"
              onClick={() => generateMedia("page")}
              disabled={!isFormValid || isGenerating}
              className="inline-flex min-h-14 w-auto min-w-[16rem] items-center justify-center gap-3 rounded-[1rem] bg-[#131b33] px-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_22px_40px_rgba(19,27,51,0.18)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Layout className="h-5 w-5" />
              )}
              {liveCardActionLabel}
            </button>
          </div>

          {isMobileViewport ? (
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#edf1f7] bg-white/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => generateMedia("page")}
                  disabled={!isFormValid || isGenerating}
                  className="flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-[1.15rem] bg-[#563df0] px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-white shadow-[0_24px_40px_rgba(86,61,240,0.28)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Wand2 className="h-4.5 w-4.5" />
                  )}
                  {liveCardActionLabel}
                </button>
                <button
                  type="button"
                  onClick={showPreviewPane}
                  className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-[1.15rem] border border-[#dfe5f2] bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#31415f] shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-all active:scale-[0.99]"
                >
                  <Layout className="h-4 w-4" />
                  Preview
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside
          className={`relative min-h-0 ${
            isMobileViewport
              ? mobilePane === "preview"
                ? "flex w-full flex-col bg-[#121a34]"
                : "hidden"
              : "flex w-2/5 shrink-0 flex-col bg-[#121a34]"
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(116,132,216,0.15),_transparent_42%),radial-gradient(circle,_rgba(255,255,255,0.06)_1px,_transparent_1px)] [background-size:100%_100%,26px_26px]" />

          {isMobileViewport ? (
            <div className="relative z-10 flex items-center justify-between px-5 pb-2 pt-5">
              <button
                type="button"
                onClick={showPromptComposer}
                className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              {imageFinishPresets.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowStylePicker(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md"
                >
                  <Wand2 className="h-4 w-4" />
                  Style
                </button>
              ) : null}
            </div>
          ) : null}

          {generationNote ? (
            <div className="relative z-10 mx-5 rounded-[1.25rem] border border-white/14 bg-white/10 px-4 py-3 text-sm leading-6 text-white/88 backdrop-blur-md lg:mx-8">
              {generationNote}
            </div>
          ) : null}

          <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 lg:px-8 lg:py-10">
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
              openCurrentLiveCardFullscreen={openCurrentLiveCardFullscreen}
              shareCurrentProject={shareCurrentProject}
              openCurrentImage={openCurrentImage}
              handleMediaImageLoadError={handleMediaImageLoadError}
            />
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {isMobileViewport && showStylePicker ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStylePicker(false)}
              className="fixed inset-0 z-40 bg-[#0e152c]/52 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2.6rem] bg-white px-6 pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))] pt-5 shadow-[0_-30px_70px_rgba(15,23,42,0.22)]"
            >
              <div className="mx-auto mb-8 h-1.5 w-14 rounded-full bg-[#d9e0ec]" />
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[#1b2740]">
                  Select Style
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStylePicker(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f5fa] text-[#93a2c0]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {imageFinishPresets.map((preset) => {
                  const active = selectedImageFinishPreset?.label === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => updateImageFinishPreset(preset.label)}
                      className={`flex min-h-[84px] items-center justify-center rounded-[1.2rem] border px-4 text-center text-[11px] font-semibold uppercase tracking-[0.02em] transition-all ${
                        active
                          ? "border-[#5a43f1] bg-[#5a43f1] text-white shadow-[0_14px_28px_rgba(90,67,241,0.22)]"
                          : "border-[#e7edf6] bg-[#f8faff] text-[#6d80a4]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

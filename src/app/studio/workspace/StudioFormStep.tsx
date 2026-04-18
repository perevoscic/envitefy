"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import {
  DETAILS_DESCRIPTION_PLACEHOLDER,
  SHARED_BASICS,
  STUDIO_COMPACT_CATEGORY_FORM_CONFIG,
} from "../studio-workspace-field-config";
import type { EventDetails } from "../studio-workspace-types";
import { studioWorkspaceShellClass } from "../studio-workspace-ui-classes";
import { StudioFieldGrid, StudioTextAreaField } from "./StudioFieldControls";
import { StudioOptionalMediaRow } from "./StudioOptionalMediaRow";

export type StudioFormStepProps = {
  details: EventDetails;
  setDetails: Dispatch<SetStateAction<EventDetails>>;
  onOpenEditorStep: () => void;
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
};

export function StudioFormStep({
  details,
  setDetails,
  onOpenEditorStep,
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
}: StudioFormStepProps) {
  const shellClass = studioWorkspaceShellClass;
  const formConfig = STUDIO_COMPACT_CATEGORY_FORM_CONFIG[details.category];
  const primaryCategoryFields = formConfig.primaryFields;
  const secondaryCategoryFields = formConfig.secondaryFields || [];
  const sharedPrimaryFields = SHARED_BASICS.filter((field) =>
    ["eventDate", "startTime", "location"].includes(field.key),
  );
  const isBirthday = details.category === "Birthday";
  const birthdayMobileTopRowFields = primaryCategoryFields.filter((field) =>
    ["name", "age"].includes(field.key),
  );
  const birthdayMobileSecondRowFields = primaryCategoryFields.filter(
    (field) => field.key === "rsvpContact",
  );
  const birthdayMobileDateTimeFields = sharedPrimaryFields.filter((field) =>
    ["eventDate", "startTime"].includes(field.key),
  );
  const birthdayMobileLocationFields = sharedPrimaryFields.filter((field) => field.key === "location");

  return (
    <motion.div
      key="form"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="mr-auto max-w-[1100px] space-y-14"
    >
      <div className={`${shellClass} space-y-12`}>
        <div className="space-y-12 pt-6 md:pt-8">
          {primaryCategoryFields.length ? (
            isBirthday ? (
              <>
                <div className="space-y-4 md:hidden">
                  <StudioFieldGrid
                    details={details}
                    setDetails={setDetails}
                    fields={birthdayMobileTopRowFields}
                    columnsClassName="grid grid-cols-2 gap-x-6 gap-y-8"
                  />
                </div>
                <div className="space-y-4 md:hidden">
                  <StudioFieldGrid
                    details={details}
                    setDetails={setDetails}
                    fields={birthdayMobileSecondRowFields}
                    columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8"
                  />
                </div>
                <div className="hidden space-y-4 md:block">
                  <StudioFieldGrid
                    details={details}
                    setDetails={setDetails}
                    fields={primaryCategoryFields}
                    columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-3"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <StudioFieldGrid
                  details={details}
                  setDetails={setDetails}
                  fields={primaryCategoryFields}
                  columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-3"
                />
              </div>
            )
          ) : null}

          {sharedPrimaryFields.length ? (
            isBirthday ? (
              <>
                <div className="space-y-4 md:hidden">
                  <StudioFieldGrid
                    details={details}
                    setDetails={setDetails}
                    fields={birthdayMobileDateTimeFields}
                    columnsClassName="grid grid-cols-2 gap-x-6 gap-y-8"
                  />
                </div>
                <div className="space-y-4 md:hidden">
                  <StudioFieldGrid
                    details={details}
                    setDetails={setDetails}
                    fields={birthdayMobileLocationFields}
                    columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8"
                  />
                </div>
                <div className="hidden space-y-4 md:block">
                  <StudioFieldGrid
                    details={details}
                    setDetails={setDetails}
                    fields={sharedPrimaryFields}
                    columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-[11.5rem_9rem_minmax(0,1fr)]"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <StudioFieldGrid
                  details={details}
                  setDetails={setDetails}
                  fields={sharedPrimaryFields}
                  columnsClassName="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-[11.5rem_9rem_minmax(0,1fr)]"
                />
              </div>
            )
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
            <StudioTextAreaField
              details={details}
              setDetails={setDetails}
              fieldKey="detailsDescription"
              label="Event description"
              placeholder={DETAILS_DESCRIPTION_PLACEHOLDER[details.category]}
              rows={4}
              id="studio-details-description"
            />
          </div>

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
        </div>
      </div>

      <div className="flex flex-col gap-8 border-t border-[#1A1A1A]/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8C7B65]">
            <span className="mr-1 text-[#1A1A1A]/35">*</span> Required fields
          </p>
          <p className="font-[var(--font-playfair)] text-sm italic text-[#8C7B65]">
            Responses typically within 48 hours.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenEditorStep}
          disabled={!isFormValid}
          className="flex items-center justify-center gap-3 bg-[#1A1A1A] px-10 py-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5F2EF] shadow-[0_24px_48px_rgba(26,26,26,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#262626] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {editingId ? "Return to Editor" : "Open Editor"}
          <ChevronRight className="h-4 w-4 text-[#F5F2EF]" />
        </button>
      </div>
    </motion.div>
  );
}

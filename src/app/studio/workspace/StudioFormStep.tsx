"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import type { StudioStep } from "../studio-types";
import {
  CATEGORY_FIELDS,
  DETAILS_DESCRIPTION_PLACEHOLDER,
  RSVP_FIELDS,
  SHARED_BASICS,
} from "../studio-workspace-field-config";
import type { EventDetails } from "../studio-workspace-types";
import { StudioFieldGrid, StudioTextAreaField } from "./StudioFieldControls";
import {
  studioWorkspaceShellClass,
} from "../studio-workspace-ui-classes";

export type StudioFormStepProps = {
  details: EventDetails;
  setDetails: Dispatch<SetStateAction<EventDetails>>;
  setStep: (step: StudioStep) => void;
  isFormValid: () => boolean;
  editingId: string | null;
};

export function StudioFormStep({
  details,
  setDetails,
  setStep,
  isFormValid,
  editingId,
}: StudioFormStepProps) {
  const shellClass = studioWorkspaceShellClass;

  return (
    <motion.div
      key="form"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="mx-auto max-w-[1180px] space-y-10"
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => setStep("category")}
          className="mt-1 rounded-full border border-[#ece4f7] bg-white/90 p-3 text-neutral-700 shadow-[0_12px_24px_rgba(25,20,40,0.08)] transition-all hover:-translate-y-0.5 hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-900" />
        </button>
        <h2 className="font-[var(--font-playfair)] text-4xl tracking-[-0.03em] text-neutral-900 sm:text-[44px]">
          {details.category}
        </h2>
      </div>

      <div className="space-y-8">
        <div className={`${shellClass} space-y-8 px-4 sm:px-6 lg:px-7`}>
          <div className="space-y-10">
            <div className="space-y-4">
              <StudioFieldGrid
                details={details}
                setDetails={setDetails}
                fields={CATEGORY_FIELDS[details.category] || []}
                requiredOnly
              />
            </div>

            <div className="space-y-4 border-t border-[#ece4f7]/80 pt-8">
              <StudioFieldGrid
                details={details}
                setDetails={setDetails}
                fields={SHARED_BASICS}
                requiredOnly
                columnsClassName="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3"
              />
            </div>

            <div className="space-y-3 border-t border-[#ece4f7]/80 pt-8">
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

            <div className="space-y-4 border-t border-[#ece4f7]/80 pt-8">
              <StudioFieldGrid
                details={details}
                setDetails={setDetails}
                fields={RSVP_FIELDS}
                requiredOnly
                columnsClassName="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
          <span className="mr-1 text-[#8a6fdb]">*</span> Required fields
        </p>
        <button
          onClick={() => setStep("studio")}
          disabled={!isFormValid()}
          className="flex items-center gap-3 rounded-full bg-neutral-900 px-10 py-4 text-base font-semibold text-white shadow-[0_20px_50px_rgba(25,20,40,0.18)] transition-all hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {editingId ? "Update Invitation" : "Enter Studio"}
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
      </div>
    </motion.div>
  );
}

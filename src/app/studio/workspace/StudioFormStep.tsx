"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import type { StudioStep } from "../studio-types";
import { inputValue } from "../studio-workspace-builders";
import {
  CATEGORY_FIELDS,
  DETAILS_DESCRIPTION_PLACEHOLDER,
  RSVP_FIELDS,
  SHARED_BASICS,
} from "../studio-workspace-field-config";
import type { EventDetails } from "../studio-workspace-types";
import {
  studioWorkspaceFieldLabelClass,
  studioWorkspaceIconInputClass,
  studioWorkspaceInputClass,
  studioWorkspaceShellClass,
  studioWorkspaceTextAreaClass,
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
  const fieldLabelClass = studioWorkspaceFieldLabelClass;
  const inputClass = studioWorkspaceInputClass;
  const iconInputClass = studioWorkspaceIconInputClass;
  const textAreaClass = studioWorkspaceTextAreaClass;

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
              <div className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2 lg:grid-cols-3">
                {(CATEGORY_FIELDS[details.category] || [])
                  .filter((field) => field.required)
                  .map((field) => (
                    <div
                      key={field.key}
                      className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2 lg:col-span-3" : ""}`}
                    >
                      <label className={fieldLabelClass}>
                        {field.label} <span className="text-[#8a6fdb]">*</span>
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          placeholder={field.placeholder}
                          className={textAreaClass}
                          value={String(inputValue(details[field.key]))}
                          onChange={(event) =>
                            setDetails((prev) => ({
                              ...prev,
                              [field.key]: event.target.value,
                            }))
                          }
                        />
                      ) : field.type === "select" ? (
                        <select
                          className={`${inputClass} appearance-none`}
                          value={String(inputValue(details[field.key]))}
                          onChange={(event) =>
                            setDetails((prev) => ({
                              ...prev,
                              [field.key]: event.target.value as EventDetails[typeof field.key],
                            }))
                          }
                        >
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className={inputClass}
                          value={String(inputValue(details[field.key]))}
                          onChange={(event) =>
                            setDetails((prev) => ({
                              ...prev,
                              [field.key]: event.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-[#ece4f7]/80 pt-8">
              <div className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                {SHARED_BASICS.filter((field) => field.required).map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className={fieldLabelClass}>
                      {field.label} <span className="text-[#8a6fdb]">*</span>
                    </label>
                    <div className="relative">
                      {field.key === "startTime" ? (
                        <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      ) : null}
                      {field.key === "location" ? (
                        <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      ) : null}
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        className={`${iconInputClass} ${
                          field.key === "startTime" || field.key === "location" ? "pl-12" : "px-4"
                        }`}
                        value={String(inputValue(details[field.key]))}
                        onChange={(event) =>
                          setDetails((prev) => ({ ...prev, [field.key]: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-[#ece4f7]/80 pt-8">
              <label className={fieldLabelClass} htmlFor="studio-details-description">
                Event description
              </label>
              <textarea
                id="studio-details-description"
                placeholder={DETAILS_DESCRIPTION_PLACEHOLDER[details.category]}
                className={textAreaClass}
                value={details.detailsDescription}
                onChange={(event) =>
                  setDetails((prev) => ({
                    ...prev,
                    detailsDescription: event.target.value,
                  }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-4 border-t border-[#ece4f7]/80 pt-8">
              <div className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                {RSVP_FIELDS.filter((field) => field.required).map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className={fieldLabelClass}>
                      {field.label} <span className="text-[#8a6fdb]">*</span>
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className={inputClass}
                      value={String(inputValue(details[field.key]))}
                      onChange={(event) =>
                        setDetails((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
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

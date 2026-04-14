"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Images,
  Loader2,
  MapPin,
  X,
} from "lucide-react";
import { type Dispatch, type SetStateAction, useRef, useState } from "react";
import {
  getUploadAcceptAttribute,
  uploadMediaFile,
  validateClientUploadFile,
} from "@/utils/media-upload-client";
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
import { STUDIO_GUEST_IMAGE_URL_MAX } from "../studio-workspace-utils";

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

  const guestImageInputRef = useRef<HTMLInputElement>(null);
  const [guestImageBusy, setGuestImageBusy] = useState(false);
  const [guestImageError, setGuestImageError] = useState<string | null>(null);

  async function handleGuestImageFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setGuestImageError(null);
    const validationError = validateClientUploadFile(file, "header");
    if (validationError) {
      setGuestImageError(validationError);
      return;
    }
    if (details.guestImageUrls.length >= STUDIO_GUEST_IMAGE_URL_MAX) {
      setGuestImageError(`You can add up to ${STUDIO_GUEST_IMAGE_URL_MAX} photos.`);
      return;
    }
    setGuestImageBusy(true);
    try {
      const upload = await uploadMediaFile({ file, usage: "header" });
      const url = upload.stored.display?.url || upload.eventMedia.thumbnail || "";
      if (!url) throw new Error("Upload did not return an image URL.");
      setDetails((prev) => ({
        ...prev,
        guestImageUrls: [...prev.guestImageUrls, url].slice(0, STUDIO_GUEST_IMAGE_URL_MAX),
      }));
    } catch (err) {
      setGuestImageError(
        err instanceof Error && err.message.trim() ? err.message.trim() : "Upload failed.",
      );
    } finally {
      setGuestImageBusy(false);
      if (guestImageInputRef.current) guestImageInputRef.current.value = "";
    }
  }

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
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Main fields
            </p>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#f4edff] p-3 text-[#8a6fdb]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-900">
                  Core fields
                </h3>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {details.category}
              </p>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                When &amp; where
              </p>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                RSVP
              </p>
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

            <div className="space-y-3 border-t border-[#ece4f7]/80 pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Optional
              </p>
              <label className={fieldLabelClass} htmlFor="studio-event-photos-input">
                Photos for your invite
              </label>
              <input
                ref={guestImageInputRef}
                id="studio-event-photos-input"
                type="file"
                accept={getUploadAcceptAttribute("header")}
                className="hidden"
                disabled={guestImageBusy}
                onChange={(event) => handleGuestImageFiles(event.target.files)}
              />
              <div className="flex flex-wrap gap-3">
                {details.guestImageUrls.map((url) => (
                  <div
                    key={url}
                    className="relative h-24 w-24 overflow-hidden rounded-2xl border border-[#e8e0f5] bg-neutral-100 shadow-sm"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDetails((prev) => ({
                          ...prev,
                          guestImageUrls: prev.guestImageUrls.filter((u) => u !== url),
                        }))
                      }
                      className="absolute right-1 top-1 rounded-full bg-neutral-900/80 p-1 text-white shadow hover:bg-neutral-900"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {details.guestImageUrls.length < STUDIO_GUEST_IMAGE_URL_MAX ? (
                  <button
                    type="button"
                    disabled={guestImageBusy}
                    onClick={() => guestImageInputRef.current?.click()}
                    className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[#d4c8ec] bg-white/80 text-[11px] font-semibold text-[#8a6fdb] transition hover:border-[#8a6fdb] hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {guestImageBusy ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Images className="h-6 w-6" />
                    )}
                    Add photo
                  </button>
                ) : null}
              </div>
              {guestImageError ? <p className="text-sm text-red-600">{guestImageError}</p> : null}
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

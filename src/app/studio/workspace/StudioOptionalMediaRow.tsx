"use client";

import { Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { getUploadAcceptAttribute } from "@/utils/media-upload-client";
import { clean } from "../studio-workspace-builders";
import type { EventDetails, InviteCategory } from "../studio-workspace-types";
import {
  STUDIO_OPEN_HOUSE_PROPERTY_IMAGE_URL_MAX,
  STUDIO_OPEN_HOUSE_REALTOR_IMAGE_URL_MAX,
  STUDIO_OPEN_HOUSE_REALTOR_LOGO_URL_MAX,
} from "../studio-workspace-utils";

type StudioOptionalMediaRowProps = {
  details: EventDetails;
  onRemoveFlyer: () => void;
  onUploadSubjectPhotos: (files: File[]) => Promise<void>;
  onRemoveSubjectPhoto: (index: number) => void;
  onUploadPropertyPhotos: (files: File[]) => Promise<void>;
  onRemovePropertyPhoto: (index: number) => void;
  onUploadRealtorPhoto: (files: File[]) => Promise<void>;
  onRemoveRealtorPhoto: (index: number) => void;
  onUploadRealtorLogo: (files: File[]) => Promise<void>;
  onRemoveRealtorLogo: (index: number) => void;
  isSubjectPhotoUploading: boolean;
  flyerUploadError: string | null;
  subjectPhotoUploadError: string | null;
};

function getSubjectPhotoCopy(category: InviteCategory) {
  switch (category) {
    case "Birthday":
      return {
        title: "Add child photo(s)",
      };
    case "Wedding":
    case "Anniversary":
      return {
        title: "Add couple photo(s)",
      };
    case "Baby Shower":
    case "Bridal Shower":
    case "Housewarming":
      return {
        title: "Add honoree photo(s)",
      };
    default:
      return {
        title: "Add subject photo(s)",
      };
  }
}

export function StudioOptionalMediaRow({
  details,
  onRemoveFlyer,
  onUploadSubjectPhotos,
  onRemoveSubjectPhoto,
  onUploadPropertyPhotos,
  onRemovePropertyPhoto,
  onUploadRealtorPhoto,
  onRemoveRealtorPhoto,
  onUploadRealtorLogo,
  onRemoveRealtorLogo,
  isSubjectPhotoUploading,
  flyerUploadError,
  subjectPhotoUploadError,
}: StudioOptionalMediaRowProps) {
  const subjectPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const propertyPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const realtorPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const realtorLogoInputRef = useRef<HTMLInputElement | null>(null);
  const accept = getUploadAcceptAttribute("header");
  const subjectPhotoCopy = getSubjectPhotoCopy(details.category);
  const flyerPreviewUrl = clean(details.sourceFlyerPreviewUrl) || clean(details.sourceFlyerUrl);
  const flyerActive = details.sourceMediaMode === "flyer" && Boolean(clean(details.sourceFlyerUrl));
  const subjectPhotos = details.guestImageUrls.filter((url) => clean(url));
  const propertyPhotos = details.propertyImageUrls.filter((url) => clean(url));
  const realtorPhotos = details.realtorImageUrls.filter((url) => clean(url));
  const realtorLogos = details.realtorLogoUrls.filter((url) => clean(url));
  const isOpenHouse = details.category === "Open House";
  const flyerHasDetail = Boolean(
    flyerPreviewUrl || clean(details.sourceFlyerName) || flyerUploadError,
  );
  const subjectPhotoHasDetail = Boolean(
    subjectPhotos.length > 0 ||
      propertyPhotos.length > 0 ||
      realtorPhotos.length > 0 ||
      realtorLogos.length > 0 ||
      subjectPhotoUploadError,
  );

  return (
    <div className="space-y-5 border-t border-[#eef2f7] pt-8">
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#96a6c5]">
          Optional image source
        </p>

        <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
          <div className="space-y-2 lg:col-span-6">
            <p className="max-w-3xl text-[13px] leading-8 text-[#4d5565]">
              {isOpenHouse
                ? "Add house photos for the generated real-estate poster. Realtor photo and company logo uploads are optional app UI assets for the Realtor and Logo tabs, not flyer artwork."
                : "Add photo(s) to design the invitation around the people or subject you're celebrating. If this live card started from an uploaded invite, that original art stays attached and its extracted Event Details carry through here."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:col-span-6 lg:grid-cols-1">
            {isOpenHouse ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => propertyPhotoInputRef.current?.click()}
                  disabled={
                    isSubjectPhotoUploading ||
                    propertyPhotos.length >= STUDIO_OPEN_HOUSE_PROPERTY_IMAGE_URL_MAX
                  }
                  className="inline-flex min-h-[2.95rem] w-full items-center justify-center gap-2 rounded-full border border-[#2f3440] bg-white px-4 py-3 text-[10px] font-medium uppercase tracking-[0.22em] text-[#2b303b] transition-colors hover:bg-[#fafbfc] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4 text-[#2b303b]" />
                  House Photos
                </button>
                <button
                  type="button"
                  onClick={() => realtorPhotoInputRef.current?.click()}
                  disabled={
                    isSubjectPhotoUploading ||
                    realtorPhotos.length >= STUDIO_OPEN_HOUSE_REALTOR_IMAGE_URL_MAX
                  }
                  className="inline-flex min-h-[2.95rem] w-full items-center justify-center gap-2 rounded-full border border-[#d6dde8] bg-white px-4 py-3 text-[10px] font-medium uppercase tracking-[0.22em] text-[#5d687a] transition-colors hover:bg-[#fafbfc] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4 text-[#5d687a]" />
                  Realtor Photo
                </button>
                <button
                  type="button"
                  onClick={() => realtorLogoInputRef.current?.click()}
                  disabled={
                    isSubjectPhotoUploading ||
                    realtorLogos.length >= STUDIO_OPEN_HOUSE_REALTOR_LOGO_URL_MAX
                  }
                  className="inline-flex min-h-[2.95rem] w-full items-center justify-center gap-2 rounded-full border border-[#d6dde8] bg-white px-4 py-3 text-[10px] font-medium uppercase tracking-[0.22em] text-[#5d687a] transition-colors hover:bg-[#fafbfc] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4 text-[#5d687a]" />
                  Logo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => subjectPhotoInputRef.current?.click()}
                disabled={isSubjectPhotoUploading}
                className="inline-flex min-h-[2.95rem] w-full items-center justify-center gap-2 rounded-full border border-[#2f3440] bg-white px-4 py-3 text-[10px] font-medium uppercase tracking-[0.34em] text-[#2b303b] transition-colors hover:bg-[#fafbfc] disabled:opacity-50"
              >
                <Upload className="h-4 w-4 text-[#2b303b]" />
                Photos
              </button>
            )}
          </div>
        </div>
      </div>

      {flyerHasDetail || subjectPhotoHasDetail ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            {flyerPreviewUrl ? (
              <div className="overflow-hidden rounded-[1.25rem] border border-[#e7edf7] bg-[#f7faff]">
                <img
                  src={flyerPreviewUrl}
                  alt={details.sourceFlyerName || "Uploaded flyer preview"}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            ) : null}

            {clean(details.sourceFlyerName) ? (
              <p className="mt-3 truncate text-sm italic text-[#7f8dab]">
                {details.sourceFlyerName}
              </p>
            ) : null}

            {flyerUploadError ? (
              <p className="mt-3 text-sm text-[#a4564f]">{flyerUploadError}</p>
            ) : null}

            {flyerActive ? (
              <button
                type="button"
                onClick={onRemoveFlyer}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#e2e8f4] bg-transparent px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7f8dab] transition-colors hover:bg-[#f7faff]"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            ) : null}
          </div>

          <div>
            {isOpenHouse && propertyPhotos.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96a6c5]">
                  House Photos
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {propertyPhotos.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="group relative overflow-hidden rounded-[1rem] border border-[#e7edf7] bg-[#f7faff]"
                    >
                      <img
                        src={url}
                        alt={`House reference ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => onRemovePropertyPhoto(index)}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Remove house photo ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {isOpenHouse && realtorPhotos.length > 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96a6c5]">
                  Realtor Photo
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {realtorPhotos.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="group relative overflow-hidden rounded-[1rem] border border-[#e7edf7] bg-[#f7faff]"
                    >
                      <img
                        src={url}
                        alt={`Realtor reference ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveRealtorPhoto(index)}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Remove realtor photo ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {isOpenHouse && realtorLogos.length > 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96a6c5]">
                  Company Logo
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {realtorLogos.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-[1rem] border border-[#e7edf7] bg-white p-3"
                    >
                      <img
                        src={url}
                        alt={`Realtor company logo ${index + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveRealtorLogo(index)}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Remove realtor company logo ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {!isOpenHouse && subjectPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {subjectPhotos.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="group relative overflow-hidden rounded-[1rem] border border-[#e7edf7] bg-[#f7faff]"
                  >
                    <img
                      src={url}
                      alt={`${subjectPhotoCopy.title} ${index + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveSubjectPhoto(index)}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove ${subjectPhotoCopy.title} ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {subjectPhotoUploadError ? (
              <p className="mt-3 text-sm text-[#a4564f]">{subjectPhotoUploadError}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <input
        ref={subjectPhotoInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files) : [];
          if (files.length > 0) {
            void onUploadSubjectPhotos(files);
          }
          event.target.value = "";
        }}
      />
      <input
        ref={propertyPhotoInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files) : [];
          if (files.length > 0) {
            void onUploadPropertyPhotos(files);
          }
          event.target.value = "";
        }}
      />
      <input
        ref={realtorPhotoInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files).slice(0, 1) : [];
          if (files.length > 0) {
            void onUploadRealtorPhoto(files);
          }
          event.target.value = "";
        }}
      />
      <input
        ref={realtorLogoInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files).slice(0, 1) : [];
          if (files.length > 0) {
            void onUploadRealtorLogo(files);
          }
          event.target.value = "";
        }}
      />
    </div>
  );
}

"use client";

import { FileImage, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { getUploadAcceptAttribute } from "@/utils/media-upload-client";
import { clean } from "../studio-workspace-builders";
import type { EventDetails, InviteCategory } from "../studio-workspace-types";
import { STUDIO_GUEST_IMAGE_URL_MAX } from "../studio-workspace-utils";

type StudioOptionalMediaRowProps = {
  details: EventDetails;
  onUploadFlyer: (file: File) => Promise<void>;
  onRemoveFlyer: () => void;
  onUploadSubjectPhotos: (files: File[]) => Promise<void>;
  onRemoveSubjectPhoto: (index: number) => void;
  isFlyerUploading: boolean;
  isSubjectPhotoUploading: boolean;
  flyerUploadError: string | null;
  subjectPhotoUploadError: string | null;
};

function getSubjectPhotoCopy(category: InviteCategory) {
  switch (category) {
    case "Birthday":
      return {
        title: "Add child photo(s)",
        description: "Use the kid's photo(s) and we will design the invitation around them.",
      };
    case "Wedding":
    case "Anniversary":
      return {
        title: "Add couple photo(s)",
        description: "Use couple portraits and we will build the invitation around them.",
      };
    case "Baby Shower":
    case "Bridal Shower":
    case "Housewarming":
      return {
        title: "Add honoree photo(s)",
        description: "Use honoree photo(s) and we will create the invitation around them.",
      };
    default:
      return {
        title: "Add subject photo(s)",
        description: "Use subject photo(s) and we will create the invitation around them.",
      };
  }
}

export function StudioOptionalMediaRow({
  details,
  onUploadFlyer,
  onRemoveFlyer,
  onUploadSubjectPhotos,
  onRemoveSubjectPhoto,
  isFlyerUploading,
  isSubjectPhotoUploading,
  flyerUploadError,
  subjectPhotoUploadError,
}: StudioOptionalMediaRowProps) {
  const flyerInputRef = useRef<HTMLInputElement | null>(null);
  const subjectPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const accept = getUploadAcceptAttribute("header");
  const subjectPhotoCopy = getSubjectPhotoCopy(details.category);
  const flyerPreviewUrl = clean(details.sourceFlyerPreviewUrl) || clean(details.sourceFlyerUrl);
  const flyerActive = details.sourceMediaMode === "flyer" && Boolean(clean(details.sourceFlyerUrl));
  const subjectPhotos = details.guestImageUrls.filter((url) => clean(url));
  const subjectPhotoActive =
    details.sourceMediaMode === "subjectPhotos" && subjectPhotos.length > 0;

  return (
    <div className="space-y-4 border-t border-[#1A1A1A]/8 pt-8">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
          Optional image source
        </p>
        <p className="max-w-3xl text-sm leading-7 text-[#6B5E4E]">
          Upload an existing invite to convert it into a live card, or add photo(s) so the new
          design is built around them.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className={`rounded-[1.5rem] border p-5 transition-colors ${
            flyerActive
              ? "border-[#cdb79c] bg-[#fbf6f0]"
              : "border-[#ddd1c4]/85 bg-[#fbf8f4]"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#1A1A1A]">
                <FileImage className="h-4 w-4" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                  Upload existing flyer / invitation
                </p>
              </div>
              <p className="text-sm leading-7 text-[#6B5E4E]">
                We will read the invite, preserve its visual direction, and add live-card buttons.
              </p>
            </div>
            {isFlyerUploading ? <Loader2 className="h-4 w-4 animate-spin text-[#8C7B65]" /> : null}
          </div>

          {flyerPreviewUrl ? (
            <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#e3d6c8] bg-[#f4ede4]">
              <img
                src={flyerPreviewUrl}
                alt={details.sourceFlyerName || "Uploaded flyer preview"}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          ) : null}

          {clean(details.sourceFlyerName) ? (
            <p className="mt-3 truncate text-sm italic text-[#8C7B65]">{details.sourceFlyerName}</p>
          ) : null}

          {flyerUploadError ? (
            <p className="mt-3 text-sm text-[#a4564f]">{flyerUploadError}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => flyerInputRef.current?.click()}
              disabled={isFlyerUploading}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8cdc0] bg-[#fdfaf6] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1A1A1A] transition-colors hover:bg-white disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {flyerActive ? "Replace flyer" : "Upload flyer"}
            </button>
            {flyerActive ? (
              <button
                type="button"
                onClick={onRemoveFlyer}
                className="inline-flex items-center gap-2 rounded-full border border-[#ead9cd] bg-transparent px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65] transition-colors hover:bg-[#f9f2eb]"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            ) : null}
          </div>

          <input
            ref={flyerInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void onUploadFlyer(file);
              }
              event.target.value = "";
            }}
          />
        </div>

        <div
          className={`rounded-[1.5rem] border p-5 transition-colors ${
            subjectPhotoActive
              ? "border-[#cdb79c] bg-[#fbf6f0]"
              : "border-[#ddd1c4]/85 bg-[#fbf8f4]"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#1A1A1A]">
                <ImagePlus className="h-4 w-4" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                  {subjectPhotoCopy.title}
                </p>
              </div>
              <p className="text-sm leading-7 text-[#6B5E4E]">{subjectPhotoCopy.description}</p>
            </div>
            {isSubjectPhotoUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#8C7B65]" />
            ) : null}
          </div>

          {subjectPhotos.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {subjectPhotos.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="group relative overflow-hidden rounded-[1rem] border border-[#e3d6c8] bg-[#f4ede4]"
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

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => subjectPhotoInputRef.current?.click()}
              disabled={isSubjectPhotoUploading}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8cdc0] bg-[#fdfaf6] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1A1A1A] transition-colors hover:bg-white disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {subjectPhotos.length > 0 ? "Add photo(s)" : "Upload photo(s)"}
            </button>
            {subjectPhotos.length > 0 ? (
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#8C7B65]">
                {subjectPhotos.length} / {STUDIO_GUEST_IMAGE_URL_MAX}
              </p>
            ) : null}
          </div>

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
        </div>
      </div>
    </div>
  );
}

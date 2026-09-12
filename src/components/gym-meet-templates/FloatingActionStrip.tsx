/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import { ExternalLink, Eye, Pencil, Share2 } from "lucide-react";
import CalendarAction from "@/components/CalendarAction";

export default function FloatingActionStrip({
  buttonClass,
  onShare,
  onGoogleCalendar,
  onAppleCalendar,
  onOutlookCalendar,
  onMobileEdit,
  onPreview,
  mobileEditHref,
  resourcesHref,
}: {
  buttonClass: string;
  onShare: () => void;
  onGoogleCalendar: () => void;
  onAppleCalendar: () => void;
  onOutlookCalendar: () => void;
  onMobileEdit?: () => void;
  onPreview?: () => void;
  mobileEditHref?: string;
  resourcesHref?: string;
}) {
  const resolvedButtonClass = `${buttonClass} min-h-11 bg-current/10 backdrop-blur-sm hover:bg-current/15 max-sm:size-11 max-sm:min-w-11 max-sm:gap-0! max-sm:p-0!`;

  return (
    <div className="flex w-full flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={onShare}
        className={resolvedButtonClass}
        aria-label="Share event"
        title="Share event"
      >
        <Share2 size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Share</span>
      </button>
      <CalendarAction
        className={resolvedButtonClass}
        labelClassName="hidden sm:inline"
        onChoose={(provider) => {
          if (provider === "google") onGoogleCalendar();
          else if (provider === "apple") onAppleCalendar();
          else onOutlookCalendar();
        }}
      />
      {onMobileEdit ? (
        <span className="md:hidden">
          <button
            type="button"
            onClick={onMobileEdit}
            className={`${resolvedButtonClass} size-11 min-w-11 gap-0! p-0!`}
            aria-label="Edit event"
            title="Edit event"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
        </span>
      ) : mobileEditHref ? (
        <span className="lg:hidden">
          <a
            href={mobileEditHref}
            target="_top"
            className={`${resolvedButtonClass} size-11 min-w-11 gap-0! p-0!`}
            aria-label="Edit event"
            title="Edit event"
          >
            <Pencil size={16} aria-hidden="true" />
          </a>
        </span>
      ) : null}
      {onPreview ? (
        <span className="hidden md:block">
          <button
            type="button"
            onClick={onPreview}
            className={resolvedButtonClass}
            aria-label="Preview event"
            title="Preview event"
          >
            <Eye size={16} aria-hidden="true" />
            <span>Preview</span>
          </button>
        </span>
      ) : null}
      {resourcesHref ? (
        <a
          href={resourcesHref}
          className={resolvedButtonClass}
          aria-label="Resources"
          title="Resources"
        >
          <span className="hidden sm:inline">Resources</span>
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

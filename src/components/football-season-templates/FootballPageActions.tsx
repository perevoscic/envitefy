"use client";

import { Eye, Pencil, Share2 } from "lucide-react";
import { useState } from "react";
import CalendarAction from "@/components/CalendarAction";
import { buildOwnerEventPreviewHref } from "@/lib/event-preview-viewport";
import { buildCalendarLinks } from "@/utils/calendar-links";

export default function FootballPageActions({
  title,
  start,
  end,
  description,
  location,
  timezone,
  shareUrl,
  onEdit,
  onPreview,
  previewHref,
  editHref,
}: {
  title: string;
  start?: string | null;
  end?: string | null;
  description?: string;
  location?: string;
  timezone?: string;
  shareUrl?: string;
  onEdit?: () => void;
  onPreview?: () => void;
  previewHref?: string;
  editHref?: string;
}) {
  const [message, setMessage] = useState("");
  const [copyUrl, setCopyUrl] = useState("");
  const links =
    start && Number.isFinite(Date.parse(start))
      ? buildCalendarLinks({
          title,
          startIso: start,
          endIso: end || start,
          description: description || "",
          location: location || "",
          timezone,
          eventUrl: shareUrl,
          allDay: /^\d{4}-\d{2}-\d{2}$/.test(start),
          reminders: null,
          recurrence: null,
        })
      : null;
  const buttonClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-white/70 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 max-sm:size-11 max-sm:p-0";
  const share = async () => {
    if (!shareUrl) {
      setMessage("Publish your event to get a shareable link.");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Event link copied.");
    } catch {
      setCopyUrl(shareUrl);
    }
  };
  return (
    <div className="relative z-30 max-w-full">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {onPreview ? <button type="button" className={buttonClass} onClick={onPreview} aria-label="Preview event"><Eye size={16} aria-hidden="true" /><span className="hidden sm:inline">Preview</span></button> : previewHref ? (
          <a href={buildOwnerEventPreviewHref(previewHref)} target="_top" className={buttonClass} aria-label="Preview event" title="Preview event">
            <Eye size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Preview</span>
          </a>
        ) : null}
        <button
          type="button"
          className={buttonClass}
          onClick={() => void share()}
          aria-label="Share event"
        >
          <Share2 size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Share</span>
        </button>
        {links ? (
          <CalendarAction links={links} className={buttonClass} labelClassName="hidden sm:inline" />
        ) : null}
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className={`${buttonClass} md:hidden`}
            aria-label="Edit event"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
        ) : editHref ? (
          <a
            href={editHref}
            target="_top"
            className={`${buttonClass} md:hidden`}
            aria-label="Edit event"
          >
            <Pencil size={16} aria-hidden="true" />
          </a>
        ) : null}
      </div>
      {message ? (
        <p role="status" className="mt-2 max-w-sm rounded-xl bg-white/95 p-3 text-right text-sm text-slate-800 shadow-sm">
          {message}
        </p>
      ) : null}
      {copyUrl ? (
        <label className="mt-2 block max-w-sm rounded-xl bg-white/95 p-3 text-sm text-slate-800 shadow-sm">
          Copy event link
          <input
            readOnly
            value={copyUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-1 w-full rounded-lg border border-current bg-transparent p-2"
          />
        </label>
      ) : null}
    </div>
  );
}

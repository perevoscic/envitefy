"use client";

import { MessageSquare, Type, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { CATEGORY_FIELDS, DETAILS_DESCRIPTION_PLACEHOLDER, RSVP_FIELDS, SHARED_BASICS } from "../studio-workspace-field-config";
import type { EventDetails, MediaItem } from "../studio-workspace-types";
import { StudioFieldGrid, StudioTextAreaField } from "./StudioFieldControls";

type LiveCardTextEditorProps = {
  item: MediaItem;
  details: EventDetails;
  setDetails: Dispatch<SetStateAction<EventDetails>>;
  onClose: () => void;
  onSave: () => void;
};

export function LiveCardTextEditor({
  item,
  details,
  setDetails,
  onClose,
  onSave,
}: LiveCardTextEditorProps) {
  return (
    <div className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/10 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
            <Type className="h-3.5 w-3.5" />
            Edit Text
          </div>
          <p className="mt-3 text-sm font-semibold text-white">{item.data?.title || item.theme}</p>
          <p className="mt-1 text-xs text-white/65">
            Update the canonical card fields. The background image stays unchanged.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close text editor"
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
            Event Copy
          </p>
          <StudioFieldGrid
            details={details}
            setDetails={setDetails}
            fields={CATEGORY_FIELDS[details.category] || []}
            columnsClassName="grid grid-cols-1 gap-x-4 gap-y-5"
          />
        </div>

        <div className="space-y-3 border-t border-white/10 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
            Schedule
          </p>
          <StudioFieldGrid
            details={details}
            setDetails={setDetails}
            fields={SHARED_BASICS}
            columnsClassName="grid grid-cols-1 gap-x-4 gap-y-5"
          />
        </div>

        <div className="space-y-3 border-t border-white/10 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
            RSVP
          </p>
          <StudioFieldGrid
            details={details}
            setDetails={setDetails}
            fields={RSVP_FIELDS}
            columnsClassName="grid grid-cols-1 gap-x-4 gap-y-5"
          />
        </div>

        <div className="space-y-4 border-t border-white/10 pt-6">
          <StudioTextAreaField
            details={details}
            setDetails={setDetails}
            fieldKey="detailsDescription"
            label="Event description"
            placeholder={DETAILS_DESCRIPTION_PLACEHOLDER[details.category]}
            rows={4}
            id="live-card-details-description"
          />
          <StudioTextAreaField
            details={details}
            setDetails={setDetails}
            fieldKey="message"
            label="Message from host"
            placeholder="e.g. We can't wait to celebrate with you."
            rows={3}
            id="live-card-host-message"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-4">
        <div className="inline-flex items-center gap-2 text-xs text-white/60">
          <MessageSquare className="h-4 w-4" />
          Saves locally and refreshes the shared card on next publish.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            Save Text
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import styles from "@/components/EventCreateWysiwyg.module.css";
import { EVENT_CATEGORIES } from "@/components/event-templates/eventCategories";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
};

export default function EventCategoryTemplateModal({
  open,
  onClose,
  onSelect,
}: Props) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={() => onClose()}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-50 w-full sm:max-w-xl sm:rounded-xl bg-surface border border-border shadow-xl sm:mx-auto max-h-[calc(100vh-2rem)] flex flex-col min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 sm:px-5 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold">
            Choose a template
          </h3>
          <p className="mt-1 text-sm text-foreground/70">
            Pick the event type to start with the right fields and styling.
          </p>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EVENT_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelect(c.key)}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 text-left hover:border-foreground/40 hover:bg-surface"
            >
              <span className={styles.cardIcon} aria-hidden="true">
                {c.icon}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{c.label}</span>
                {c.hint && (
                  <span className="mt-0.5 block text-xs text-foreground/70">
                    {c.hint}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-foreground border border-border rounded-md hover:bg-surface"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

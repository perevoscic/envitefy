"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";

type StudioIdeaComposerProps = {
  mode: "panel" | "sheet";
  isOpen?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onOpenEventDetails: () => void;
  isSubmitting: boolean;
  onClose?: () => void;
};

function ComposerBody({
  value,
  onChange,
  onSubmit,
  onOpenEventDetails,
  isSubmitting,
}: Omit<StudioIdeaComposerProps, "mode" | "isOpen" | "onClose">) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8C7B65]">
          Edit Idea
        </p>
        <h3 className="text-xl font-semibold text-[var(--studio-ink,#1A1A1A)]">
          Change the theme without reopening the whole form
        </h3>
        <p className="text-sm leading-6 text-[#5F5345]">
          Update the invitation idea, mood, or visual direction. Dates, names, RSVP, and the rest
          of the structured event details stay untouched unless you open full event details.
        </p>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe the invitation vibe, scene, style, or theme you want."
        className="min-h-[152px] w-full rounded-[1.75rem] border border-[#d8cdc0] bg-white/95 px-5 py-4 text-sm leading-6 text-[var(--studio-ink,#1A1A1A)] shadow-[0_16px_36px_rgba(31,18,52,0.06)] outline-none transition focus:border-[#8C7B65] focus:ring-2 focus:ring-[#cbb698]/35"
      />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--studio-brand,#1A1A1A)] px-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white shadow-[0_18px_36px_rgba(31,18,52,0.18)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Update Preview
        </button>
        <button
          type="button"
          onClick={onOpenEventDetails}
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#d8cdc0] bg-white text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-ink,#1A1A1A)] shadow-[0_10px_24px_rgba(31,18,52,0.08)] transition-colors hover:bg-[#fcfaf7]"
        >
          Edit Event Details
        </button>
      </div>
    </div>
  );
}

export function StudioIdeaComposer({
  mode,
  isOpen = true,
  value,
  onChange,
  onSubmit,
  onOpenEventDetails,
  isSubmitting,
  onClose,
}: StudioIdeaComposerProps) {
  if (mode === "panel") {
    return (
      <div className="rounded-[2rem] border border-[#ddd5cb] bg-[#f7f2ea]/88 p-5 shadow-[0_18px_50px_rgba(31,18,52,0.08)]">
        <ComposerBody
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onOpenEventDetails={onOpenEventDetails}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-end bg-[rgba(16,10,7,0.38)] backdrop-blur-[8px]"
        >
          <button
            type="button"
            aria-label="Close idea composer"
            className="absolute inset-0"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative z-10 w-full rounded-t-[2rem] border-t border-[#ddd5cb] bg-[#f4f1fb] px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-5 shadow-[0_-18px_60px_rgba(31,18,52,0.18)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="h-1.5 w-14 rounded-full bg-[#cabfb0]" />
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8cdc0] bg-white/90 text-[var(--studio-ink,#1A1A1A)] shadow-[0_10px_24px_rgba(31,18,52,0.08)] transition-colors hover:bg-white"
                aria-label="Dismiss composer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ComposerBody
              value={value}
              onChange={onChange}
              onSubmit={onSubmit}
              onOpenEventDetails={onOpenEventDetails}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

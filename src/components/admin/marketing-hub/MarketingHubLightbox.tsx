"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Frame } from "@/lib/admin/marketing-hub";

export function MarketingHubLightbox({
  frame,
  onClose,
}: {
  frame: Frame | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {frame?.imageUrl ? (
        <motion.div
          key="frame-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#110d1c]/90 p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative flex max-h-[92dvh] w-full max-w-6xl flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 text-white">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/60">
                  Frame {frame.frameNumber}
                </div>
                <div className="mt-1 truncate text-xl font-bold">{frame.title}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                aria-label="Close image lightbox"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 justify-center overflow-hidden rounded-[18px] bg-black">
              <img
                src={frame.imageUrl}
                alt={`Frame ${frame.frameNumber}`}
                className="max-h-[78dvh] w-auto max-w-full object-contain"
              />
            </div>
            {frame.caption.text ? (
              <div className="rounded-[16px] bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white">
                {frame.caption.text}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

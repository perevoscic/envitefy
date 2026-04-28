"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import type { StudioCreateStep } from "../studio-types";
import type { EventDetails } from "../studio-workspace-types";

type StudioCreateFlowProps = {
  createStep: StudioCreateStep;
  details: EventDetails;
  onOpenTypeStep: () => void;
  typeContent: ReactNode;
  detailsContent: ReactNode;
};

export function StudioCreateFlow({
  createStep,
  details,
  onOpenTypeStep,
  typeContent,
  detailsContent,
}: StudioCreateFlowProps) {
  if (createStep === "type") {
    return (
      <div className="min-h-0 lg:h-full lg:overflow-y-auto lg:pb-10 lg:pr-2">
        {typeContent}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 lg:flex lg:h-full lg:min-h-0 lg:flex-1">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <button
          type="button"
          onClick={onOpenTypeStep}
          className="text-[#8C7B65] transition-colors hover:text-[#1A1A1A]"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8C7B65]">
          {details.category}
        </p>
      </motion.div>

      <section className="min-w-0 lg:flex-1 lg:min-h-0">
        <AnimatePresence mode="wait">
          {createStep === "details" ? detailsContent : null}
        </AnimatePresence>
      </section>
    </div>
  );
}

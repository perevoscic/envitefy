"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import type { StudioCreateStep } from "../studio-types";
import type { EventDetails } from "../studio-workspace-types";

type StudioCreateFlowProps = {
  createStep: StudioCreateStep;
  details: EventDetails;
  isMobileViewport: boolean;
  onOpenTypeStep: () => void;
  onOpenDetailsStep: () => void;
  typeContent: ReactNode;
  detailsContent: ReactNode;
  previewContent: ReactNode;
};

export function StudioCreateFlow({
  createStep,
  details,
  isMobileViewport,
  onOpenTypeStep,
  onOpenDetailsStep,
  typeContent,
  detailsContent,
  previewContent,
}: StudioCreateFlowProps) {
  if (createStep === "type") {
    return <>{typeContent}</>;
  }

  return (
    <div className={`flex flex-col ${isMobileViewport ? "gap-0" : "gap-6 sm:gap-8 lg:flex lg:h-full lg:min-h-0 lg:flex-1"}`}>
      {!isMobileViewport ? (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <button
            type="button"
            onClick={createStep === "preview" ? onOpenDetailsStep : onOpenTypeStep}
            className="text-[#8C7B65] transition-colors hover:text-[#1A1A1A]"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8C7B65]">
            {details.category}
          </p>
        </motion.div>
      ) : null}

      <section className="min-w-0 lg:flex-1 lg:min-h-0">
        <AnimatePresence mode="wait">
          {createStep === "details" ? detailsContent : null}
          {createStep === "preview" ? previewContent : null}
        </AnimatePresence>
      </section>
    </div>
  );
}

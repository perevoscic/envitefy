"use client";

import { motion } from "framer-motion";
import type { Dispatch, SetStateAction } from "react";
import type { StudioStep } from "../studio-types";
import type { EventDetails } from "../studio-workspace-types";
import { StudioCategoryGrid } from "./StudioCategoryGrid";
import { STUDIO_CATEGORY_TILES } from "./studio-category-tile-data";

type StudioCategoryStepProps = {
  details: EventDetails;
  setDetails: Dispatch<SetStateAction<EventDetails>>;
  setStep: (step: StudioStep) => void;
};

export function StudioCategoryStep({
  details,
  setDetails,
  setStep,
}: StudioCategoryStepProps) {
  return (
    <motion.div
      key="category"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-[1380px] px-2 sm:px-4 lg:px-6"
    >
      <div className="relative overflow-visible">
        <div className="absolute left-6 top-8 h-40 w-40 rounded-full bg-[#eee4ff]/65 blur-3xl" />
        <div className="absolute right-8 top-10 h-32 w-32 rounded-full bg-[#f3ebff]/85 blur-3xl" />
        <div className="relative">
          <header className="mb-12 space-y-4 text-center md:mb-16">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b74c8]/80"
            >
              Choose Your Invite Type
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-[var(--font-playfair)] text-4xl font-medium tracking-[-0.04em] text-gray-900 md:text-6xl"
            >
              What are we celebrating?
            </motion.h2>
          </header>

          <div className="space-y-10">
            <StudioCategoryGrid
              categories={STUDIO_CATEGORY_TILES}
              selectedCategory={details.category}
              onSelect={(categoryName) => {
                setDetails((prev) => ({
                  ...prev,
                  category: categoryName,
                }));
                setStep("form");
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

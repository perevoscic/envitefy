"use client";

import { motion } from "framer-motion";
import type { Dispatch, SetStateAction } from "react";
import { CATEGORIES } from "../studio-workspace-field-config";
import type { StudioStep } from "../studio-types";
import type { EventDetails } from "../studio-workspace-types";

type StudioCategoryStepProps = {
  details: EventDetails;
  setDetails: Dispatch<SetStateAction<EventDetails>>;
  setStep: (step: StudioStep) => void;
  shellClass: string;
};

export function StudioCategoryStep({
  details,
  setDetails,
  setStep,
  shellClass,
}: StudioCategoryStepProps) {
  return (
    <motion.div
      key="category"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto max-w-[1120px]"
    >
      <div className={`${shellClass} relative overflow-hidden`}>
        <div className="absolute left-8 top-6 h-32 w-32 rounded-full bg-[#e8ddff]/50 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-28 w-28 rounded-full bg-[#f3ecff] blur-3xl" />
        <div className="relative space-y-10">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Details
            </p>
            <h2 className="font-[var(--font-playfair)] text-4xl tracking-[-0.03em] text-neutral-900 sm:text-5xl">
              What are we celebrating?
            </h2>
          </div>

          <div className="space-y-6">
            <h3 className="text-center text-sm font-bold uppercase tracking-[0.14em] text-neutral-900">
              Categories
            </h3>
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const active = details.category === category.name;
                return (
                  <motion.button
                    key={category.name}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setDetails((prev) => ({
                        ...prev,
                        category: category.name,
                      }));
                      setStep("form");
                    }}
                    className={`flex min-h-[168px] flex-col items-center justify-center gap-4 rounded-2xl border px-4 py-6 text-center transition-all ${
                      active
                        ? "border-[#8f6fe8] bg-white shadow-[0_16px_40px_-20px_rgba(88,55,140,0.25)]"
                        : "border-neutral-200/90 bg-white/95 shadow-sm hover:border-neutral-300 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${
                        active ? "bg-[#8f6fe8] text-white" : "bg-transparent text-neutral-600"
                      }`}
                    >
                      <Icon className="h-7 w-7" strokeWidth={active ? 2.25 : 1.75} />
                    </div>
                    <p
                      className={`text-xs font-bold uppercase leading-snug tracking-[0.06em] sm:text-[13px] ${
                        active ? "text-[#7d5ed8]" : "text-neutral-800"
                      }`}
                    >
                      {category.name}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

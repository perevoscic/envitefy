"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { CATEGORIES, CATEGORY_DESCRIPTIONS } from "../studio-workspace-field-config";
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Details</p>
            <h2 className="font-[var(--font-playfair)] text-4xl tracking-[-0.03em] text-neutral-900 sm:text-5xl">
              What are we celebrating?
            </h2>
            <p className="text-sm leading-6 text-neutral-600 sm:text-[15px]">
              Choose a category to start the exact same Envitefy studio flow with a calmer, more editorial setup.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const active = details.category === category.name;
              return (
                <motion.button
                  key={category.name}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setDetails((prev) => ({ ...prev, category: category.name }));
                    setStep("form");
                  }}
                  className={`relative flex min-h-[220px] flex-col items-start justify-between rounded-[28px] border p-7 text-left transition-all ${
                    active
                      ? "border-[#d8c7fb] bg-[#f7f1ff] text-neutral-900 shadow-[0_24px_60px_-24px_rgba(88,55,140,0.22)] ring-1 ring-[#ece1ff]"
                      : "border-[#ece4f7] bg-white/95 text-neutral-900 shadow-[0_16px_40px_-24px_rgba(25,20,40,0.14)] hover:-translate-y-1 hover:border-[#ddd0f6] hover:shadow-[0_24px_60px_-24px_rgba(88,55,140,0.18)]"
                  }`}
                >
                  {active ? (
                    <div className="absolute right-5 top-5 rounded-full bg-[#8f6fe8] p-1.5 text-white shadow-lg">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : null}
                  <div
                    className={`rounded-[18px] p-4 ${
                      active ? "bg-white text-[#7d5ed8]" : "bg-[#f7f3fd] text-[#8a6fdb]"
                    }`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">{category.name}</p>
                    <p className="text-sm leading-6 text-neutral-600">{CATEGORY_DESCRIPTIONS[category.name]}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

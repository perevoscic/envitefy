"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import type { StudioCreateStep } from "../studio-types";
import type { EventDetails } from "../studio-workspace-types";

type StudioCreateFlowProps = {
  createStep: StudioCreateStep;
  details: EventDetails;
  isFormValid: boolean;
  onOpenTypeStep: () => void;
  onOpenDetailsStep: () => void;
  onOpenEditorStep: () => void;
  typeContent: ReactNode;
  detailsContent: ReactNode;
  editorContent: ReactNode;
};

export function StudioCreateFlow({
  createStep,
  details,
  isFormValid,
  onOpenTypeStep,
  onOpenDetailsStep,
  onOpenEditorStep,
  typeContent,
  detailsContent,
  editorContent,
}: StudioCreateFlowProps) {
  if (createStep === "type") {
    return <>{typeContent}</>;
  }

  const activeStep = createStep;
  const stepTabs = [
    { id: "details", label: "Details" },
    { id: "editor", label: "Editor" },
  ] as const;

  const openStep = (step: (typeof stepTabs)[number]["id"]) => {
    if (step === "details") {
      onOpenDetailsStep();
      return;
    }
    onOpenEditorStep();
  };

  return (
    <div className="grid gap-8 sm:gap-10 lg:grid-cols-[minmax(210px,260px)_minmax(0,1fr)] lg:gap-0">
      <aside className="flex flex-col gap-8 lg:min-h-[720px] lg:justify-between lg:gap-0">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 flex items-center gap-3"
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

          <nav className="mb-6 flex items-center gap-6 overflow-x-auto border-b border-[#ddd5cb] pb-px lg:hidden">
            {stepTabs.map((tab) => {
              const isActive = activeStep === tab.id;
              const isDisabled = tab.id === "editor" && !isFormValid;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => openStep(tab.id)}
                  disabled={isDisabled}
                  className={`border-b-[4px] pb-3 text-[11px] font-semibold uppercase leading-none tracking-[0.24em] transition-colors ${
                    isActive
                      ? "border-[#1A1A1A] text-[#1A1A1A]"
                      : "border-transparent text-[#8C7B65]/55 hover:text-[#8C7B65]"
                  } ${isDisabled ? "cursor-not-allowed opacity-45 hover:text-[#8C7B65]/55" : ""}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <nav className="hidden flex-col items-start gap-4 lg:flex">
            {stepTabs.map((tab) => {
              const isActive = activeStep === tab.id;
              const isDisabled = tab.id === "editor" && !isFormValid;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => openStep(tab.id)}
                  disabled={isDisabled}
                  className={`text-left text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
                    isActive
                      ? "translate-x-4 text-[#1A1A1A]"
                      : "text-[#8C7B65]/55 hover:translate-x-2 hover:text-[#8C7B65]"
                  } ${isDisabled ? "cursor-not-allowed opacity-45 hover:translate-x-0" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    {isActive ? <span className="h-px w-8 bg-[#1A1A1A]" /> : null}
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="hidden max-w-[250px] text-[11px] uppercase tracking-[0.16em] leading-relaxed text-[#8C7B65] lg:block"
        >
          Every exceptional journey begins with a single, intentional conversation.
        </motion.p>
      </aside>

      <section className="min-w-0">
        <AnimatePresence mode="wait">
          {createStep === "details" ? detailsContent : null}
          {createStep === "editor" ? editorContent : null}
        </AnimatePresence>
      </section>
    </div>
  );
}

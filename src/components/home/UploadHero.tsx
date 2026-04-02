"use client";

import { UploadCloud } from "lucide-react";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

type UploadHeroProps = {
  onUpload: () => void;
  className?: string;
};

export function UploadHero({ onUpload, className }: UploadHeroProps) {
  return (
    <section
      className={`rounded-[40px] bg-gradient-to-br from-[#E4F3FF] via-white to-[#F7EDFF] p-6 shadow-xl shadow-[#C4D4FF]/60 sm:p-8 ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#3975C3] shadow-sm shadow-[#BAD4FF]">
            Upload Event
          </span>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onUpload}
              className="cta-shell h-12 rounded-full bg-[#3975C3] px-6 text-base font-semibold text-white shadow-lg shadow-[#3975C3]/40 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3975C3]/50 sm:w-auto"
            >
              <AnimatedButtonLabel
                label="Select File"
                icon={UploadCloud}
                iconClassName="h-5 w-5"
                iconPosition="leading"
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

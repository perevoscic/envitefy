"use client";

import { Camera } from "lucide-react";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

type SnapHeroProps = {
  onSnap: () => void;
  className?: string;
};

export function SnapHero({ onSnap, className }: SnapHeroProps) {
  return (
    <section
      className={`rounded-[40px] bg-gradient-to-bl from-[#F9F2FF] via-white to-[#FFEAF4] p-6 shadow-xl shadow-[#E8DFFF]/70 sm:p-8 ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#8A6BFF] shadow-sm shadow-[#D8CBFF]">
            Snap Event
          </span>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onSnap}
              className="cta-shell h-12 rounded-full bg-[#7F8CFF] px-6 text-base font-semibold text-white shadow-lg shadow-[#7F8CFF]/40 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ACAFFF] sm:w-auto"
            >
              <AnimatedButtonLabel
                label="Open Camera"
                icon={Camera}
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

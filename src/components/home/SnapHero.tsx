"use client";

import { Camera } from "lucide-react";

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
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7F8CFF] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#7F8CFF]/40 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ACAFFF] sm:w-auto"
            >
              <Camera className="h-5 w-5" aria-hidden="true" />
              Open Camera
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { Camera, ScanLine, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";

type SnapUploadHeroProps = {
  onSnap: () => void;
  onUpload: () => void;
  className?: string;
};

const BENEFITS: Array<{ icon: ReactNode; label: string; copy: string }> = [
  {
    icon: <ScanLine className="h-4 w-4" />,
    label: "Real-time cleanup",
    copy: "We detect titles, dates, locations, RSVP cues—even on textured paper.",
  },
  {
    icon: <UploadCloud className="h-4 w-4" />,
    label: "PDF + image ready",
    copy: "Drop screenshots, flyers, or scans up to 10 MB. Supports JPG, PNG, HEIC, PDF.",
  },
];

export function SnapUploadHero({
  onSnap,
  onUpload,
  className,
}: SnapUploadHeroProps) {
  return (
    <section
      className={`rounded-[40px] bg-gradient-to-bl from-[#F9F2FF] via-white to-[#FFEAF4] p-6 shadow-xl shadow-[#E8DFFF]/70 sm:p-8 ${
        className || ""
      }`}
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div className="space-y-8">
          {/* Snap Section */}
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#8A6BFF] shadow-sm shadow-[#D8CBFF]">
              Snap
            </span>
            <button
              type="button"
              onClick={onSnap}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#7F8CFF] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#7F8CFF]/40 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ACAFFF] sm:w-auto"
            >
              <Camera className="h-5 w-5" aria-hidden="true" />
              Open Camera
            </button>
          </div>

          {/* Upload Section */}
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#8A6BFF] shadow-sm shadow-[#D8CBFF]">
              Upload
            </span>
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#E4D8FF] bg-white px-6 py-3 text-base font-semibold text-[#3F2F60] shadow-sm transition hover:bg-[#F9F5FF] sm:w-auto"
            >
              <UploadCloud className="h-5 w-5" aria-hidden="true" />
              Select File
            </button>
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-[#9B7BFF]">
            Works great on mobile browsers—just point and send.
          </p>
        </div>
      </div>
    </section>
  );
}

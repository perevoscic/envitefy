"use client";

import { Camera, ScanLine, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";

type SnapUploadHeroProps = {
  onSnap: () => void;
  onUpload: () => void;
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

export function SnapUploadHero({ onSnap, onUpload }: SnapUploadHeroProps) {
  return (
    <section className="rounded-[40px] bg-gradient-to-bl from-[#F9F2FF] via-white to-[#FFEAF4] p-6 shadow-xl shadow-[#E8DFFF]/70 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#8A6BFF] shadow-sm shadow-[#D8CBFF]">
            Snap or Upload
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-[#160F2F] sm:text-5xl">
              Bring printed invites into Envitefy instantly.
            </h1>
            <p className="text-base leading-relaxed text-[#4A3E66]">
              Skip retyping every detail. Use your camera or upload a file; we
              auto-extract the event and get it ready for sharing or calendar
              buttons.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={onSnap}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7F8CFF] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#7F8CFF]/40 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ACAFFF]"
            >
              <Camera className="h-5 w-5" aria-hidden="true" />
              Snap Event
            </button>
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E4D8FF] bg-white px-6 py-3 text-base font-semibold text-[#3F2F60] shadow-sm transition hover:bg-[#F9F5FF]"
            >
              <UploadCloud className="h-5 w-5" aria-hidden="true" />
              Upload Event
            </button>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#9B7BFF]">
            Works great on mobile browsers—just point and send.
          </p>
        </div>

        <div className="rounded-[32px] border border-[#F3E8FF] bg-white/95 p-6 shadow-lg shadow-[#E8DFFF]/60">
          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((feature) => (
              <div
                key={feature.label}
                className="rounded-3xl border border-[#EFE5FF] bg-gradient-to-r from-white to-[#FAF6FF] p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1D1234]">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F3ECFF] text-[#7A5AF8]">
                    {feature.icon}
                  </span>
                  {feature.label}
                </div>
                <p className="mt-2 text-sm text-[#5A4F78]">{feature.copy}</p>
              </div>
            ))}
            <div className="rounded-3xl border border-[#E7F6FF] bg-[#F6FBFF] px-4 py-3 text-sm text-[#115575] sm:col-span-2">
              Private by default. Nothing is saved until you confirm the event.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

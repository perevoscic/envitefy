"use client";

import type { RefObject } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Hotel,
  MapPinned,
  Sparkles,
  TimerReset,
  Upload,
  X,
} from "lucide-react";

type HeroProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  discoveryBusy: boolean;
  uploadBusy: boolean;
  uploadFileName: string;
  uploadProgress: number;
  uploadStatus: string;
  uploadError: string;
  uploadIndeterminate: boolean;
  onPickUpload: () => void;
  onCancelDiscovery: () => void;
  onFileChange: (file: File | null) => void;
  onOpenBuilder: () => void;
};

const uploadEvidence = [
  {
    label: "Session schedule",
    detail: "Warm-ups, march-in, awards",
    icon: TimerReset,
  },
  {
    label: "Venue + parking",
    detail: "Maps, entrances, arrival notes",
    icon: MapPinned,
  },
  {
    label: "Hotels + docs",
    detail: "Travel block, packet PDFs, links",
    icon: Hotel,
  },
];

const heroChips = [
  "Sessions",
  "Rotations",
  "Venue",
  "Hotels",
  "Results",
  "Spectator Info",
];

export default function Hero({
  fileInputRef,
  discoveryBusy,
  uploadBusy,
  uploadFileName,
  uploadProgress,
  uploadStatus,
  uploadError,
  uploadIndeterminate,
  onPickUpload,
  onCancelDiscovery,
  onFileChange,
  onOpenBuilder,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-28 lg:pt-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-12 h-72 w-72 rounded-full bg-[#5b5cf0]/10 blur-3xl" />
        <div className="absolute right-[-3rem] top-20 h-80 w-80 rounded-full bg-[#d4af37]/10 blur-3xl" />
        <div className="absolute left-[12%] top-16 hidden h-px w-44 rotate-[16deg] bg-gradient-to-r from-transparent via-[#5b5cf0]/30 to-transparent lg:block" />
        <div className="absolute right-[15%] top-40 hidden h-px w-56 -rotate-[18deg] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent lg:block" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c7cfef] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4f46e5] shadow-[0_12px_30px_rgba(30,27,75,0.08)]">
            <Sparkles className="h-4 w-4" />
            Built for gymnastics meets
          </div>

          <h1 className="mt-6 max-w-3xl font-[var(--font-gym-display)] text-5xl font-extrabold leading-[0.94] tracking-[-0.055em] text-[#17153f] sm:text-6xl lg:text-7xl">
            Turn Gymnastics Meet Information Into a Shareable Event Page
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4b5a78] sm:text-xl">
            Upload your meet schedule and Envitefy generates a clean event hub
            for parents, athletes, coaches, and spectators. No more pinching
            through PDFs or chasing updates across emails and group chats.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onPickUpload}
              disabled={discoveryBusy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1e1b4b] px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(30,27,75,0.25)] transition hover:-translate-y-0.5 hover:bg-[#16133a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Upload className="h-4 w-4" />
              Upload Meet Info
            </button>
            <a
              href="#gym-example-meet"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#cad2ee] bg-white px-6 py-4 text-sm font-semibold text-[#1e1b4b] shadow-[0_12px_28px_rgba(30,27,75,0.08)] transition hover:-translate-y-0.5 hover:border-[#8b90ff]"
            >
              View Example Meet Page
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[#5a6685]">
            <span className="font-medium text-[#2c3553]">
              Prefer full manual control?
            </span>
            <button
              type="button"
              onClick={onOpenBuilder}
              disabled={discoveryBusy}
              className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 font-semibold text-[#4f46e5] transition hover:border-[#d9dcff] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Open Visual Builder
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {heroChips.map((chip, index) => (
              <span
                key={chip}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  index === 1
                    ? "bg-[#d4af37] text-[#3a2f05]"
                    : "border border-[#d7dcf4] bg-white/85 text-[#2c3553]"
                }`}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-10 hidden h-[72%] w-16 rounded-full border border-[#d5daf2] bg-white/55 blur-sm lg:block" />
          <div className="absolute left-[30%] top-[22%] hidden h-px w-28 rotate-[14deg] bg-gradient-to-r from-transparent via-[#4f46e5]/30 to-transparent lg:block" />

          <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
            <div className="rounded-[2rem] border border-[#dce2f0] bg-white/95 p-5 shadow-[0_24px_60px_rgba(30,27,75,0.1)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a84a3]">
                    Input
                  </p>
                  <h2 className="mt-2 font-[var(--font-gym-display)] text-2xl font-bold tracking-[-0.03em] text-[#17153f]">
                    Meet Information
                  </h2>
                </div>
                <div className="rounded-2xl bg-[#efeefe] p-3 text-[#4f46e5]">
                  <Upload className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {uploadEvidence.map(({ label, detail, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-[1.4rem] border border-[#eaedf6] bg-[#fafbff] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white p-2.5 text-[#4f46e5] shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#202848]">{label}</p>
                        <p className="mt-1 text-xs text-[#6c7798]">{detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-dashed border-[#cdd3e8] bg-[#f6f8fd] p-4">
                {!uploadBusy ? (
                  <button
                    type="button"
                    onClick={onPickUpload}
                    disabled={discoveryBusy}
                    className="flex w-full items-center justify-center gap-2 rounded-[1.15rem] bg-[#1e1b4b] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#16133a] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Upload className="h-4 w-4" />
                    Upload PDF, JPG, or PNG
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#4f46e5]">
                      <span>{uploadStatus || "Processing meet info..."}</span>
                      <div className="flex items-center gap-2">
                        {!uploadIndeterminate ? <span>{uploadProgress}%</span> : null}
                        <button
                          type="button"
                          onClick={onCancelDiscovery}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#dbdef6] bg-white text-[#4f46e5] hover:bg-[#f2f4ff]"
                          aria-label="Cancel upload"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e5e7fb]">
                      {uploadIndeterminate ? (
                        <div className="relative h-full w-full overflow-hidden">
                          <div className="launcher-indeterminate-bar absolute inset-y-0 left-0 w-2/5 rounded-full bg-[#4f46e5]" />
                        </div>
                      ) : (
                        <div
                          className="h-full rounded-full bg-[#4f46e5] transition-[width] duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      )}
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    onFileChange(e.target.files?.[0] || null);
                    e.currentTarget.value = "";
                  }}
                />
                {uploadFileName ? (
                  <p className="mt-3 truncate text-xs text-[#6c7798]">
                    Selected: {uploadFileName}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-[#7a84a3]">
                    Typical upload: meet packet, session grid, hotel sheet, venue doc
                  </p>
                )}
                {uploadError ? (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {uploadError}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-[#23205a] bg-[#1e1b4b] p-5 text-white shadow-[0_28px_80px_rgba(30,27,75,0.22)]">
              <div className="pointer-events-none absolute -right-12 top-8 h-32 w-32 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute bottom-10 right-6 h-px w-24 rotate-[-28deg] bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b8c0ff]">
                    Output
                  </p>
                  <h3 className="mt-2 font-[var(--font-gym-display)] text-2xl font-bold tracking-[-0.03em]">
                    Gasparilla Classic Gymnastics Meet
                  </h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#eef1ff]">
                  Parent-ready page
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Sessions", "Venue", "Hotels", "Results", "Spectator Info"].map(
                  (tab, index) => (
                    <span
                      key={tab}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        index === 0
                          ? "bg-[#d4af37] text-[#3a2f05]"
                          : "border border-white/10 bg-white/5 text-[#e2e5ff]"
                      }`}
                    >
                      {tab}
                    </span>
                  ),
                )}
              </div>

              <div className="mt-5 rounded-[1.55rem] bg-white p-5 text-[#1a2242]">
                <div className="grid gap-4">
                  <div className="rounded-[1.3rem] bg-[#f6f7ff] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d86a7]">
                          Session 3
                        </p>
                        <p className="mt-1 text-lg font-semibold text-[#1a2242]">
                          Level 7 and Xcel Platinum
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-[#4f46e5]" />
                    </div>
                    <div className="mt-4 space-y-2.5">
                      {[
                        ["7:20 AM", "Coach check-in"],
                        ["7:45 AM", "General stretch"],
                        ["8:00 AM", "Competition starts"],
                        ["11:40 AM", "Awards"],
                      ].map(([time, label]) => (
                        <div
                          key={time}
                          className="flex items-center justify-between rounded-2xl border border-white bg-white px-4 py-3"
                        >
                          <span className="text-sm font-medium text-[#233056]">{label}</span>
                          <span className="text-sm text-[#667394]">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] bg-[#f6f7ff] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d86a7]">
                        Venue
                      </p>
                      <p className="mt-2 text-base font-semibold text-[#1a2242]">
                        Convention Hall B
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#667394]">
                        Parking map, parent entrance, and spectator seating details.
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] bg-[#fdf7e6] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#876b15]">
                        Hotels + Docs
                      </p>
                      <p className="mt-2 text-base font-semibold text-[#3f3210]">
                        Block closes Jan 18
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6d5d26]">
                        Hotel sheet, meet packet, and results link in one place.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 text-sm text-[#d7dcff]">
                <FileText className="h-4 w-4 text-[#d4af37]" />
                Upload once. Publish one clean page.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

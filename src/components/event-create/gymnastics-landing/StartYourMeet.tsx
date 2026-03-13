"use client";

import type { RefObject } from "react";
import { ArrowRight, LayoutTemplate, Upload, X } from "lucide-react";
import styles from "./gymnastics-landing.module.css";

type StartYourMeetProps = {
  sectionRef: RefObject<HTMLElement | null>;
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

const checklist = [
  "Upload your meet packet, session schedule, venue details, hotel sheet, or supporting docs",
  "Envitefy organizes the information into a clean gymnastics meet hub",
  "Publish one page families can actually use on meet weekend",
];

export default function StartYourMeet({
  sectionRef,
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
}: StartYourMeetProps) {
  return (
    <section
      id="gym-start-meet"
      ref={sectionRef}
      className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className={`${styles.container} rounded-[2.6rem] border border-[#dbe0ee] bg-[linear-gradient(180deg,#ffffff_0%,#f7f8fc_100%)] p-6 shadow-[0_26px_70px_rgba(23,27,70,0.08)] sm:p-8 lg:p-10`}>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.8fr)_minmax(620px,1.2fr)] xl:items-start">
          <div className="max-w-[540px]">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4f46e5]">
              Start your meet
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-[#17153f] sm:text-5xl">
              Upload once and let Envitefy build the cleaner meet page
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#55627f]">
              The workflow stays simple. Bring your gymnastics meet information
              in once, then share one organized page instead of a stack of files.
            </p>

            <div className="mt-8 space-y-3">
              {checklist.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-[#e7eaf3] bg-white px-4 py-3 text-sm leading-6 text-[#40506d]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
            <article className="rounded-[2rem] border border-[#25285e] bg-[linear-gradient(180deg,#1e2258_0%,#171b46_100%)] p-6 text-white shadow-[0_26px_70px_rgba(23,27,70,0.2)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c8cdef]">
                    Primary path
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    Upload meet info
                  </h3>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-[#f3d97d]">
                  <Upload className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#dce2fb]">
                Best when you already have the meet packet, session grid, venue
                document, or hotel sheet ready to go.
              </p>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                {!uploadBusy ? (
                  <button
                    type="button"
                    onClick={onPickUpload}
                    disabled={discoveryBusy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[1.15rem] bg-[#d4af37] px-4 py-3.5 text-sm font-semibold text-[#392d07] transition hover:bg-[#e1bc4b] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Upload className="h-4 w-4" />
                    Upload PDF, JPG, or PNG
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#eef1ff]">
                      <span>{uploadStatus || "Processing meet info..."}</span>
                      <div className="flex items-center gap-2">
                        {!uploadIndeterminate ? <span>{uploadProgress}%</span> : null}
                        <button
                          type="button"
                          onClick={onCancelDiscovery}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white hover:bg-white/14"
                          aria-label="Cancel upload"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/12">
                      {uploadIndeterminate ? (
                        <div className="relative h-full w-full overflow-hidden">
                          <div className="launcher-indeterminate-bar absolute inset-y-0 left-0 w-2/5 rounded-full bg-[#d4af37]" />
                        </div>
                      ) : (
                        <div
                          className="h-full rounded-full bg-[#d4af37] transition-[width] duration-300 ease-out"
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
                  <p className="mt-4 truncate text-xs text-[#cfd5f6]">
                    Selected: {uploadFileName}
                  </p>
                ) : (
                  <p className="mt-4 text-xs text-[#cfd5f6]">
                    Typical upload: meet packet, session grid, hotel sheet, venue doc
                  </p>
                )}

                {uploadError ? (
                  <p className="mt-4 rounded-xl border border-red-300/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                    {uploadError}
                  </p>
                ) : null}
              </div>
            </article>

            <article className="rounded-[2rem] border border-[#dde2ee] bg-white p-6 shadow-[0_18px_46px_rgba(23,27,70,0.06)]">
              <div className="w-fit rounded-2xl bg-[#f2f2fb] p-3 text-[#4f46e5]">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#818aa4]">
                Secondary path
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-[#171b46]">
                Open visual builder
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#5a6782]">
                Use the builder when you want to shape the meet page manually
                before publishing.
              </p>
              <button
                type="button"
                onClick={onOpenBuilder}
                disabled={discoveryBusy}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#d9deef] bg-[#171b46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#121538] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Open builder
                <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata, Viewport } from "next";
import { themeColorPalette } from "@/lib/theme-color";
import SnapLaunchCards from "./SnapLaunchCards";

export const metadata: Metadata = {
  title: "Snap or upload invite · Envitefy",
  description: "Scan a flyer with your camera or upload an image to create your event.",
};

export const viewport: Viewport = {
  themeColor: themeColorPalette.eventFallback,
};

export default function EventSnapLandingPage() {
  return (
    <main
      className="min-h-screen bg-[#f5f6f7] px-4 py-10 sm:px-6 lg:px-10"
      data-theme-color={themeColorPalette.eventFallback}
    >
      <div className="mx-auto w-full max-w-5xl">
        <SnapLaunchCards />
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_60px_rgba(120,110,160,0.12)]">
          <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.15fr_0.85fr] md:px-10 md:py-12">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-indigo-600">
                Snap And Style
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight text-[#0f1935] sm:text-5xl">
                Snap or upload your{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  flyer or invite
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#66677f] sm:text-lg">
                Use your camera for a quick scan or upload a photo or PDF. Envitefy reads the
                details, detects birthday invites, and routes them into the right polished event
                page automatically.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#f4f0ff] via-[#fff7fb] to-[#eef7ff] p-6">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-200/40 blur-2xl" />
              <div className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />
              <div className="relative space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  What happens next
                </p>
                <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-sm">
                  <p className="text-sm font-bold text-slate-700">1. Scan the flyer</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Capture it live or upload a saved image/PDF.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-sm">
                  <p className="text-sm font-bold text-slate-700">2. Envitefy scans the details</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Date, time, location, RSVP, and birthday cues are extracted.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-sm">
                  <p className="text-sm font-bold text-slate-700">3. Share the page</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Guests get a clean page with RSVP and calendar actions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

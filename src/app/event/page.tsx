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
        <section className="mx-auto max-w-4xl text-center">
          <div className="inline-flex w-fit items-center rounded-full bg-[#f3f0ff] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#6e5de7] shadow-[0_10px_28px_rgba(124,58,237,0.08)]">
            SMART EVENT TRANSFORMATION
          </div>
          <h1 className="mt-5 pb-[0.08em] text-[clamp(1.65rem,8.8vw,2.85rem)] font-semibold leading-[1] tracking-[-0.06em] text-[#151229] [font-family:var(--font-playfair),Georgia,serif] sm:text-[clamp(3.2rem,8vw,5.5rem)]">
            <span className="inline-block max-w-full whitespace-nowrap">Snap or upload your</span>
            <br />
            <span className="mt-3 inline-block pb-[0.1em] pr-[0.08em] bg-[linear-gradient(135deg,#5c43ff_0%,#8f42ff_55%,#b24cff_100%)] bg-clip-text italic text-transparent">
              flyer or invite
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#767287] sm:text-[1.35rem]">
            Envitefy reads the details, detects invitation types, and routes them into
            polished, interactive event pages automatically.
          </p>
        </section>
        <SnapLaunchCards />
      </div>
    </main>
  );
}

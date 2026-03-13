import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import HeroSection from "./sections/HeroSection";
import HowItWorks from "./sections/HowItWorks";
import MeetFeaturesGrid from "./sections/MeetFeaturesGrid";
import ExampleMeetHub from "./sections/ExampleMeetHub";
import SecondaryUploads from "./sections/SecondaryUploads";
import AudienceSection from "./sections/AudienceSection";
import BenefitsSection from "./sections/BenefitsSection";
import FinalCta from "./sections/FinalCta";

export const metadata: Metadata = {
  title: "Landing Preview - Meet-First | Envitefy",
  description:
    "Preview the meet-first Envitefy landing page focused on turning sports meet packets into parent-ready event hubs.",
  robots: {
    index: false,
    follow: false,
  },
};

function PreviewNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#d8e3f0]/80 bg-[rgba(248,250,252,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/landing-preview"
          className="flex items-center gap-3 text-[#10233f]"
          aria-label="Envitefy landing preview"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <Image
              src="/navElogo.png"
              alt="Envitefy logo"
              width={30}
              height={30}
              priority
              className="h-auto w-auto"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#4d8fb4]">
              Preview Route
            </p>
            <p className="text-lg font-semibold tracking-tight">Envitefy</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/landing"
            className="hidden rounded-full border border-[#c7d6e6] px-4 py-2 text-sm font-medium text-[#33506d] transition hover:border-[#87a7c6] hover:text-[#10233f] sm:inline-flex"
          >
            View Live Landing
          </Link>
          <a
            href="#final-cta"
            className="inline-flex items-center gap-2 rounded-full bg-[#102a43] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,42,67,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b2237]"
          >
            Review CTA Flow
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

export default function LandingPreviewPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#10233f] selection:bg-[#cdebf4] selection:text-[#10233f]">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[780px] bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.15),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_28%),linear-gradient(180deg,_#f5f9fc_0%,_#f8fafc_48%,_#f8fafc_100%)]" />
        <div className="pointer-events-none absolute left-[-12rem] top-28 h-80 w-80 rounded-full bg-[#8dd3c7]/25 blur-3xl" />
        <div className="pointer-events-none absolute right-[-6rem] top-12 h-72 w-72 rounded-full bg-[#f4c46d]/25 blur-3xl" />

        <PreviewNav />

        <div className="relative">
          <HeroSection />
          <HowItWorks />
          <MeetFeaturesGrid />
          <ExampleMeetHub />
          <SecondaryUploads />
          <AudienceSection />
          <BenefitsSection />
          <FinalCta />
        </div>
      </div>
    </main>
  );
}

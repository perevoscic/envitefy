"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  MapPinned,
  Medal,
  ShieldCheck,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

const uploadSamples = [
  {
    icon: FileText,
    label: "Meet packet PDF",
    detail: "Schedule, admissions, venue rules, hotel block",
  },
  {
    icon: CalendarDays,
    label: "Schedule screenshot",
    detail: "Sessions, warm-up times, awards and results",
  },
  {
    icon: MapPinned,
    label: "Venue details",
    detail: "Parking, maps, arrival notes, spectator flow",
  },
];

const hubHighlights = [
  "Schedule",
  "Venue",
  "Travel",
  "Results",
  "Documents",
  "Spectator Info",
];

export default function HeroSection() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  return (
    <section className="px-4 pb-20 pt-8 sm:px-6 sm:pb-24 lg:px-8 lg:pb-28 lg:pt-10">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c7d6e6] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#245f73] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <Trophy className="h-4 w-4 text-[#0f766e]" />
            The Event Hub for Sports Meets
          </div>

          <h1 className="mt-6 max-w-xl font-['Poppins'] text-5xl font-semibold leading-[0.96] tracking-[-0.05em] text-[#0b2035] sm:text-6xl lg:text-7xl">
            Upload a Meet Packet.
            <span className="block text-[#0f766e]">Share a Complete Event Hub.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4e647d] sm:text-xl">
            Upload a meet schedule, packet, or event document and Envitefy
            automatically builds a complete event hub for parents, coaches,
            athletes, and spectators.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setAuthModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#102a43] px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(16,42,67,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b2237]"
            >
              <Upload className="h-4 w-4" />
              Create Meet Event
            </button>
            <Link
              href="#example-meet"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c7d6e6] bg-white px-6 py-4 text-sm font-semibold text-[#16324d] shadow-[0_10px_25px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#95b6d3]"
            >
              View Example Meet Page
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0b2035]">
                <ShieldCheck className="h-4 w-4 text-[#d97706]" />
                Parent-ready
              </div>
              <p className="mt-2 text-sm leading-6 text-[#597088]">
                One clean link instead of packet screenshots in group chats.
              </p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0b2035]">
                <Medal className="h-4 w-4 text-[#0f766e]" />
                Meet-focused
              </div>
              <p className="mt-2 text-sm leading-6 text-[#597088]">
                Built for schedules, results, travel details, parking, and docs.
              </p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0b2035]">
                <Users className="h-4 w-4 text-[#0284c7]" />
                Easy to share
              </div>
              <p className="mt-2 text-sm leading-6 text-[#597088]">
                Coaches, families, and spectators all use the same event page.
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_35%)] blur-2xl" />

          <div className="relative mx-auto max-w-[640px]">
            <div className="absolute -left-3 top-10 hidden w-56 rounded-[1.75rem] border border-white/70 bg-white/90 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4d8fb4]">
                What you upload
              </p>
              <div className="mt-4 space-y-3">
                {uploadSamples.map(({ icon: Icon, label, detail }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-[#d7e5f0] bg-[#f8fbfd] p-3"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#10233f]">
                      <Icon className="h-4 w-4 text-[#0f766e]" />
                      {label}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#587088]">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#d7e2ec] bg-[#eff4f8] p-3 shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
              <div className="rounded-[1.6rem] border border-white/70 bg-[#0e2237] p-4 text-white">
                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#79c7d3]">
                      Generated Meet Hub
                    </p>
                    <h2 className="mt-1 font-['Poppins'] text-2xl font-semibold tracking-[-0.03em]">
                      Gasparilla Classic Gymnastics Meet
                    </h2>
                  </div>
                  <div className="rounded-full border border-[#3e556d] bg-white/5 px-3 py-1.5 text-xs font-medium text-[#d9e7f1]">
                    Tampa, FL
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {hubHighlights.map((item, index) => (
                    <span
                      key={item}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        index === 0
                          ? "bg-[#f4c46d] text-[#3f2b05]"
                          : "border border-white/10 bg-white/6 text-[#dce8f2]"
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-white/10 bg-white p-5 text-[#10233f]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4d8fb4]">
                            Session Schedule
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            Saturday, February 7
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#e7f7f4] px-3 py-2 text-xs font-semibold text-[#0f766e]">
                          Session 2
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {[
                          ["7:15 AM", "Athlete check-in"],
                          ["8:00 AM", "Open stretch + coaches meeting"],
                          ["8:30 AM", "Competition begins"],
                          ["11:45 AM", "Awards"],
                        ].map(([time, label]) => (
                          <div
                            key={time}
                            className="flex items-center justify-between rounded-2xl bg-[#f4f8fb] px-4 py-3"
                          >
                            <span className="text-sm font-semibold text-[#10233f]">
                              {label}
                            </span>
                            <span className="text-sm text-[#4f647a]">{time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-white/10 bg-[#15314e] p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7ed0be]">
                          Venue
                        </p>
                        <p className="mt-3 text-lg font-semibold">Tampa Convention Center</p>
                        <p className="mt-2 text-sm leading-6 text-[#c7d7e5]">
                          Entry gates, warm-up floor, awards stage, and map pins
                          in one place.
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/10 bg-[#14354b] p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f4c46d]">
                          Results + Docs
                        </p>
                        <p className="mt-3 text-lg font-semibold">Live scoring ready</p>
                        <p className="mt-2 text-sm leading-6 text-[#c7d7e5]">
                          Packet PDF, admissions, hotel links, and results stay
                          together.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-white/10 bg-[#12293f] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#79c7d3]">
                        Travel + logistics
                      </p>
                      <div className="mt-4 space-y-3">
                        {[
                          "Hotel block closes January 22",
                          "Parking garage opens at 6:30 AM",
                          "Spectator admission is mobile-only",
                        ].map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#dce8f2]"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-white/10 bg-white p-5 text-[#10233f]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4d8fb4]">
                        Why families use it
                      </p>
                      <div className="mt-4 grid gap-3">
                        {[
                          "One link for the whole weekend",
                          "Works on phone and desktop",
                          "Cleaner than forwarding packet screenshots",
                        ].map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl bg-[#f4f8fb] px-4 py-3 text-sm font-medium text-[#16324d]"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 right-3 rounded-[1.5rem] border border-white/70 bg-white/95 px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:right-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4d8fb4]">
                Output
              </p>
              <p className="mt-1 text-base font-semibold text-[#10233f]">
                Parent-ready page in seconds
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
      />
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import GymnasticsMeetPreview from "@/components/landing/GymnasticsMeetPreview";

const blocks = [
  {
    id: "snap",
    title: "Snap",
    subtitle: (
      <>
        Capture the flyer,
        <br />
        save the event,
        <br />
        <span className="italic text-blue-500">skip the typing.</span>
      </>
    ),
    description:
      "Snap turns flyers, screenshots, and invites into clean event details you can review, share, and save in seconds.",
    buttonText: "Create a Snap account",
    href: "/snap",
    badgeClass: "bg-blue-100 text-blue-700",
    orientation: "right",
  },
  {
    id: "gymnastics",
    title: "Gymnastics",
    subtitle: (
      <>
        One meet page,
        <br />
        one clean link,
        <br />
        <span className="italic text-violet-500">fully organized.</span>
      </>
    ),
    description:
      "Gymnastics accounts include meet pages, session details, venue info, and updates that parents and coaches can rely on.",
    buttonText: "Create a Gymnastics account",
    href: "/gymnastics",
    badgeClass: "bg-violet-100 text-violet-700",
    orientation: "left",
  },
] as const;

export default function Verticals() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl space-y-32 px-6">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`flex scroll-mt-28 flex-col items-center gap-16 lg:flex-row lg:scroll-mt-32 ${
              block.orientation === "right" ? "lg:flex-row-reverse" : ""
            }`}
            id={block.id === "gymnastics" ? "gymnastics-hero" : undefined}
          >
            <div className="flex-1 space-y-6">
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${block.badgeClass}`}
              >
                {block.id === "snap" ? (
                  <Camera className="h-4 w-4" />
                ) : (
                  <GymnasticsIcon className="h-5 w-5" />
                )}
                <span>{block.title}</span>
              </div>

              <h2 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
                {block.subtitle}
              </h2>

              <p className="max-w-lg text-lg leading-relaxed text-gray-600">
                {block.description}
              </p>

              <Link
                href={block.href}
                className="group inline-flex items-center gap-2 text-lg font-semibold text-black transition-all hover:gap-3"
              >
                {block.buttonText} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="w-full flex-1">
              {block.id === "gymnastics" ? (
                <GymnasticsMeetPreview />
              ) : (
                <SnapPreviewCard />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SnapPreviewCard() {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8 shadow-sm">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/4 rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/4 translate-y-1/4 rounded-full bg-cyan-100 blur-3xl" />
      </div>

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-300" />
            <div className="h-3 w-3 rounded-full bg-amber-300" />
            <div className="h-3 w-3 rounded-full bg-emerald-300" />
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Snap preview
          </div>
        </div>

        <div className="grid flex-1 gap-6 p-6 md:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Captured flyer
            </p>
            <div className="mt-5 rounded-[1.25rem] border border-dashed border-blue-200 bg-white p-5 text-slate-800">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Spring Invite
              </p>
              <h3 className="mt-3 text-3xl font-black leading-tight text-slate-900">
                Community
                <br />
                Open House
              </h3>
              <div className="my-4 h-px w-full bg-slate-200" />
              <p className="text-sm font-medium text-slate-700">April 18 · 6:30 PM</p>
              <p className="mt-2 text-sm text-slate-500">Town Center Hall</p>
            </div>
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Saved details
              </p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">
                Ready to review
              </h3>
            </div>

            {[
              ["What", "Community Open House"],
              ["When", "Apr 18 · 6:30 PM"],
              ["Where", "Town Center Hall"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-2xl border border-white bg-white px-4 py-3 shadow-sm"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {label}
                </span>
                <span className="text-sm font-semibold text-slate-800">{value}</span>
              </div>
            ))}

            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white">
              Share or save instantly
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GymnasticsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className={className}
    >
      <g
        transform="translate(6 6)"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="14" cy="7" r="4.5" />
        <circle cx="34" cy="7" r="4.5" />
        <path d="M10.5 18c4.9 5.8 10.7 8.7 17.3 8.7 5.1 0 9.8-2.4 13.7-7.2" />
        <path d="M27.5 26.5 22 37" />
        <path d="M27.5 26.5 36 37.5" />
        <path d="M18 43h26" />
        <path d="M9.5 15.2c4 1 8.5.8 13-2.2" />
        <path d="M30 18.3c3.8-1.2 7-3.7 9.7-7.2" />
      </g>
    </svg>
  );
}

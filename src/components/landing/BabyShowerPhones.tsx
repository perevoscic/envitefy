"use client";

import Image from "next/image";
import { Calendar, Check, Gift, Heart, MapPin } from "lucide-react";

type Props = {
  className?: string;
};

export default function BabyShowerPhones({ className = "" }: Props) {
  return (
    <div
      className={`relative flex h-[640px] items-center justify-center ${className}`}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[140%] w-[140%] rounded-full bg-gradient-to-tr from-violet-100/70 via-rose-50/60 to-transparent blur-3xl -z-10" />

      {/* Phone frame */}
      <div className="relative z-20 h-[620px] w-[300px] rounded-[45px] border-4 border-slate-800 bg-slate-900 p-3 shadow-2xl transition-transform duration-500 hover:-translate-y-2 hover:rotate-[-2deg]">
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-white">
          {/* Status bar */}
          <div className="pointer-events-none absolute left-1/2 top-3 z-30 flex -translate-x-1/2">
            <div className="h-6 w-24 rounded-full bg-black" />
          </div>

          {/* Header image */}
          <div className="relative h-1/2 bg-[#fdeef8]">
            <Image
              src="/phone-placeholders/baby-shower-gifts.jpeg"
              alt="Baby shower celebration"
              fill
              className="object-cover opacity-95 mix-blend-multiply"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.25em] opacity-90">
                Celebrating baby
              </p>
              <h2 className="font-serif text-3xl text-white">
                <span className="font-medium text-white">Emma&apos;s</span>{" "}
                <span className="font-semibold text-white">Shower</span>
              </h2>
            </div>
            <div className="absolute -bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-violet-600 shadow-lg transition-transform hover:-translate-y-1">
              <Heart size={20} />
            </div>
          </div>

          {/* Body */}
          <div className="relative flex-1 bg-white">
            <div className="absolute -top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-transform hover:-translate-y-1">
              <Heart size={20} />
            </div>
            <div className="mt-2 space-y-4">
              <div className="group flex cursor-pointer items-start gap-4 rounded-lg p-2 transition-colors hover:bg-slate-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-violet-500 group-hover:text-white">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Date
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    Saturday, July 20
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    3:00 PM
                  </p>
                </div>
              </div>

              <div className="group flex cursor-pointer items-start gap-4 rounded-lg p-2 transition-colors hover:bg-slate-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-violet-500 group-hover:text-white">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Venue
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    Garden Terrace, Event Center
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-blue-600">
                    Get directions
                  </p>
                </div>
              </div>

              <div className="group flex cursor-pointer items-start gap-4 rounded-lg p-2 transition-colors hover:bg-slate-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-violet-500 group-hover:text-white">
                  <Gift size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Registry
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    Amazon, Target, Babylist
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-violet-600">
                    View details
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-serif text-sm font-bold text-slate-800">
                    Registry
                  </span>
                  <span className="text-[11px] text-slate-400">
                    4 gifts purchased
                  </span>
                </div>
                <div className="flex gap-2">
                  {["Amazon", "Target", "+3"].map((label) => (
                    <div
                      key={label}
                      className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-[11px] font-medium text-slate-400"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div
        className="glass-panel absolute top-[24%] right-[-16px] z-30 flex max-w-[220px] items-center gap-3 rounded-xl border border-white/60 bg-white/80 px-4 py-3 shadow-xl backdrop-blur"
        style={{ animation: "float 6s ease-in-out infinite" }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <Gift size={16} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">
            Registry update
          </p>
          <p className="text-xs font-semibold text-slate-800">
            Stroller purchase confirmed
          </p>
        </div>
      </div>

      <div
        className="glass-panel absolute bottom-[22%] left-[-8px] z-30 flex items-center gap-3 rounded-xl border border-white/60 bg-white/80 px-4 py-3 shadow-xl backdrop-blur"
        style={{ animation: "float 6s ease-in-out 3s infinite" }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
          <Check size={16} className="text-green-500" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">RSVP</p>
          <p className="text-xs font-semibold text-slate-800">
            Aunt Clara just replied
          </p>
        </div>
      </div>

      <style jsx global>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(12px);
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-18px);
          }
        }
      `}</style>
    </div>
  );
}

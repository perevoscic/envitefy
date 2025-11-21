"use client";

import Image from "next/image";
import { Calendar, Check, Heart, MapPin } from "lucide-react";

type Props = {
  className?: string;
};

export default function WeddingWebsitePhones({ className = "" }: Props) {
  return (
    <div
      className={`relative flex h-[640px] items-center justify-center ${className}`}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[140%] w-[140%] rounded-full bg-gradient-to-tr from-rose-200/60 via-amber-100/50 to-transparent blur-3xl -z-10" />

      {/* Phone frame */}
      <div className="relative z-20 h-[620px] w-[300px] rounded-[45px] border-4 border-slate-800 bg-slate-900 p-3 shadow-2xl transition-transform duration-500 hover:-translate-y-2 hover:rotate-[-2deg]">
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-white">
          {/* Status bar */}
          <div className="pointer-events-none absolute left-1/2 top-3 z-30 flex -translate-x-1/2">
            <div className="h-6 w-24 rounded-full bg-black" />
          </div>

          {/* Header image */}
          <div className="relative h-1/2 bg-[#f3f0ec]">
            <Image
              src="/phone-placeholders/wedding-couple.jpeg"
              alt="Wedding couple"
              fill
              className="object-cover opacity-90 mix-blend-multiply"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] opacity-80">
                We're getting married
              </p>
              <h2 className="font-serif text-3xl text-white">
                <span className="font-medium text-white">
                  Sarah<span className="italic">&</span> James
                </span>{" "}
              </h2>
            </div>
          </div>

          {/* Body */}
          <div className="relative flex-1 bg-white p-6">
            <div className="absolute -top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform hover:-translate-y-1">
              <Heart size={20} />
            </div>

            <div className="mt-2 space-y-4">
              <div className="group flex cursor-pointer items-start gap-4 rounded-lg p-2 transition-colors hover:bg-slate-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Date
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    Saturday, Oct 12
                  </p>
                </div>
              </div>

              <div className="group flex cursor-pointer items-start gap-4 rounded-lg p-2 transition-colors hover:bg-slate-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Venue
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    The Grand Estate, GA
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-blue-600">
                    Get directions
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-serif text-sm font-bold text-slate-800">
                    Registry
                  </span>
                  <span className="text-[11px] text-slate-400">
                    3 items purchased
                  </span>
                </div>
                <div className="flex gap-2">
                  {["Amazon", "Target", "+2"].map((label) => (
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
        className="glass-panel absolute top-[20%] right-[-12px] z-30 flex max-w-[220px] items-center gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3 shadow-xl backdrop-blur"
        style={{ animation: "float 6s ease-in-out infinite" }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Check size={16} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">
            New RSVP
          </p>
          <p className="text-xs font-semibold text-slate-800">
            Aunt Carol is coming!
          </p>
        </div>
      </div>

      <div
        className="glass-panel absolute bottom-[24%] left-[-8px] z-30 flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3 shadow-xl backdrop-blur"
        style={{ animation: "float 6s ease-in-out 3s infinite" }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
          <Calendar size={16} className="text-blue-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">
            Synced
          </p>
          <p className="text-xs font-semibold text-slate-800">
            Added to calendar
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

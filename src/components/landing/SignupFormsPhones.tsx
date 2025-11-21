"use client";

import Image from "next/image";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  MinusCircle,
} from "lucide-react";

type Props = {
  className?: string;
};

type Slot = {
  title: string;
  detail: string;
  state: "signed" | "open" | "full";
};

type ScheduleEntry = {
  day: string;
  slots: Slot[];
};

const schedule: ScheduleEntry[] = [
  {
    day: "Monday, Sept 4",
    slots: [
      {
        title: "Fruit Platter",
        detail: "Signed up by Mike R.",
        state: "signed",
      },
      { title: "Juice Boxes", detail: "1 slot available", state: "open" },
      { title: "Paper Plates", detail: "1 slot available", state: "open" },
    ],
  },
  {
    day: "Tuesday, Sept 5",
    slots: [
      {
        title: "Napkins & Wipes",
        detail: "Signed up by Jane D.",
        state: "signed",
      },
      { title: "Bottled Water", detail: "Slot filled (2/2)", state: "full" },
    ],
  },
];

export default function SignupFormsPhones({ className = "" }: Props) {
  return (
    <div
      className={`relative flex h-[640px] items-center justify-center ${className}`}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[140%] w-[140%] rounded-full bg-gradient-to-tr from-emerald-200/60 via-teal-100/60 to-transparent blur-3xl -z-10" />

      {/* Phone frame */}
      <div className="relative z-20 h-[620px] w-[300px] rounded-[45px] border-4 border-slate-800 bg-slate-900 p-3 shadow-2xl transition-transform duration-500 hover:-translate-y-2 hover:rotate-[-2deg]">
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-white">
          {/* Status bar */}
          <div className="pointer-events-none absolute left-1/2 top-3 z-30 flex -translate-x-1/2">
            <div className="h-6 w-24 rounded-full bg-black" />
          </div>

          {/* Header image / gradient */}
          <div className="relative h-1/2 bg-[#e4f3f1]">
            <Image
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80"
              alt="Classroom helpers"
              fill
              className="object-cover opacity-95 mix-blend-multiply"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-900/70 via-teal-900/20 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.25em] opacity-90">
                Smart sign-ups
              </p>
              <h2 className="font-serif text-3xl text-white">
                Classroom Snacks
              </h2>
            </div>
            <div className="absolute -bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-teal-600 shadow-lg transition-transform hover:-translate-y-1">
              <ClipboardList size={20} />
            </div>
          </div>

          {/* Body */}
          <div className="relative flex-1 bg-white p-6">
            <div className="mt-2 space-y-4">
              {schedule.map((entry) => (
                <div key={entry.day} className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {entry.day}
                  </p>
                  <div className="space-y-3">
                    {entry.slots.map((slot) => (
                      <SlotCard key={slot.title} {...slot} />
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-serif text-sm font-bold text-slate-800">
                    Progress
                  </span>
                  <span className="text-[11px] text-slate-400">
                    5 slots filled
                  </span>
                </div>
                <div className="flex gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
                    <CheckCircle2 className="text-teal-600" size={16} />
                    Auto reminders
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
                    <Calendar className="text-teal-600" size={16} />
                    Live updates
                  </div>
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
          <CheckCircle2 size={16} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">
            New signup
          </p>
          <p className="text-xs font-semibold text-slate-800">
            Sarah added Chips & Dip
          </p>
        </div>
      </div>

      <div
        className="glass-panel absolute bottom-[24%] left-[-8px] z-30 flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3 shadow-xl backdrop-blur"
        style={{ animation: "float 6s ease-in-out 3s infinite" }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
          <MinusCircle size={16} className="text-red-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">
            Slot filled
          </p>
          <p className="text-xs font-semibold text-slate-800">
            Water case now full
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

function SlotCard({ title, detail, state }: Slot) {
  const isSigned = state === "signed";
  const isFull = state === "full";

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${
        isSigned
          ? "border-green-200 bg-green-50/60"
          : isFull
          ? "border-red-200 bg-red-50/50"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center">
          {isSigned && <CheckCircle2 className="text-green-600" size={20} />}
          {!isSigned && !isFull && (
            <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
          )}
          {isFull && <MinusCircle className="text-red-600" size={20} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p
            className={`text-xs font-medium ${
              isSigned
                ? "text-green-600"
                : isFull
                ? "text-red-600"
                : "text-slate-500"
            }`}
          >
            {detail}
          </p>
        </div>
      </div>
      {!isSigned && !isFull && (
        <button className="rounded-full px-3 py-1.5 text-xs font-bold text-teal-600 transition-colors hover:bg-teal-50">
          Sign Up
        </button>
      )}
    </div>
  );
}

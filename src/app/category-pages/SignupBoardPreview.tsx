"use client";

import { ArrowRight, CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import { useId, useState } from "react";

export default function SignupBoardPreview({ compact = false }: { compact?: boolean }) {
  const [claimed, setClaimed] = useState(false);
  const statusId = useId();
  const rows = [
    { label: "Welcome booth", claimed: 4, total: 4, tone: "bg-emerald-500" },
    { label: "Cake walk", claimed: claimed ? 4 : 3, total: 4, tone: "bg-[#6b7ee8]" },
    { label: "Clean-up crew", claimed: 1, total: 4, tone: "bg-amber-500" },
  ];

  return (
    <div
      data-appearance-scope="authored"
      className={`overflow-hidden border border-white/22 bg-[#172044]/88 text-white shadow-[0_34px_100px_rgba(8,14,41,0.4)] backdrop-blur-xl ${
        compact ? "rounded-[1.8rem] p-5 sm:p-6" : "rounded-[2rem] p-5 sm:p-7"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#aebcff]">
            Interactive sample
          </p>
          <h2 className="mt-2 text-2xl font-semibold !text-white sm:text-3xl">Spring Carnival</h2>
          <p className="mt-1.5 text-xs text-white/70">Saturday · 10:00 AM–3:00 PM</p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/9">
          <ClipboardList className="h-5 w-5 text-[#b9c4ff]" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between border-y border-white/12 py-4">
        <div>
          <p className="text-3xl font-semibold">{claimed ? 32 : 31}</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/70">
            claimed
          </p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-semibold text-[#f2c27b]">{claimed ? 13 : 14}</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/70">
            still open
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold">4</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/70">
            lists
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((row) => {
          const complete = row.claimed === row.total;
          return (
            <div key={row.label} className="rounded-2xl bg-white/7 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {complete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  ) : (
                    <Clock3 className="h-4 w-4 text-white/65" aria-hidden="true" />
                  )}
                  <span className="text-sm font-semibold">{row.label}</span>
                </div>
                <span className="text-xs font-bold text-white/70">
                  {row.claimed}/{row.total}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${row.tone}`}
                  style={{ width: `${(row.claimed / row.total) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setClaimed((value) => !value)}
        aria-pressed={claimed}
        aria-describedby={statusId}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#18214d]"
      >
        {claimed ? "Undo sample signup" : "Claim a sample spot"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
      <p id={statusId} role="status" className="mt-3 text-center text-xs leading-5 text-white/70">
        {claimed ? "Sample Cake walk spot claimed. " : "Try the sample. "}
        No response is saved or sent.
      </p>
    </div>
  );
}

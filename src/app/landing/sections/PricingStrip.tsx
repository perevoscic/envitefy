"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PricingStrip({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section className="w-full py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.8rem] border border-[#e8ddff] bg-[linear-gradient(180deg,#ffffff_0%,#f8f4ff_100%)] px-6 py-14 text-center text-[#17132b] shadow-[0_30px_80px_rgba(98,71,186,0.12)] md:px-16 md:py-16">
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-95">
            <div className="absolute left-[10%] top-0 h-[24rem] w-[24rem] -translate-y-1/2 rounded-full bg-[#eadfff] blur-[100px]" />
            <div className="absolute bottom-0 right-[8%] h-[24rem] w-[24rem] translate-y-1/2 rounded-full bg-[#efe8ff] blur-[100px]" />
          </div>

          <div className="relative z-10">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#856ed1]">
              Start from the file you already have
            </p>
            <h3
              className="mx-auto mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl"
              style={{
                fontFamily:
                  'var(--font-montserrat), var(--font-sans), sans-serif',
              }}
            >
              Turn PDFs, schedules, flyers, and invites into a live page people
              will actually open.
            </h3>
            <p className="mx-auto mb-10 mt-5 max-w-3xl text-lg leading-8 text-[#58536e] md:text-xl">
              Start with Gymnastics when the flagship use case is meet-weekend
              coordination. Use Snap when the input is a flyer, schedule,
              invite, or event image that needs fast cleanup and sharing.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isAuthed ? (
                <Link
                  href="/"
                  className="rounded-full bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/gymnastics"
                    className="group flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#6f4cff_0%,#8f67ff_100%)] px-8 py-4 text-lg font-semibold text-white shadow-[0_20px_46px_rgba(111,76,255,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_52px_rgba(111,76,255,0.3)]"
                  >
                    Start with Gymnastics
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/snap"
                    className="rounded-full border border-[#e6dcff] bg-white px-8 py-4 text-lg font-semibold text-[#2f2550] transition-all hover:-translate-y-0.5 hover:border-[#d9cbff] hover:bg-[#faf7ff] hover:shadow-lg"
                  >
                    Try Snap
                  </Link>
                </>
              )}
            </div>

            <p className="mt-6 text-sm text-[#68627d]">
              Gymnastics is the clearest flagship claim. Snap stays available
              for fast capture across invites, flyers, schedules, and event
              images.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

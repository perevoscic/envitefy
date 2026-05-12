"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { landingFaqItems } from "../faq-data";

export default function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="hash-anchor-below-fixed-nav px-4 py-6 sm:px-6 lg:px-8"
      aria-labelledby="landing-faq-heading"
    >
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[2rem] border border-[#eadcf5] bg-[#fffafd] px-7 py-8 shadow-[0_28px_90px_rgba(116,87,166,0.09)] md:px-12 md:py-10">
          <div className="mx-auto w-full max-w-3xl text-center lg:text-left">
            <span className="inline-flex rounded-full border border-[#eadcf5] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#7457a6]">
              FAQ
            </span>
            <h2
              id="landing-faq-heading"
              className="mt-6 w-full text-3xl font-bold tracking-tight text-[#241c2b] sm:text-4xl lg:text-5xl"
            >
              Questions before you try it
            </h2>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-[#62586a]">
              Quick answers about Concierge, uploads, event pages, RSVP tracking, smart sign-ups,
              sharing, and guests.
            </p>

            <div className="mt-10 space-y-3">
              {landingFaqItems.map((item, idx) => (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-[2rem] border border-[#eadcf5] bg-[#fbf8ff] shadow-[0_16px_40px_rgba(116,87,166,0.06)]"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5 sm:py-5"
                    onClick={() => setOpen(open === idx ? null : idx)}
                    aria-expanded={open === idx}
                  >
                    <span className="text-base font-semibold leading-snug text-[#241c2b] sm:text-lg">
                      {item.q}
                    </span>
                    <span className="flex shrink-0 rounded-full border border-[#d8ccef] bg-white p-2 text-[#7457a6]">
                      {open === idx ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      open === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="px-4 pb-5 leading-7 text-[#62586a] sm:px-5 sm:pb-6">{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { landingFaqItems } from "../faq-data";
import styles from "../LandingExperience.module.css";

export default function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="hash-anchor-below-fixed-nav px-4 py-6 sm:px-6 lg:px-8"
      aria-labelledby="landing-faq-heading"
    >
      <div className="mx-auto max-w-5xl">
        <div
          className={`${styles.surfacePanel} overflow-hidden rounded-[2.75rem] bg-white px-7 py-8 shadow-[0_28px_90px_rgba(43,27,22,0.08)] md:px-12 md:py-10`}
        >
          <div className="mx-auto w-full max-w-3xl text-center lg:text-left">
            <span className={styles.eyebrow}>FAQ</span>
            <h2
              id="landing-faq-heading"
              className={`${styles.headline} mt-6 w-full text-3xl font-bold tracking-tight text-[#2b1b16] sm:text-4xl lg:text-5xl`}
            >
              Questions before you try it
            </h2>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-[#6a5549]">
              Quick answers about Snap, gymnastics meet pages, sharing, and
              RSVPs.
            </p>

            <div className="mt-10 space-y-3">
              {landingFaqItems.map((item, idx) => (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-[1.6rem] border border-[#efe4db] bg-[#fbf7f2] shadow-[0_16px_40px_rgba(43,27,22,0.05)]"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5 sm:py-5"
                    onClick={() => setOpen(open === idx ? null : idx)}
                    aria-expanded={open === idx}
                  >
                    <span className="text-base font-semibold leading-snug text-[#2b1b16] sm:text-lg">
                      {item.q}
                    </span>
                    <span className="flex shrink-0 rounded-full border border-[#e7d8ce] bg-white p-2 text-[#c98f6b]">
                      {open === idx ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      open === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="px-4 pb-5 leading-7 text-[#6a5549] sm:px-5 sm:pb-6">
                        {item.a}
                      </p>
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

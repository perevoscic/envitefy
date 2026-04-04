"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import styles from "../LandingExperience.module.css";

const glassSectionClass =
  "relative isolate overflow-hidden rounded-[2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.1))] shadow-[0_32px_90px_rgba(4,1,14,0.42),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-2xl [-webkit-backdrop-filter:blur(40px)]";

const sectionBubbleClass =
  "mb-5 inline-flex rounded-full border border-white/28 bg-[rgba(32,18,58,0.62)] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-white shadow-[0_12px_28px_rgba(6,2,16,0.22)]";

const items = [
  {
    q: "What does Snap do on Envitefy?",
    a: "Snap turns photos or uploads of invites, flyers, schedules, and screenshots into a structured event page you can edit, publish, and share. It is built for real-world paper and chat chaos, not perfect templates.",
  },
  {
    q: "Can I upload a PDF or image instead of using my camera?",
    a: "Yes. Drag in a PDF, pick from your camera roll, or snap a photo. Envitefy is meant for whatever you already have in hand.",
  },
  {
    q: "How is Gymnastics different from Snap?",
    a: "Gymnastics is tuned for meet weekends: schedules, venues, hotels, maps, and updates on one hosted page. Snap is the broader flow for many event types. Your account can use both.",
  },
  {
    q: "Can I edit details after Envitefy extracts them?",
    a: "Yes. Extraction is a head start, not a lock-in. Review fields, fix anything that missed, then publish when you are ready.",
  },
  {
    q: "Do guests need to install an app?",
    a: "No. Shared event pages open in the browser on phones and desktops, so one link is enough.",
  },
  {
    q: "How do RSVPs work?",
    a: "Guests can respond from the live page without creating friction. You keep responses organized with the event instead of scattered across texts.",
  },
] as const;

export default function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="scroll-mt-24 px-4 py-6 sm:px-6 lg:px-8"
      aria-labelledby="landing-faq-heading"
    >
      <div
        className={`mx-auto max-w-5xl ${glassSectionClass} px-7 py-8 md:px-12 md:py-10`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(129,140,248,0.08),transparent_40%,rgba(124,58,237,0.06))]" />
        <div className="relative">
          <div className="mx-auto w-full max-w-3xl text-center lg:text-left">
            <span className={sectionBubbleClass}>FAQ</span>
            <h2
              id="landing-faq-heading"
              className={`${styles.headline} w-full text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl`}
            >
              Questions before you try it
            </h2>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-white/85">
              Quick answers about Snap, gymnastics meet pages, sharing, and
              RSVPs.
            </p>

            <div className="mt-10 space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06]"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5 sm:py-5"
                    onClick={() => setOpen(open === idx ? null : idx)}
                    aria-expanded={open === idx}
                  >
                    <span className="text-base font-semibold leading-snug text-white sm:text-lg">
                      {item.q}
                    </span>
                    <span className="flex shrink-0 rounded-full border border-white/16 bg-white/10 p-2 text-white">
                      {open === idx ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      open === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="px-4 pb-5 leading-7 text-white/80 sm:px-5 sm:pb-6">
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

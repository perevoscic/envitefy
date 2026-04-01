"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const qs = [
  {
    q: "Can Envitefy turn a gymnastics meet PDF into a live page?",
    a: "Yes. Gymnastics is the flagship workflow here. Envitefy is designed to turn meet packets, schedules, and supporting documents into one mobile-friendly event page families and coaches can actually use.",
  },
  {
    q: "What can I keep on the gymnastics page?",
    a: "The page can hold meet schedules, venue details, parking notes, maps, documents, updates, announcements, and results links so the weekend information stays centralized.",
  },
  {
    q: "Can I upload a flyer or schedule instead of snapping it?",
    a: "Yes. Snap works with both uploads and camera capture. It is meant for invites, flyers, schedules, screenshots, and other event images that need a cleaner digital output.",
  },
  {
    q: "Can I edit the details after upload?",
    a: "Yes. The goal is faster setup, not locking you into raw extraction. You can review, refine, and publish the details before sharing the page.",
  },
  {
    q: "Do guests or families need to install an app?",
    a: "No. Envitefy pages open in the browser, which keeps the experience lightweight, faster to share, and easier to access on mobile.",
  },
  {
    q: "Can I use it for events beyond gymnastics?",
    a: "Yes. Gymnastics is the clearest flagship use case today, but Snap is intentionally broader. It can start from invites, flyers, schedules, and event images across many event types.",
  },
] as const;

export default function FAQ({ showHeader = true }: { showHeader?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {showHeader ? (
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#856ed1]">
              FAQ
            </p>
            <h2
              className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#17132b] sm:text-5xl"
              style={{
                fontFamily:
                  'var(--font-montserrat), var(--font-sans), sans-serif',
              }}
            >
              Clear answers before someone commits to the workflow.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#58536e]">
              Keep the section tight, product-specific, and centered on the two
              promises this page makes: Gymnastics first, Snap second.
            </p>
          </div>
        ) : null}

        <div className="space-y-4">
          {qs.map((item, idx) => (
            <div
              key={item.q}
              className="overflow-hidden rounded-[1.75rem] border border-[#e8ddff] bg-white shadow-[0_18px_46px_rgba(101,76,188,0.06)]"
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left sm:px-7"
                onClick={() => setOpen(open === idx ? null : idx)}
                aria-expanded={open === idx}
              >
                <span className="text-lg font-semibold leading-7 text-[#241c44]">
                  {item.q}
                </span>
                <span className="flex-shrink-0 rounded-full border border-[#ece4ff] bg-[#faf7ff] p-2 text-[#7b65c8]">
                  {open === idx ? <Minus size={18} /> : <Plus size={18} />}
                </span>
              </button>
              <div
                className={`overflow-hidden px-6 transition-all duration-300 ease-in-out sm:px-7 ${
                  open === idx ? "max-h-56 pb-6 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="leading-7 text-[#59546e]">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const items = [
  {
    q: "Can Envitefy turn our gymnastics meet packet or schedule into a live page?",
    a: "Yes. Upload meet packets, rundowns, venue sheets, and supporting PDFs. Envitefy structures the details into a single mobile-friendly meet page so families are not hunting through attachments and group chats.",
  },
  {
    q: "How do rotations, warm-ups, and awards show up for parents?",
    a: "Meet blocks can include check-in, warm-up windows, rotation context, and awards timing in scannable sections. The goal is a clear timeline parents can read on a phone at the venue—not a zoomed-in spreadsheet.",
  },
  {
    q: "Can hotel blocks, maps, and parking live on the same page as the schedule?",
    a: "Yes. Travel details like hotel booking links and deadlines, maps, parking notes, and shuttle info can sit alongside the competition timeline so the whole weekend is one link.",
  },
  {
    q: "Do spectators and families need to install an app?",
    a: "No. Shared meet pages open in the browser on phones, tablets, and desktops. You distribute one link by text, email, or team channels.",
  },
  {
    q: "What happens when the schedule changes at the last minute?",
    a: "You can update the published page and share the same link. Posting a change once helps every family see the latest version instead of resending PDFs.",
  },
  {
    q: "How is Gymnastics on Envitefy different from Snap?",
    a: "Gymnastics is built around meet pages—schedules, venues, hotels, team coordination, and updates in one hosted page. Snap is the broader capture flow for invites, flyers, and many other event types. Gymnastics accounts include both workflows.",
  },
  {
    q: "Who typically publishes the page—a club, meet director, or team parent?",
    a: "Anyone organizing or communicating the meet can build the page: meet directors, club admins, booster reps, or coaches. The important part is one authoritative link for athletes, parents, and staff.",
  },
] as const;

export default function GymnasticsLandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="scroll-mt-20 border-t border-slate-100 bg-gradient-to-b from-white to-[#fafbfe] py-20 lg:py-28"
      aria-labelledby="gymnastics-faq-heading"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
            FAQ
          </p>
          <h2
            id="gymnastics-faq-heading"
            className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-slate-900"
            style={{ fontFamily: "inherit" }}
          >
            Gymnastics meet pages, answered
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500">
            Practical questions coaches, meet directors, and parent reps ask
            before moving a weekend off PDFs and text threads.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                onClick={() => setOpen(open === idx ? null : idx)}
                aria-expanded={open === idx}
              >
                <span className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                  {item.q}
                </span>
                <span className="flex shrink-0 rounded-full border border-indigo-100 bg-indigo-50/80 p-2 text-indigo-600">
                  {open === idx ? <Minus size={18} /> : <Plus size={18} />}
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                  open === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="px-5 pb-5 leading-7 text-slate-600 sm:px-6 sm:pb-6">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-sm text-slate-500">
          Looking for general product questions? See the{" "}
          <a
            href="/faq"
            className="font-semibold text-indigo-600 underline decoration-indigo-200 underline-offset-2 transition hover:text-indigo-700"
          >
            full Envitefy FAQ
          </a>
          .
        </p>
      </div>
    </section>
  );
}

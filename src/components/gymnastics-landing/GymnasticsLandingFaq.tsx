"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import styles from "./GymnasticsLanding.module.css";

const items = [
  {
    q: "Can Envitefy turn our gymnastics meet packet or schedule into a live page?",
    a: "Yes. Upload meet packets, rundowns, venue sheets, and supporting PDFs. Envitefy structures the details into a single mobile-friendly meet page so families are not hunting through attachments and group chats.",
  },
  {
    q: "How do rotations, warm-ups, and awards show up for parents?",
    a: "Meet blocks can include check-in, warm-up windows, rotation context, and awards timing in scannable sections. The goal is a clear timeline parents can read on a phone at the venue, not a zoomed-in spreadsheet.",
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
    a: "Gymnastics is built around meet pages: schedules, venues, hotels, team coordination, and updates in one hosted page. Snap is the broader capture flow for invites, flyers, and many other event types. Gymnastics accounts include both workflows.",
  },
  {
    q: "Who typically publishes the page: a club, meet director, or team parent?",
    a: "Anyone organizing or communicating the meet can build the page: meet directors, club admins, booster reps, or coaches. The important part is one authoritative link for athletes, parents, and staff.",
  },
] as const;

const gymnasticsSectionSpacingClass = "hash-anchor-below-fixed-nav px-4 py-6 sm:px-6 lg:px-8";
const glassSectionClass =
  "theme-glass-surface relative isolate overflow-hidden rounded-[2rem] border border-white/14 shadow-[0_32px_90px_rgba(4,1,14,0.42)]";
const sectionBubbleClass =
  "mb-5 inline-flex rounded-full border border-white/28 bg-[rgba(32,18,58,0.62)] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-white shadow-[0_12px_28px_rgba(6,2,16,0.22)]";

export default function GymnasticsLandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className={gymnasticsSectionSpacingClass}
      aria-labelledby="gymnastics-faq-heading"
    >
      <div
        className={`mx-auto max-w-5xl ${glassSectionClass} ${styles.sectionShell} px-7 py-8 md:px-12 md:py-10`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(129,140,248,0.08),transparent_40%,rgba(124,58,237,0.06))]" />
        <div className="relative">
          <div className="mx-auto w-full max-w-3xl text-center lg:text-left">
            <span className={sectionBubbleClass}>FAQ</span>
            <h2
              id="gymnastics-faq-heading"
              className={`${styles.headline} w-full text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl`}
            >
              Gymnastics meet pages, answered
            </h2>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-white/85">
              Practical questions coaches, meet directors, and parent reps ask before moving a
              weekend off PDFs and text threads.
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
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="px-4 pb-5 leading-7 text-white/80 sm:px-5 sm:pb-6">{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-sm text-white/66">
              Looking for general product questions? See the{" "}
              <a
                href="/faq"
                className="font-semibold text-white underline decoration-white/30 underline-offset-2 transition hover:text-white/90"
              >
                full Envitefy FAQ
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import { useState } from "react";

const qs = [
  {
    q: "Can I share my event without guests downloading an app?",
    a: "Yes! Guests can open and RSVP via an email or text link — no downloads needed.",
  },
  {
    q: "If I change event details, do guests see the update?",
    a: "Absolutely. The shared link always reflects the latest info, so everyone stays on the same page.",
  },
  {
    q: "Can I track RSVPs?",
    a: "Yes. Envitefy collects replies from text or email and sends you updates, so you always know who's coming.",
  },
  {
    q: "What are smart sign-up forms?",
    a: "Smart sign-up forms let families claim snack duty, volunteer slots, or carpool seats right from your event link, and they update instantly when someone responds.",
  },
  {
    q: "How accurate is Envitefy's scanning?",
    a: "Envitefy uses advanced text recognition to pull dates, times, locations, and notes from flyers and PDFs with high accuracy. You can review everything before saving, and tweak any detail with a tap.",
  },
  {
    q: "Does Envitefy integrate with Apple Calendar?",
    a: "Yes! We generate universally compatible calendar files that open instantly in Apple Calendar on iPhone, iPad, and Mac.",
  },
  {
    q: "Can I upload PDF files for event extraction?",
    a: "Yes, Envitefy processes PDFs just like photos — even multi-page schedules — so you can capture every date at once.",
  },
  {
    q: "What are the available subscription plans?",
    a: "Envitefy offers a free tier with core features plus monthly and yearly plans that unlock bulk schedules, faster processing, and premium support. Visit the Subscription page for details.",
  },
  {
    q: "How do promo codes work?",
    a: "Promo codes extend your subscription or gift extra time to someone else. Redeem them from your Subscription settings to apply the benefits instantly.",
  },
  {
    q: "Which calendar services does Envitefy support for direct integration?",
    a: "Envitefy offers secure, one-tap connections to Google Calendar and Microsoft Outlook, and universal ICS downloads for everything else.",
  },
  {
    q: "Can Envitefy handle sports schedules and weekly practices?",
    a: "Definitely. Envitefy recognizes season flyers, builds each meet automatically, and creates weekly practice schedules with recurring reminders.",
  },
  {
    q: "What types of image files can I upload?",
    a: "You can upload common image formats like JPEG, PNG, and GIF. Clear, well-lit photos give the best results.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section aria-labelledby="faq" className="w-full">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 id="faq" className="text-2xl sm:text-3xl font-bold text-center">
          FAQ
        </h2>
        <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface/70">
          {qs.map((item, idx) => (
            <div key={item.q}>
              <button
                className="w-full text-left px-4 sm:px-6 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                onClick={() => setOpen(open === idx ? null : idx)}
                aria-expanded={open === idx}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold">{item.q}</span>
                  <span className="text-foreground/60">
                    {open === idx ? "−" : "+"}
                  </span>
                </div>
              </button>
              {open === idx && (
                <div className="px-4 sm:px-6 pb-5 text-foreground/80">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

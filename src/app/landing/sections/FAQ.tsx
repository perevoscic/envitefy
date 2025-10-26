"use client";
import { useState } from "react";

const qs = [
  {
    q: "Can I share my event without guests downloading an app?",
    a: "Yes! Guests can open and RSVP via an email or text link — no downloads needed.",
  },
  {
    q: "Can I co-manage events with other Envitefy users?",
    a: "Yes. Invite another Envitefy user from the share menu and they'll accept from their email to see the event in their dashboard, access the live link, and stay synced on every change.",
  },
  {
    q: "If I change event details, do guests see the update?",
    a: "Absolutely. The shared link always reflects the latest info, so everyone stays on the same page.",
  },
  {
    q: "Can I track RSVPs?",
    a: "Yes. Envitefy collects replies from text or email and sends you updates, so you and any collaborators always know who's coming.",
  },
  {
    q: "What are smart sign-up forms?",
    a: "Smart sign-up forms let families claim snack duty, volunteer slots, or carpool seats right from your event link. We enforce capacity limits, manage waitlists automatically, and sync every response in your event history so you always know who's confirmed.",
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
    q: "Can I add an entire season to my calendar at once?",
    a: "Absolutely. Envitefy builds multi-event ICS downloads and offers bulk pushes directly to Google Calendar and Outlook, so you can drop every game or practice onto your calendar with one upload.",
  },
  {
    q: "What are the available subscription plans?",
    a: "Envitefy offers a free tier with core features plus monthly and yearly plans that unlock bulk schedule tools, faster processing, and premium support. You can upgrade or downgrade any time from the Subscription page, and the self-serve billing portal lets you update payment methods or renewals on your own.",
  },
  {
    q: "How do I manage my subscription or payment info?",
    a: "Open the Subscription page and launch the billing portal to update cards, download invoices, or set cancellations whenever you need. Changes take effect immediately.",
  },
  {
    q: "Can I gift Envitefy to someone else?",
    a: "Yes. Start a gift checkout from the Subscription page to send prepaid months or years to a friend. We email them a code once payment clears, and if they already use Envitefy the bonus time is applied automatically.",
  },
  {
    q: "How do promo codes work?",
    a: "Promo codes extend your subscription or credit extra time to someone else. Redeem them from your Subscription settings to apply the benefits instantly, and gifted codes sent to existing users attach to their account right away.",
  },
  {
    q: "Which calendar services does Envitefy support for direct integration?",
    a: "Envitefy offers secure, one-tap connections to Google Calendar and Microsoft Outlook, plus universal ICS downloads for everything else. Bulk imports work the same way, so large schedules sync just as easily as single events.",
  },
  {
    q: "Can Envitefy handle sports schedules and weekly practices?",
    a: "Definitely. Envitefy recognizes season flyers, builds each meet automatically, and creates weekly practice schedules with recurring reminders that you can export individually or in bulk.",
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

"use client";
import { useState } from "react";

const qs = [
  {
    q: "Can I share my event without guests downloading an app?",
    a: "Yes! Guests can open and RSVP via an email or text link - no downloads needed.",
  },
  {
    q: "If I change event details, do guests see the update?",
    a: "Absolutely. The shared link always reflects the latest info, so everyone stays on the same page.",
  },
  {
    q: "Can I track RSVPs?",
    a: "Yes. You’ll see who’s attending by receiving email or text notifications when guests reply.",
  },
  {
    q: "How accurate is Snap My Date's OCR technology?",
    a: "Snap My Date utilizes advanced scanning technology to extract event details from photos and PDFs with high accuracy. While our system is very robust, you always have the opportunity to review and edit any extracted information before saving it to your calendar.",
  },
  {
    q: "Does Snap My Date integrate with Apple Calendar?",
    a: "Yes! We generate universally compatible requests, which are easily imported into Apple Calendar on your iOS devices and macOS. It's a seamless way to get your events into your preferred Apple ecosystem.",
  },
  {
    q: "Can I upload PDF files for event extraction?",
    a: "Yes, you can directly upload PDF documents. Our OCR engine processes them just like image files, allowing for efficient extraction of event information from multi-page documents as well.",
  },
  {
    q: "What are the available subscription plans?",
    a: "Snap My Date offers a freemium tier with core features plus monthly and yearly subscriptions that unlock advanced automation, faster processing, and premium support. You can view the full breakdown on our Subscription page.",
  },
  {
    q: "How do promo codes work?",
    a: "Promo codes extend your subscription or gift extra subscription time to someone else. Redeem them from your Subscription settings to apply the added benefits instantly.",
  },
  {
    q: "Which calendar services does Snap My Date support for direct integration?",
    a: "Snap My Date offers direct, secure integration with Google Calendar and Microsoft Outlook. This allows for quick, one-tap saving of extracted events directly into your chosen calendar, complete with all details and reminders.",
  },
  {
    q: "What types of image files can I upload?",
    a: "You can upload various common image formats, including JPEG, PNG, and GIF. For best results, we recommend clear, well-lit images of your event materials.",
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

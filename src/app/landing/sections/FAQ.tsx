"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const qs = [
  {
    q: "Do guests need to download the app?",
    a: "No! That's the best part. You send a simple link (via text or email), and guests can view details, RSVP, and add to their calendar instantly—no app required.",
  },
  {
    q: "Does it work with my calendar?",
    a: "Yes. We sync seamlessly with Google Calendar, Outlook, and Apple Calendar. You can also download a universal .ics file for any other platform.",
  },
  {
    q: "How accurate is the scanning?",
    a: "Extremely accurate. We use advanced AI vision to read dates, times, addresses, and even handwritten notes from your flyers and screenshots. You can always edit the details before saving.",
  },
  {
    q: "Is it free?",
    a: "Yes, Envitefy has a generous free plan that lets you snap flyers, create events, and manage RSVPs without paying a dime. We don't require a credit card to sign up.",
  },
  {
    q: "Can I track RSVPs?",
    a: "Absolutely. You'll see who's coming, who's not, and who's unsure—all in one dashboard. We can even collect meal preferences or other custom questions.",
  },
  {
    q: "What about weekly practice schedules?",
    a: "We handle those too! Upload a season schedule or practice PDF, and we'll extract all the recurring events at once so you can add the whole season to your calendar in one click.",
  },
];

export default function FAQ({ showHeader = true }: { showHeader?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-transparent">
      <div className="max-w-4xl mx-auto px-6">
        {showHeader && (
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2f2850] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-[#5a5377]">
              Have something else in mind? Reach out to us directly.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {qs.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#e5dcff] overflow-hidden transition-all duration-200 hover:border-[#cfc2ff] hover:shadow-sm"
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                onClick={() => setOpen(open === idx ? null : idx)}
                aria-expanded={open === idx}
              >
                <span className="font-semibold text-[#232a39] text-lg">
                  {item.q}
                </span>
                <span className="text-[#9aa1af] flex-shrink-0">
                  {open === idx ? <Minus size={20} /> : <Plus size={20} />}
                </span>
              </button>
              <div
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  open === idx
                    ? "max-h-48 pb-6 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-[#4f5969] leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

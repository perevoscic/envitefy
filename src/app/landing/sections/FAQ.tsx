"use client";
import { useState } from "react";

const qs = [
  {
    q: "How accurate is the OCR?",
    a: "Very good on clear photos and PDFs. You can review and edit details before saving.",
  },
  {
    q: "Does it work with schedules?",
    a: "Yes. We detect multi‑game schedules and expand them into separate events when possible.",
  },
  {
    q: "What about privacy?",
    a: "Uploads are processed to extract event details. You control what is saved in your history.",
  },
  {
    q: "Do you support Apple Calendar?",
    a: "Yes. We generate standard .ics files that import on iOS and macOS.",
  },
  {
    q: "Can I use PDFs?",
    a: "Yes. Upload PDFs directly; we pass them through OCR like images.",
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
                  <span className="font-medium">{item.q}</span>
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

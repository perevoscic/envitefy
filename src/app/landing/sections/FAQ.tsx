"use client";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const qs = [
  {
    q: "Do guests need to download the app?",
    a: "No. Shared event pages open in the browser, so guests can view details and save the event without installing anything.",
  },
  {
    q: "What is the difference between Snap and Gymnastics?",
    a: "Snap is available to every account for fast flyer and invite capture. Gymnastics accounts also unlock gymnastics meet pages and meet-specific planning tools.",
  },
  {
    q: "Can I still use Snap if I sign up from the Gymnastics page?",
    a: "Yes. Gymnastics signups receive both gymnastics and snap access.",
  },
  {
    q: "Can I upgrade from Snap to Gymnastics later?",
    a: "Existing accounts can continue signing in. If you need gymnastics access added to an existing account, contact support so the right scope can be enabled safely.",
  },
  {
    q: "Does it work with my calendar?",
    a: "Yes. Envitefy works with Google Calendar, Outlook, Apple Calendar, and downloadable .ics files.",
  },
  {
    q: "How accurate is the scanning?",
    a: "Snap is designed to pull the key event details quickly, and you can review the result before you save or share it.",
  },
] as const;

export default function FAQ({ showHeader = true }: { showHeader?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-transparent py-24">
      <div className="mx-auto max-w-4xl px-6">
        {showHeader && (
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[#2f2850] md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-[#5a5377]">
              Questions about Snap, Gymnastics, or existing accounts.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {qs.map((item, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl border border-[#e5dcff] bg-white transition-all duration-200 hover:border-[#cfc2ff] hover:shadow-sm"
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpen(open === idx ? null : idx)}
                aria-expanded={open === idx}
              >
                <span className="text-lg font-semibold text-[#232a39]">
                  {item.q}
                </span>
                <span className="flex-shrink-0 text-[#9aa1af]">
                  {open === idx ? <Minus size={20} /> : <Plus size={20} />}
                </span>
              </button>
              <div
                className={`overflow-hidden px-6 transition-all duration-300 ease-in-out ${
                  open === idx ? "max-h-48 pb-6 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="leading-relaxed text-[#4f5969]">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

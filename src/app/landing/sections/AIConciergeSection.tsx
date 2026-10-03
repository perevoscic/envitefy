"use client";

import { ArrowRight, Camera, LayoutTemplate, Sparkles } from "lucide-react";
import Link from "next/link";

const tools = [
  { title: "Live Card", href: "/live-cards", icon: Sparkles, description: "Choose a visual direction, add your event details, and review your invitation before publishing." },
  { title: "Event Page", href: "/event/general", icon: LayoutTemplate, description: "Start with a template and edit your event details, design, and guest actions in one workspace." },
  { title: "Snap / Upload", href: "/snap", icon: Camera, description: "Upload an invitation, flyer, schedule, or PDF and review the extracted event information." },
];

export default function AIConciergeSection({ onPrimaryAction }: { onPrimaryAction?: () => void }) {
  return (
    <section id="concierge" className="border-b border-[#e4d9c9] bg-[#f7f1ff] px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-wide text-[#6557cf]">Envitefy Create</p>
        <h2 className="mt-4 font-serif text-4xl text-[#201a23] sm:text-5xl">Choose how to create your event</h2>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[#65586c]">Start with a design, an Event Page template, or an invitation you already have. Add your details and review before explicitly saving or publishing.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tools.map(({ title, href, icon: Icon, description }) => (
            <Link key={title} href={href} className="rounded-2xl border border-[#d8c9f2] bg-white p-6 text-[#201a23] transition hover:border-[#6557cf] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6557cf]">
              <Icon size={24} className="text-[#6557cf]" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#65586c]">{description}</p>
              <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#6557cf]">Open {title}<ArrowRight size={17} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
        {onPrimaryAction ? <button type="button" onClick={onPrimaryAction} className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#241b35] px-6 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6557cf]">Ask about Envitefy<ArrowRight size={17} aria-hidden="true" /></button> : null}
      </div>
    </section>
  );
}

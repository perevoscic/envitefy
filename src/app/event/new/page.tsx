"use client";

import { EnvitefyBuilderHero } from "@/components/home/EnvitefyBuilderHero";
import {
  CalendarPlus,
  MapPinned,
  MessageSquare,
  Share2,
  Smartphone,
  Sparkles,
} from "lucide-react";

const FEATURE_ROWS = [
  {
    icon: Sparkles,
    title: "Modern invite canvas",
    copy: "Upload a flyer or choose gradients—your details stay legible across desktop and mobile.",
  },
  {
    icon: CalendarPlus,
    title: "Add-to-calendar built in",
    copy: "Once you publish, guests instantly get Google, Outlook, and Apple calendar buttons.",
  },
  {
    icon: MapPinned,
    title: "Smart location blocks",
    copy: "Addresses, map links, parking notes, and real-time updates live in one shareable page.",
  },
  {
    icon: Share2,
    title: "One link, live forever",
    copy: "Text, DM, or email the same link; edits sync instantly so nobody misses a change.",
  },
  {
    icon: Smartphone,
    title: "Phone-first UX",
    copy: "Cards, typography, and CTAs are tuned for thumb zones and fast scanning on small screens.",
  },
  {
    icon: MessageSquare,
    title: "RSVP ready",
    copy: "Drop in a phone, email, or signup form—guests can respond without juggling apps.",
  },
];

const HOW_IT_WORKS = [
  {
    id: "01",
    title: "Pick a template or customize",
    copy: "Start from a category card or stay on this page to craft a bespoke invite.",
  },
  {
    id: "02",
    title: "Add details + optional flyer",
    copy: "Set the date, location, registries, and upload any hero art or PDF.",
  },
  {
    id: "03",
    title: "Share one smart link",
    copy: "Publish and send the link everywhere—guests add it to calendars instantly.",
  },
];

export default function NewEventPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F5FF] via-white to-white text-[#1F1833]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <section className="space-y-8">
          <div className="space-y-8">
            <EnvitefyBuilderHero />
            <div className="grid gap-4 md:grid-cols-2">
              {FEATURE_ROWS.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-3xl border border-[#EDE7FF] bg-white/95 p-5 shadow-sm shadow-[#E2DAFF]/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F2ECFF] text-[#7A5AF8]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-semibold text-[#201638]">
                        {feature.title}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#544A72]">
                      {feature.copy}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[36px] border border-[#EDE8FF] bg-white p-8 shadow-lg shadow-[#E7DEFF]/70">
          <div className="flex flex-col gap-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#8A6BFF]">
              How it works
            </p>
            <h2 className="text-3xl font-semibold text-[#140D26]">
              Launch in three focused steps
            </h2>
            <p className="text-sm text-[#5A4F78]">
              You’re never more than a few inputs away from a completely
              shareable event page.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.id}
                className="rounded-3xl border border-[#F1ECFF] bg-gradient-to-b from-white to-[#FAF8FF] p-6 text-center shadow-sm"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2ECFF] text-base font-semibold text-[#7A5AF8]">
                  {step.id}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#201638]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-[#5A4F78]">{step.copy}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarHeart,
  CalendarPlus,
  MapPinned,
  MessageSquare,
  Share2,
  Smartphone,
  Sparkles,
} from "lucide-react";

const CATEGORY_CARDS = [
  {
    label: "Birthday Party",
    icon: "🎂",
    copy: "Whimsical themes with kid-ready layouts.",
    href: "/event/birthdays",
    accent: "from-[#FF9A9E] to-[#FAD0C4]",
  },
  {
    label: "Baby Shower",
    icon: "🍼",
    copy: "Soft palettes, registry panels, RSVP cues.",
    href: "/event/baby-showers",
    accent: "from-[#F8C8DC] to-[#E0C3FC]",
  },
  {
    label: "Wedding / Special",
    icon: "💍",
    copy: "Gallery hero, luxe typography options.",
    href: "/event/weddings",
    accent: "from-[#B6FBFF] to-[#83A4D4]",
  },
  {
    label: "Gender Reveal",
    icon: "🎉",
    copy: "Confetti, balloons, and countdown moments.",
    href: "/event/gender-reveal",
    accent: "from-[#FBD3E9] to-[#BB377D]",
  },
  {
    label: "Sports & Practice",
    icon: "🏈",
    copy: "Schedules, repeats, team RSVP prompts.",
    href: "/event/sport-events",
    accent: "from-[#C9FFBF] to-[#FFAFBD]",
  },
  {
    label: "Appointments & General",
    icon: "📅",
    copy: "Doctor visits, meetups, anything flexible.",
    href: "/event/general",
    accent: "from-[#FDEB71] to-[#F8D800]",
  },
];

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
            <div className="rounded-[40px] bg-gradient-to-bl from-[#F4EEFF] via-white to-[#FEE8F0] p-6 shadow-xl shadow-[#E8DFFF] sm:p-8">
              <div className="space-y-6">
                <div className="space-y-5 lg:max-w-3xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#8A6BFF] shadow-sm shadow-[#D8CBFF]">
                    <CalendarHeart className="h-3.5 w-3.5" />
                    Envitefy Builder
                  </span>
                  <h1 className="text-4xl font-semibold leading-tight text-[#140D26] sm:text-5xl">
                    Create once, share everywhere.
                  </h1>
                  <p className="text-lg text-[#4A3E66]">
                    Tap a category to open its tailored builder. Every flow
                    keeps the same promise: polished invites, mobile-first
                    layouts, and instant add-to-calendar links.
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-[#524872]">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow">
                      <Sparkles className="h-4 w-4 text-[#F49AC1]" />
                      Live preview header
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow">
                      <Smartphone className="h-4 w-4 text-[#7F8CFF]" />
                      Phone-first layout
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow">
                      <Share2 className="h-4 w-4 text-[#5AC29A]" />
                      One smart link
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1 text-sm text-[#5A4F78] sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold uppercase tracking-[0.3em] text-[#9B7BFF]">
                      Quick start
                    </p>
                    <p className="text-xs sm:text-sm">
                      Pick a template to open its dedicated flow.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {CATEGORY_CARDS.map((card) => (
                      <Link
                        key={card.label}
                        href={card.href}
                        className="group flex flex-col gap-3 rounded-3xl border border-[#F1ECFF] bg-gradient-to-br from-white to-[#FCFAFF] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <span
                          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-xl`}
                          aria-hidden
                        >
                          {card.icon}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#1F1536] group-hover:text-[#7A5AF8]">
                            {card.label}
                          </p>
                          <p className="text-xs text-[#5A4F78]">{card.copy}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#A18BFF] opacity-0 transition group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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

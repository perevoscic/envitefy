"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarHeart,
  Share2,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { BabyCarriageIcon } from "./BabyCarriageIcon";

type BuilderCard = {
  label: string;
  icon: string;
  copy: string;
  href: string;
};

const QUICK_START_CARDS: BuilderCard[] = [
  {
    label: "Birthday Party",
    icon: "🎂",
    copy: "Whimsical themes with kid-ready layouts.",
    href: "/event/birthdays",
  },
  {
    label: "Baby Shower",
    icon: "baby-carriage",
    copy: "Soft palettes, registry panels, RSVP cues.",
    href: "/event/baby-showers",
  },
  {
    label: "Wedding ",
    icon: "💍",
    copy: "Gallery hero, luxe typography options.",
    href: "/event/weddings/customize",
  },
  {
    label: "Gender Reveal",
    icon: "🎈",
    copy: "Confetti, balloons, and countdown moments.",
    href: "/event/gender-reveal",
  },
];

type EnvitefyBuilderHeroProps = {
  className?: string;
};

export function EnvitefyBuilderHero({ className }: EnvitefyBuilderHeroProps) {
  const wrapperClassName = [
    "rounded-[40px] bg-gradient-to-bl from-[#F4EEFF] via-white to-[#FEE8F0] p-6 shadow-xl shadow-[#E8DFFF] sm:p-8",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={wrapperClassName} aria-labelledby="envitefy-builder">
      <div className="space-y-6">
        <div className="space-y-5 lg:max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#8A6BFF] shadow-sm shadow-[#D8CBFF]">
            <CalendarHeart className="h-3.5 w-3.5" />
            Life Milestones & Celebrations
          </span>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {QUICK_START_CARDS.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="group flex flex-col gap-3 rounded-3xl border border-[#F1ECFF] bg-gradient-to-br from-white to-[#FCFAFF] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span
                  className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-[#FCFAFF] text-5xl"
                  aria-hidden
                >
                  {card.icon === "baby-carriage" ? (
                    <BabyCarriageIcon className="w-full h-full" />
                  ) : (
                    card.icon
                  )}
                </span>
                <div>
                  <p className="text-lg md:text-xl font-semibold text-[#1F1536] group-hover:text-[#7A5AF8]">
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
    </section>
  );
}

export const builderQuickStartCards = QUICK_START_CARDS;

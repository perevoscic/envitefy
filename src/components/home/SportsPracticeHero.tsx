"use client";

import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";

type SportsCard = {
  label: string;
  icon: string;
  copy: string;
  href: string;
};

const SPORTS_CARDS: SportsCard[] = [
  {
    label: "Football Season '25-'26",
    icon: "🏈",
    copy: "Publish the full 2025-2026 season slate with home/away games, travel, and roster updates in one place.",
    href: "/event/football-season/customize",
  },
  {
    label: "Gymnastics Schedule",
    icon: "🤸",
    copy: "Detailed class times, location maps, and coach notes.",
    href: "/event/gymnastics/customize",
  },
  {
    label: "General Sports Event",
    icon: "🏆",
    copy: "Tournaments, playoffs, and team gatherings with detailed brackets.",
    href: "/event/sport-events/customize",
  },
  {
    label: "Cheerleading",
    icon: "📣",
    copy: "Warm-up order, stunt groups, music links, and uniform calls.",
    href: "/event/cheerleading/customize",
  },
  {
    label: "Dance / Ballet",
    icon: "🩰",
    copy: "Piece details, choreographer notes, costume/hair/makeup, and stage calls.",
    href: "/event/dance-ballet/customize",
  },
  {
    label: "Soccer Match",
    icon: "⚽",
    copy: "Opponents, pitch info, kit colors, lineup/formation, and warm-up windows.",
    href: "/event/soccer/customize",
  },
];

type SportsPracticeHeroProps = {
  className?: string;
  allowedHrefs?: string[];
};

export function SportsPracticeHero({
  className,
  allowedHrefs,
}: SportsPracticeHeroProps) {
  const allowed = allowedHrefs ? new Set(allowedHrefs) : null;
  const cards = allowed
    ? SPORTS_CARDS.filter((card) => allowed.has(card.href))
    : SPORTS_CARDS;
  if (cards.length === 0) return null;

  const wrapperClassName = [
    "rounded-[40px] bg-gradient-to-bl from-[#E0F2FE] via-white to-[#D1FAE5] p-6 shadow-xl shadow-[#BAE6FD] sm:p-8",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={wrapperClassName} aria-labelledby="sports-practice">
      <div className="space-y-6">
        <div className="space-y-5 lg:max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#0EA5E9] shadow-sm shadow-[#7DD3FC]">
            <Trophy className="h-3.5 w-3.5" />
            Sports Season '25-'26
          </span>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="group flex flex-col gap-3 rounded-3xl border border-[#BFDBFE] bg-gradient-to-br from-white to-[#F0F9FF] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span
                  className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-[#F0F9FF] text-5xl"
                  aria-hidden
                >
                  {card.icon}
                </span>
                <div>
                  <p className="text-lg md:text-xl font-semibold text-[#1F1536] group-hover:text-[#0284C7]">
                    {card.label}
                  </p>
                  <p className="text-xs text-[#475569]">{card.copy}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#38BDF8] opacity-0 transition group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const sportsPracticeCards = SPORTS_CARDS;

"use client";

import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

type AppointmentCard = {
  label: string;
  icon: string;
  copy: string;
  href: string;
};

const APPOINTMENT_CARDS: AppointmentCard[] = [
  {
    label: "Doctor Appointment",
    icon: "🩺",
    copy: "Quick booking links, reminder scheduling, and secure intake forms.",
    href: "/event/appointments",
  },
  {
    label: "General Event / Meetup",
    icon: "🗓️",
    copy: "Flexible calendar sync and simple RSVP for business or personal use.",
    href: "/event/general",
  },
  {
    label: "Workshop / Class",
    icon: "🧠",
    copy: "Multi-session events with payment options and detailed syllabus outlines.",
    href: "/event/general",
  },
];

type AppointmentsGeneralHeroProps = {
  className?: string;
};

export function AppointmentsGeneralHero({
  className,
}: AppointmentsGeneralHeroProps) {
  const wrapperClassName = [
    "rounded-[40px] bg-gradient-to-bl from-[#DBEAFE] via-white to-[#BFDBFE] p-6 shadow-xl shadow-[#93C5FD] sm:p-8",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={wrapperClassName}
      aria-labelledby="appointments-general"
    >
      <div className="space-y-6">
        <div className="space-y-5 lg:max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#2563EB] shadow-sm shadow-[#60A5FA]">
            <Calendar className="h-3.5 w-3.5" />
            Appointments & General Events
          </span>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {APPOINTMENT_CARDS.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="group flex flex-col gap-3 rounded-3xl border border-[#BFDBFE] bg-gradient-to-br from-white to-[#EFF6FF] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span
                  className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-[#EFF6FF] text-5xl"
                  aria-hidden
                >
                  {card.icon}
                </span>
                <div>
                  <p className="text-lg md:text-xl font-semibold text-[#1F1536] group-hover:text-[#1D4ED8]">
                    {card.label}
                  </p>
                  <p className="text-xs text-[#475569]">{card.copy}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#3B82F6] opacity-0 transition group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const appointmentsGeneralCards = APPOINTMENT_CARDS;


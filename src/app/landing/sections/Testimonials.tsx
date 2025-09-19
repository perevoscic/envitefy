"use client";

import { useEffect, useMemo, useState } from "react";

export default function Testimonials() {
  const items = useMemo(
    () => [
      {
        quote:
          "Finally, no re‑typing school flyers. It’s become our go‑to for family events.",
        by: "Emily, mom of two",
      },
      {
        quote:
          "I snapped the soccer schedule and it added every date perfectly.",
        by: "Marcus, dad & coach",
      },
      {
        quote: "So simple my teens use it to save their activities. Love it!",
        by: "Priya, parent of teens",
      },
      {
        quote:
          "Wedding invites were parsed flawlessly—ceremony and reception saved in seconds.",
        by: "Ava & Noah",
      },
      {
        quote:
          "Birthday party details captured from the invite—address, time, and reminders set.",
        by: "Jen, party planner",
      },
      {
        quote:
          "Doctor appointment cards go straight to my calendar with alerts. No more missed visits.",
        by: "Anthony",
      },
      {
        quote:
          "Playdate invites are one snap and done—parents’ group loves it.",
        by: "Sara",
      },
      {
        quote:
          "Gymnastics meet schedule imported perfectly. Saved hours of manual entry.",
        by: "Coach Riley",
      },
      {
        quote:
          "School concerts, field trips, and forms—everything lands on our calendar automatically.",
        by: "Daniel & Mia",
      },
      {
        quote:
          "Our basketball season imported in one tap—home and away labeled.",
        by: "Coach Maya",
      },
      {
        quote:
          "Class birthday invites go straight to my calendar—no copy/paste.",
        by: "Lila, parent",
      },
      {
        quote: "Dentist and pediatrician cards never get lost now.",
        by: "Omar",
      },
      {
        quote: "Team carpool times are finally in one place with reminders.",
        by: "Jen, soccer mom",
      },
      {
        quote:
          "Rehearsal dinner and ceremony synced perfectly—zero manual typing.",
        by: "Liam & Harper",
      },
      {
        quote:
          "School newsletters → calendar events in seconds. Huge time saver.",
        by: "Mr. Chen, teacher",
      },
    ],
    []
  );

  const [page, setPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setVisibleCount(mq.matches ? 3 : 1);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const originalPages = Math.ceil(items.length / visibleCount);
  const loopItems = useMemo(() => [...items, ...items], [items]);

  useEffect(() => {
    if (originalPages <= 1) return;
    const id = setInterval(() => {
      setTransitionEnabled(true);
      setPage((p) => p + 1);
    }, 7000);
    return () => clearInterval(id);
  }, [originalPages]);

  useEffect(() => {
    if (page === originalPages && originalPages > 1) {
      const timeout = setTimeout(() => {
        setTransitionEnabled(false);
        setPage(0);
        setTimeout(() => setTransitionEnabled(true), 20);
      }, 720);
      return () => clearTimeout(timeout);
    }
  }, [page, originalPages]);

  return (
    <section aria-labelledby="testimonials" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2
          id="testimonials"
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          What people say
        </h2>
        <div className="mt-8 overflow-hidden">
          <div
            className={`flex ${
              transitionEnabled
                ? "transition-transform duration-700 ease-out"
                : ""
            }`}
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {loopItems.map((i, idx) => (
              <div
                key={idx}
                className="basis-full md:basis-1/3 shrink-0 px-0 md:px-2"
              >
                <figure className="h-full rounded-2xl bg-surface/70 border border-border p-6 mx-0 shadow">
                  <blockquote className="text-foreground/80">
                    “{i.quote}”
                  </blockquote>
                  <figcaption className="mt-3 text-sm text-foreground/60">
                    — {i.by}
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

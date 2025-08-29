"use client";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground landing-dark-gradient flex items-center justify-center p-6">
      <section className="w-full max-w-5xl grid grid-cols-1 items-center">
        <div className="text-center">
          <div className="bg-gradient-to-tr from-fuchsia-500/15 via-sky-400/15 to-violet-500/15 rounded-3xl p-1">
            <div className="rounded-3xl bg-surface/80 backdrop-blur-sm p-10 pb-16 border border-border">
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.18] tracking-tight pb-1 overflow-visible">
                <span className="bg-clip-text pb-10 text-transparent bg-gradient-to-r from-cyan-600 via-sky-500 to-fuchsia-600 dark:from-cyan-300 dark:via-sky-200 dark:to-fuchsia-300">
                  About
                  <span> </span>
                  <span className="font-pacifico inline-block pb-1"> Snap</span>
                  <span> </span>
                  <span className="font-montserrat">My Date</span>
                </span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-3xl mx-auto">
                Snap My Date is a simple helper for busy families. Take a quick
                photo of a school flyer, team schedule, birthday invite, or
                appointment card and we’ll turn it into a ready‑to‑save calendar
                event—no typing, no stress.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-3 text-left">
                <div className="rounded-2xl bg-surface/60 border border-border p-5">
                  <h3 className="text-xl font-semibold text-center">
                    Made for busy families
                  </h3>
                  <p className="mt-2 text-foreground/70">
                    Works with school flyers, practice schedules, church
                    bulletins, appointment cards, and more.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface/60 border border-border p-5">
                  <h3 className="text-xl font-semibold text-center">
                    Just snap a photo
                  </h3>
                  <p className="mt-2 text-foreground/70">
                    We pull the date, time, place, and details for you—no typing
                    needed. Snap, and done.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface/60 border border-border p-5">
                  <h3 className="text-xl font-semibold text-center">
                    On your calendar instantly
                  </h3>
                  <p className="mt-2 text-foreground/70">
                    Add to Google, Apple, or Outlook in a tap with helpful
                    reminders from any device.
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-neutral-900 shadow-lg shadow-teal-500/25"
                >
                  Try it now
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-border text-foreground/80 hover:text-foreground hover:border-foreground/60"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

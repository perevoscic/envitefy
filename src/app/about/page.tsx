"use client";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center p-6">
      <section className="w-full max-w-5xl grid grid-cols-1 items-center">
        <div className="text-center">
          <div className="bg-gradient-to-tr from-fuchsia-500/20 via-sky-400/20 to-violet-500/20 rounded-3xl p-1">
            <div className="rounded-3xl bg-neutral-900/70 backdrop-blur-sm p-10">
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300">
                  About
                  <span className="font-pacifico">Snap</span>
                  <span> </span>
                  <span className="font-montserrat">My Date</span>
                </span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-white/80 max-w-3xl mx-auto">
                We built Snap My Date to turn the chaos of flyers, appointment
                cards, and invites into clean, trustworthy calendar events in
                seconds. Point, snap, and your plans are ready for Google,
                Apple, or Outlook.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-3 text-left">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <h3 className="text-xl font-semibold">Fast OCR</h3>
                  <p className="mt-2 text-white/70">
                    Powered by robust text recognition to capture dates, times,
                    and places.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <h3 className="text-xl font-semibold">Smart Parsing</h3>
                  <p className="mt-2 text-white/70">
                    Understands natural language like “next Friday at 7pm.”
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <h3 className="text-xl font-semibold">One-tap Add</h3>
                  <p className="mt-2 text-white/70">
                    Send events straight to your favorite calendar in a click.
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
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-violet-400/70 text-violet-200 hover:text-white hover:border-white/80"
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

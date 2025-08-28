import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean(session);
  const primaryHref = "/subscription";
  const secondaryHref = isAuthed ? "/about" : "/login?callbackUrl=%2F";

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      {/* Hero */}
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.08] tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300 drop-shadow-fore-subtle">
                Save family dates in seconds.
              </span>
              <br />
              <span className="text-foreground">
                Just snap, we’ll fill it in.
              </span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto lg:mx-0">
              School flyers, team schedules, birthday invites, appointment
              cards— simply take a photo and we’ll turn it into a ready‑to‑save
              calendar event. No typing, no stress.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold bg-primary hover:opacity-95 active:opacity-90 text-on-primary shadow-lg shadow-teal-500/25"
              >
                {isAuthed ? "Manage plan" : "Get started free"}
              </Link>
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-border text-foreground/80 hover:text-foreground hover:bg-surface/70"
              >
                {isAuthed ? "Learn more" : "Sign in"}
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-foreground/70">
              <span className="text-sm">Works with</span>
              {/* Google */}
              <span
                className="inline-flex items-center justify-center rounded-full border border-border p-1.5 bg-surface/60"
                aria-label="Google"
              >
                <Image
                  src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                  alt="Google logo"
                  width={20}
                  height={20}
                />
              </span>
              {/* Apple (auto color via currentColor) */}
              <span
                className="inline-flex items-center justify-center rounded-full border border-border p-1.5 bg-surface/60"
                aria-label="Apple"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-foreground"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M11.6 0c-.8.1-1.87.6-2.52 1.33-.55.6-1.02 1.45-.84 2.3.88.05 1.9-.5 2.5-1.2.6-.7 1.08-1.68.86-2.43zM15.49 12.57c-.01-2.49 2.05-3.74 2.16-3.81-1.2-1.76-3.09-2.01-3.76-2.05-1.59-.17-3.11.96-3.91.96-.8 0-2.05-.94-3.36-.92-1.72.02-3.31 1-4.19 2.54-1.79 3.12-.46 7.75 1.28 10.28.86 1.24 1.88 2.63 3.22 2.58 1.29-.05 1.78-.84 3.33-.84 1.55 0 2.01.84 3.38.82 1.41-.03 2.32-1.25 3.19-2.5 1.02-1.43 1.44-2.82 1.46-2.89-.03-.02-2.8-1.06-2.82-4.17z"
                  />
                </svg>
              </span>
              {/* Microsoft */}
              <span
                className="inline-flex items-center justify-center rounded-full border border-border p-1.5 bg-surface/60"
                aria-label="Microsoft"
              >
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                  alt="Microsoft logo"
                  width={20}
                  height={20}
                />
              </span>
            </div>
          </div>

          <div className="relative mx-auto lg:mx-0 w-[320px] sm:w-[380px] aspect-[9/19.5] rounded-[38px] bg-neutral-800 shadow-2xl ring-1 ring-white/10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 h-6 w-40 rounded-full bg-black/70" />
            <div className="absolute inset-[14px] rounded-[28px] overflow-hidden">
              <Image
                src="/invite.jpg"
                alt="Invitation being scanned"
                fill
                sizes="(max-width: 1024px) 380px, 420px"
                className="object-cover"
                priority
              />
              <div className="scanwrap absolute inset-0" aria-hidden="true">
                <div className="scanline"></div>
                <div className="scanglow"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-it-works" className="w-full">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2
            id="how-it-works"
            className="text-2xl sm:text-3xl font-bold text-center"
          >
            How it works
          </h2>
          <p className="mt-2 text-center text-foreground/70 max-w-2xl mx-auto">
            A simple flow designed for busy parents.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-surface/70 border border-border p-6 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="14" rx="2" />
                  <circle cx="9" cy="10" r="2" />
                  <path d="M21 15l-5-5-4 4-2-2-5 5" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-semibold">Snap or upload</h3>
              <p className="mt-1 text-foreground/70">
                Take a quick photo of a flyer, invite, or appointment card.
              </p>
            </div>
            <div className="rounded-2xl bg-surface/70 border border-border p-6 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-semibold">
                We fill in the details
              </h3>
              <p className="mt-1 text-foreground/70">
                We extract the date, time, location, and description for you.
              </p>
            </div>
            <div className="rounded-2xl bg-surface/70 border border-border p-6 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-semibold">
                Add to your calendar
              </h3>
              <p className="mt-1 text-foreground/70">
                Save to Google, Apple, or Outlook—complete with reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section aria-labelledby="parents-love" className="w-full">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h2
            id="parents-love"
            className="text-2xl sm:text-3xl font-bold text-center"
          >
            What parents say
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            <figure className="rounded-2xl bg-surface/70 border border-border p-6">
              <blockquote className="text-foreground/80">
                “Finally, no re‑typing school flyers. It’s become our go‑to for
                family events.”
              </blockquote>
              <figcaption className="mt-3 text-sm text-foreground/60">
                — Emily, mom of two
              </figcaption>
            </figure>
            <figure className="rounded-2xl bg-surface/70 border border-border p-6">
              <blockquote className="text-foreground/80">
                “I snapped the soccer schedule and it added every date
                perfectly.”
              </blockquote>
              <figcaption className="mt-3 text-sm text-foreground/60">
                — Marcus, dad & coach
              </figcaption>
            </figure>
            <figure className="rounded-2xl bg-surface/70 border border-border p-6">
              <blockquote className="text-foreground/80">
                “So simple my teens use it to save their activities. Love it!”
              </blockquote>
              <figcaption className="mt-3 text-sm text-foreground/60">
                — Priya, parent of teens
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="rounded-3xl bg-gradient-to-tr from-fuchsia-500/20 via-sky-400/20 to-violet-500/20 p-1">
            <div className="rounded-3xl bg-surface/70 backdrop-blur-sm p-8 ring-1 ring-border text-center">
              <h3 className="text-2xl sm:text-3xl font-bold">
                Ready to save your next date?
              </h3>
              <p className="mt-2 text-foreground/70 max-w-2xl mx-auto">
                Try it now—no credit card required.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold bg-primary text-on-primary hover:opacity-95"
                >
                  {isAuthed ? "Manage plan" : "Get started free"}
                </Link>
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold border border-border text-foreground/80 hover:text-foreground hover:bg-surface/70"
                >
                  {isAuthed ? "Learn more" : "Sign in"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

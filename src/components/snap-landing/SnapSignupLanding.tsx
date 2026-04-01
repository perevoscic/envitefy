"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AuthModal from "@/components/auth/AuthModal";

const steps = [
  {
    title: "Snap or upload",
    body: "Start with an invite, flyer, schedule, or event image. Use what you already have.",
    icon: "01",
  },
  {
    title: "Review and refine",
    body: "Envitefy extracts the important details, then lets you edit and polish everything fast.",
    icon: "02",
  },
  {
    title: "Publish and share",
    body: "Launch a clean event page, collect RSVPs or sign-ups, and manage updates in one place.",
    icon: "03",
  },
];

const features = [
  "Shareable event pages",
  "RSVPs and sign-ups",
  "Schedules and extra details",
  "Registry and helpful links",
  "Simple editing tools",
  "Guest response management",
];

const useCases = [
  "Birthdays",
  "Weddings",
  "Sports events",
  "School events",
  "Community events",
  "Workshops & clubs",
];

const benefits = [
  {
    title: "Faster from the start",
    body: "Skip manual data entry and begin with the image you already have.",
  },
  {
    title: "Cleaner guest experience",
    body: "One polished page instead of scattered screenshots, texts, and links.",
  },
  {
    title: "Flexible for real events",
    body: "Works across personal, school, sports, and community event types.",
  },
  {
    title: "Easy to update",
    body: "Refine details, add schedules, links, and updates anytime.",
  },
];

export default function SnapSignupLanding() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  useEffect(() => {
    const auth = searchParams?.get("auth");
    if (auth === "signup" || auth === "login") {
      setAuthMode(auth);
      setAuthModalOpen(true);
    }
  }, [searchParams]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-violet-100 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_28%),radial-gradient(circle_at_top_left,rgba(196,181,253,0.24),transparent_32%),linear-gradient(to_bottom,rgba(255,255,255,1),rgba(250,245,255,0.85),rgba(255,255,255,1))]" />
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute left-0 top-40 h-64 w-64 rounded-full bg-fuchsia-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-12 lg:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-violet-700"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back to home
            </Link>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="inline-flex w-fit items-center justify-center rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm backdrop-blur transition hover:bg-violet-50"
              >
                Log in
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-8 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              Envitefy Snap
            </div>

            <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Turn any event photo into a{" "}
              <span className="bg-gradient-to-r from-violet-700 to-fuchsia-500 bg-clip-text text-transparent">
                real event page
              </span>
              .
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Snap a photo or upload an invite, flyer, schedule, or poster, and
              Envitefy transforms it into a polished, shareable event page with
              event details, RSVP tools, sign-ups, schedules, registry links,
              and more.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {isAuthenticated ? (
                <Link
                  href="/event"
                  className="rounded-2xl bg-violet-600 px-6 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5"
                >
                  Try Snap
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="rounded-2xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5"
                >
                  Try Snap
                </button>
              )}

              <a
                href="#how-it-works"
                className="rounded-2xl border border-violet-200 bg-white px-6 py-3.5 text-center text-base font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-3">
              {[
                "No complicated setup",
                "Works with invites, flyers, and schedules",
                "Built for all kinds of events",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-violet-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-x-10 top-8 h-72 rounded-full bg-violet-200/40 blur-3xl" />
            <div className="relative w-full max-w-xl">
              <div className="rounded-[2rem] border border-violet-100 bg-white p-4 shadow-2xl shadow-violet-100">
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[1.5rem] border border-violet-100 bg-gradient-to-b from-violet-50 to-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">
                        Uploaded image
                      </span>
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                        Snap
                      </span>
                    </div>
                    <div className="rounded-[1.25rem] border border-dashed border-violet-200 bg-white p-4 shadow-inner">
                      <div className="aspect-[4/5] rounded-[1rem] bg-gradient-to-br from-fuchsia-100 via-violet-50 to-white p-4">
                        <div className="rounded-2xl bg-white/90 p-3 shadow-sm">
                          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
                            Birthday Bash
                          </div>
                          <div className="mt-2 h-3 w-3/4 rounded-full bg-violet-200" />
                          <div className="mt-2 h-3 w-1/2 rounded-full bg-violet-100" />
                          <div className="mt-5 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-400 px-4 py-6 text-center text-white shadow-md">
                            <div className="text-lg font-semibold">You&apos;re Invited</div>
                            <div className="mt-1 text-xs text-white/85">
                              Saturday - 3 PM - Beach Club
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="h-10 rounded-xl bg-violet-50" />
                            <div className="h-10 rounded-xl bg-fuchsia-50" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-violet-100 bg-slate-950 p-4 text-white shadow-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                        Live event page
                      </span>
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
                        Published
                      </span>
                    </div>

                    <div className="rounded-[1.25rem] bg-white p-4 text-slate-900">
                      <div className="rounded-[1rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-400 p-5 text-white shadow-lg">
                        <div className="text-sm font-medium text-white/80">
                          Envitefy Event Page
                        </div>
                        <h3 className="mt-2 text-2xl font-semibold">
                          Sophia&apos;s Birthday Bash
                        </h3>
                        <p className="mt-2 text-sm text-white/85">
                          Saturday, June 14 - 3:00 PM - The Beach Club
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                          <div className="text-sm font-semibold text-slate-900">RSVPs</div>
                          <div className="mt-1 text-3xl font-semibold text-violet-700">42</div>
                          <div className="text-sm text-slate-500">Responses collected</div>
                        </div>
                        <div className="rounded-2xl border border-violet-100 bg-fuchsia-50 p-4">
                          <div className="text-sm font-semibold text-slate-900">Extras</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {["Registry", "Schedule", "Map"].map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              Guest list
                            </div>
                            <div className="text-sm text-slate-500">
                              Managed in one place
                            </div>
                          </div>
                          <div className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
                            View
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          {["Ashley M.", "Noah T.", "Mia R.", "Liam S."].map((name) => (
                            <div
                              key={name}
                              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                            >
                              <span>{name}</span>
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                Going
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-5 rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-lg shadow-violet-100">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">
                  From invite to page
                </div>
                <div className="mt-1 text-sm font-medium text-slate-700">
                  In just a few minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12"
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700">
            How it works
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Snap it. Clean it up. Publish it.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Go from event image to polished event page in three simple steps.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="group rounded-[2rem] border border-violet-100 bg-gradient-to-b from-white to-violet-50/60 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-lg font-semibold text-white shadow-lg shadow-violet-200">
                {step.icon}
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-violet-100 bg-gradient-to-b from-violet-50/70 via-white to-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 shadow-sm">
                What you can create
              </div>
              <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                More than a digital flyer.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Snap helps turn raw event materials into a complete event
                experience your guests can actually use.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl border border-violet-100 bg-white px-4 py-4 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-violet-100 bg-white p-5 shadow-2xl shadow-violet-100">
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                      Sample event experience
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      Summer Family Picnic
                    </div>
                  </div>
                  <div className="rounded-full bg-violet-500/15 px-3 py-1 text-sm text-violet-200">
                    Public page
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="text-sm text-violet-200">Included</div>
                    <div className="mt-3 space-y-2 text-sm text-white/90">
                      <div>Event details</div>
                      <div>RSVP flow</div>
                      <div>Schedule</div>
                      <div>Venue notes</div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-slate-900">
                    <div className="text-sm font-medium text-slate-500">
                      Quick actions
                    </div>
                    <div className="mt-4 grid gap-2">
                      {["Edit page", "Add links", "Manage guests", "Share"].map((action) => (
                        <div
                          key={action}
                          className="rounded-xl border border-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                        >
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-4 text-white">
                  One polished place for your event instead of scattered
                  screenshots, texts, and posts.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700">
            Why people use Envitefy
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Built for faster, cleaner event sharing.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Because creating a great event experience should not start with
            manual data entry and messy communication.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-[2rem] border border-violet-100 bg-white p-7 shadow-sm shadow-violet-50"
            >
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100" />
              <h3 className="mt-5 text-xl font-semibold text-slate-950">
                {benefit.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {benefit.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-500">
              Social proof
            </div>
            <h3 className="mt-4 text-3xl font-semibold text-slate-950">
              Built for modern event sharing
            </h3>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                '"We went from a photo of our event flyer to a page we could actually share with everyone."',
                '"It made our event look far more organized without adding more work."',
                '"So much easier than retyping everything and answering the same questions over and over."',
              ].map((quote) => (
                <div
                  key={quote}
                  className="rounded-2xl border border-violet-100 bg-white p-5 text-sm leading-7 text-slate-600 shadow-sm"
                >
                  {quote}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-violet-100 bg-slate-950 p-8 text-white shadow-xl">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
              Fast facts
            </div>
            <div className="mt-6 space-y-6">
              {[
                ["Minutes", "to publish your first page"],
                ["Less manual work", "than starting from scratch"],
                ["Multiple event types", "supported from one workflow"],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl bg-white/5 p-4">
                  <div className="text-xl font-semibold text-white">{title}</div>
                  <div className="mt-1 text-sm text-white/70">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-violet-100 bg-violet-50/50">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 shadow-sm">
                Use cases
              </div>
              <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Made for all kinds of events.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                If it starts as an image, flyer, handout, schedule, or invite,
                Snap helps turn it into something more useful.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.75rem] border border-violet-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-100"
                >
                  <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100" />
                  <div className="text-lg font-semibold text-slate-900">{item}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    Turn existing event materials into a polished page guests can
                    easily use and share.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,1),rgba(250,245,255,0.95),rgba(255,255,255,1))]" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:px-8 lg:px-12">
          <div className="rounded-[2.25rem] border border-violet-100 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500 p-10 text-center text-white shadow-2xl shadow-violet-200 sm:p-14">
            <div className="mx-auto max-w-3xl">
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/75">
                Final CTA
              </div>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                Take the photo you already have and turn it into an event page
                in minutes.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/85">
                Envitefy Snap makes it easy to go from flyer, invite, or
                schedule to a polished, shareable event page without the usual
                manual work.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                {isAuthenticated ? (
                  <Link
                    href="/event"
                    className="rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-violet-700 shadow-lg transition hover:-translate-y-0.5"
                  >
                    Try Snap Now
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuth("signup")}
                    className="rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-violet-700 shadow-lg transition hover:-translate-y-0.5"
                  >
                    Try Snap Now
                  </button>
                )}

                {isAuthenticated ? (
                  <Link
                    href="/event"
                    className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15"
                  >
                    Upload an Invite
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuth("signup")}
                    className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15"
                  >
                    Upload an Invite
                  </button>
                )}
              </div>
              <div className="mt-6 text-sm font-medium text-white/80">
                Snap it. Edit it. Share it.
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        signupSource="snap"
        allowSignupSwitch={false}
        successRedirectUrl="/event"
      />
    </main>
  );
}

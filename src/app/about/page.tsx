import type { Metadata } from "next";
import Link from "next/link";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";

export const metadata: Metadata = {
  title: "About — Envitefy",
  description:
    "Envitefy is a professional event platform for event creation, public event pages, RSVP and sign-up flows, and calendar-ready coordination.",
  openGraph: {
    title: "About — Envitefy",
    description:
      "Envitefy is a professional event platform for event creation, public event pages, RSVP and sign-up flows, and calendar-ready coordination.",
    url: "https://envitefy.com/about",
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Envitefy preview",
      },
    ],
    type: "website",
  },
  alternates: { canonical: "/about" },
};

const productPillars = [
  {
    title: "Event creation and publishing",
    description:
      "Build and manage events with structured details that are clear for hosts, guests, and organizers.",
  },
  {
    title: "Public event experiences",
    description:
      "Deliver polished event pages with shareable links designed for modern communication and reliable updates.",
  },
  {
    title: "RSVP and sign-up flows",
    description:
      "Coordinate attendance and participant responses with streamlined workflows for social and program-based events.",
  },
  {
    title: "Calendar and operational continuity",
    description:
      "Keep critical event details synchronized across planning, sharing, and follow-through.",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#f6f2ff] via-white to-[#f7f3ff] px-4 py-12 text-foreground sm:px-6">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-16 text-center">
          <div className="mb-8 rounded-3xl bg-gradient-to-tr from-[#efe8ff] via-white to-[#f4edff] p-1">
            <div className="rounded-3xl border border-[#e5dcff] bg-white/95 p-10 backdrop-blur-sm sm:p-12">
              <h1 className="overflow-visible pb-10 pt-3 text-[clamp(2.9rem,7vw,5.25rem)] font-extrabold leading-[1.24] tracking-tight">
                <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:gap-x-3">
                  <span
                    className="text-[#6c5fd6]"
                    style={{
                      fontFamily: 'var(--font-poppins), "Poppins", sans-serif',
                      fontWeight: 700,
                      letterSpacing: "-0.085em",
                    }}
                  >
                    About
                  </span>
                  <EnvitefyWordmark className="text-[1.50em]" scaled={false} />
                </span>
              </h1>
              <p className="mt-4 text-base font-medium uppercase tracking-[0.2em] text-foreground/60 sm:text-lg">
                Professional Event Infrastructure
              </p>
              <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-foreground/80 sm:text-xl">
                Envitefy is built for teams and hosts who expect a premium standard for event
                communication, coordination, and execution.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {productPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-[#e5dcff] bg-gradient-to-br from-white to-[#f8f4ff] p-6 transition-all duration-300 hover:border-[#cfc2ff] hover:shadow-lg"
            >
              <h2 className="mb-2 text-xl font-semibold text-foreground">{pillar.title}</h2>
              <p className="leading-relaxed text-foreground/70">{pillar.description}</p>
            </div>
          ))}
        </div>

        <div className="mb-16 rounded-3xl border border-[#e5dcff] bg-gradient-to-br from-white to-[#f8f4ff] p-8 sm:p-10">
          <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl">
            Introducing our new capability
          </h2>
          <div className="mx-auto max-w-4xl space-y-6 text-lg leading-relaxed text-foreground/80">
            <p>
              Envitefy now includes advanced RSVP and sign-up workflows that complement event
              publishing and public sharing.
            </p>
            <p>
              This feature expands planning visibility for organizers while providing a simple and
              dependable response experience for guests and participants.
            </p>
            <p>
              Our product direction remains focused on quality, reliability, and elegant execution
              across every stage of the event lifecycle.
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="rounded-3xl border border-[#d9ceff] bg-gradient-to-tr from-[#efe8ff] via-white to-[#f4edff] p-8 sm:p-10">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Start with Envitefy</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-foreground/80">
              Choose the product surface that fits your workflow, and scale your event experience
              with confidence.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/snap"
                className="inline-flex items-center justify-center rounded-2xl bg-[#7F8CFF] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-[#7F8CFF]/25 transition-all duration-200 hover:bg-[#6d7af5] active:bg-[#5e69d9]"
              >
                Snap account
              </Link>
              <Link
                href="/gymnastics"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-[#d9ceff] bg-white px-8 py-4 text-lg font-semibold text-[#433b66] transition-all duration-200 hover:border-[#c6b8ff] hover:text-[#2f2850]"
              >
                Gymnastics account
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-transparent px-8 py-4 text-lg font-semibold text-[#433b66] transition-all duration-200 hover:text-[#2f2850]"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";

export const metadata: Metadata = {
  title: "About — Envitefy",
  description:
    "Envitefy focuses on Snap for flyer capture and Gymnastics for meet pages and logistics.",
  openGraph: {
    title: "About — Envitefy",
    description:
      "Envitefy focuses on Snap for flyer capture and Gymnastics for meet pages and logistics.",
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

const featureCards = [
  {
    icon: "📸",
    title: "Snap capture",
    description:
      "Snap turns flyers, screenshots, and invites into clean event details that are ready to review and save.",
  },
  {
    icon: "🤸",
    title: "Gymnastics pages",
    description:
      "Gymnastics accounts unlock polished meet pages with session details, venue information, and parent-friendly sharing.",
  },
  {
    icon: "📅",
    title: "Calendar ready",
    description:
      "Dates, times, and locations stay structured so events are easy to save to Google, Apple, and Outlook.",
  },
  {
    icon: "🔗",
    title: "One clean link",
    description:
      "Share a page that stays current instead of passing around another screenshot, PDF, or text thread.",
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
                Snap it. Save it. Share it.
              </p>
              <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-foreground/80 sm:text-xl">
                Envitefy now focuses on two product surfaces: Snap for quick
                flyer capture, and Gymnastics for meet pages and logistics.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#e5dcff] bg-gradient-to-br from-white to-[#f8f4ff] p-6 transition-all duration-300 hover:border-[#cfc2ff] hover:shadow-lg"
            >
              <div className="mb-3 text-4xl">{card.icon}</div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                {card.title}
              </h2>
              <p className="leading-relaxed text-foreground/70">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-16 rounded-3xl border border-[#e5dcff] bg-gradient-to-br from-white to-[#f8f4ff] p-8 sm:p-10">
          <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl">
            Why the narrower focus
          </h2>
          <div className="mx-auto max-w-4xl space-y-6 text-lg leading-relaxed text-foreground/80">
            <p>
              We built Envitefy to reduce event-entry friction for busy
              families. The fastest path to that goal is keeping the product
              surface smaller and clearer.
            </p>
            <p>
              Snap stays available to every profile because quick capture is the
              foundation. Gymnastics is the second live surface because meet
              workflows need their own dedicated structure, not a generic event
              builder.
            </p>
            <p>
              Existing users can keep signing in. New account creation starts
              only from the Snap or Gymnastics entry points so the right product
              access is assigned from day one.
            </p>
          </div>
        </div>

        <div className="mb-16 rounded-3xl border border-[#e5dcff] bg-gradient-to-br from-white to-[#f8f4ff] p-8 sm:p-10">
          <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl">
            Our story
          </h2>
          <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-foreground/80">
            <p>
              We started Envitefy as parents trying to make sense of event
              details scattered across flyers, screenshots, and chat threads.
            </p>
            <p>
              The product keeps evolving, but the core standard stays the same:
              event details should be accurate, fast to save, and easy to share.
            </p>
            <p>
              That is why the product now centers on Snap and Gymnastics instead
              of trying to market every possible event vertical at once.
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="rounded-3xl border border-[#d9ceff] bg-gradient-to-tr from-[#efe8ff] via-white to-[#f4edff] p-8 sm:p-10">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Pick the right starting point
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-foreground/80">
              New users can create an account from Snap or Gymnastics. Existing
              users can continue logging in.
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

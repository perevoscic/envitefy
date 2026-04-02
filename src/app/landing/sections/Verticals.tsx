import { ArrowRight, Camera, CheckCircle2, Quote, Trophy } from "lucide-react";
import Link from "next/link";
import GymnasticsMeetPreview from "@/components/landing/GymnasticsMeetPreview";
import SnapEventPreview from "@/components/landing/SnapEventPreview";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

const gymnasticsBullets = [
  "Meet schedules, session timing, and venue details stay on one page.",
  "Parking, maps, documents, updates, announcements, and results links stay easy to find.",
  "Families and coaches get one mobile link instead of a chain of PDFs, screenshots, and texts.",
] as const;

const snapBullets = [
  "Snap or upload an invite, flyer, schedule, or event image.",
  "Envitefy extracts the essentials and organizes them into a cleaner draft.",
  "Review the details and share one polished output instead of loose files.",
] as const;

export default function Verticals() {
  return (
    <section className="py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#866fd1]">
            Product pillars
          </p>
          <h2
            className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.05em] text-[#17132b] sm:text-5xl"
            style={{
              fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
            }}
          >
            Gymnastics leads. Snap expands what you can turn into a live page.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#58536e]">
            The homepage now centers the two strongest use cases: meet-weekend coordination for
            gymnastics and fast event-page creation from images or PDFs.
          </p>
        </div>

        <article
          id="gymnastics"
          className="scroll-mt-28 relative overflow-hidden rounded-[2.5rem] border border-[#e8ddff] bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-6 shadow-[0_30px_80px_rgba(102,75,191,0.1)] sm:p-8 lg:scroll-mt-32 lg:p-10"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[-8%] top-[-12%] h-[24rem] w-[24rem] rounded-full bg-[#ede4ff] blur-3xl" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e3d5ff] bg-[#f7f2ff] px-4 py-2 text-sm font-semibold text-[#5e46c1]">
                <Trophy className="h-4 w-4" />
                Flagship pillar
              </div>
              <h3
                className="mt-5 text-[2.2rem] font-semibold leading-tight tracking-[-0.05em] text-[#17132b] sm:text-[2.9rem]"
                style={{
                  fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
                }}
              >
                Turn gymnastics meet documents into one live page families can actually use.
              </h3>
              <p className="mt-5 text-lg leading-8 text-[#56516c]">
                Envitefy takes the strongest use case in the product today and makes it obvious:
                meet packets become mobile-ready event pages with logistics, updates, and sharing
                built in.
              </p>

              <div className="mt-6 space-y-3">
                {gymnasticsBullets.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#6d54ca]" />
                    <p className="text-base leading-7 text-[#38334b]">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.7rem] border border-[#ece3ff] bg-white/88 p-5 shadow-[0_16px_34px_rgba(102,75,191,0.06)]">
                <div className="flex items-start gap-3">
                  <Quote className="mt-0.5 h-5 w-5 shrink-0 text-[#7b63cf]" />
                  <div>
                    <p className="text-sm font-semibold text-[#241c44]">
                      &quot;It gave families one current link instead of four different PDFs.&quot;
                    </p>
                    <p className="mt-2 text-sm text-[#655f7c]">
                      Typical gymnastics use case: schedule, venue, parking, documents, and updates
                      in one place.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/gymnastics"
                  className="group inline-flex items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#6f4cff_0%,#8f67ff_100%)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_40px_rgba(111,76,255,0.24)] transition-all hover:-translate-y-0.5"
                >
                  <AnimatedButtonLabel label="Explore Gymnastics" icon={ArrowRight} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full border border-[#e4d9ff] bg-white px-6 py-3.5 text-base font-semibold text-[#2f2550] transition-all hover:bg-[#faf7ff]"
                >
                  See the core features
                </a>
              </div>
            </div>

            <GymnasticsMeetPreview className="min-h-[unset] pt-0" />
          </div>
        </article>

        <article
          id="snap"
          className="scroll-mt-28 relative overflow-hidden rounded-[2.5rem] border border-[#e8ddff] bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] p-6 shadow-[0_24px_70px_rgba(104,78,191,0.08)] sm:p-8 lg:scroll-mt-32 lg:p-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#f2ebff_0%,transparent_42%)]" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
            <div className="order-2 lg:order-1">
              <SnapEventPreview />
            </div>

            <div className="order-1 max-w-xl lg:order-2 lg:justify-self-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e8ddff] bg-[#faf7ff] px-4 py-2 text-sm font-semibold text-[#644bc7]">
                <Camera className="h-4 w-4" />
                Flexible capture workflow
              </div>
              <h3
                className="mt-5 text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-[#17132b] sm:text-[2.7rem]"
                style={{
                  fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
                }}
              >
                Snap or upload the image. Envitefy extracts, organizes, and readies the shareable
                page.
              </h3>
              <p className="mt-5 text-lg leading-8 text-[#58536e]">
                Snap is the fast path for invites, flyers, schedules, and event graphics when you
                want the details extracted, cleaned up, and published without manual entry.
              </p>

              <div className="mt-6 space-y-3">
                {snapBullets.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#6d54ca]" />
                    <p className="text-base leading-7 text-[#38334b]">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/snap"
                  className="group inline-flex items-center justify-center overflow-hidden rounded-full border border-[#e3d7ff] bg-[#f7f3ff] px-6 py-3.5 text-base font-semibold text-[#392d61] transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  <AnimatedButtonLabel label="Explore Snap" icon={ArrowRight} />
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

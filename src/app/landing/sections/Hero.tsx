import { ArrowRight, FileText, Sparkles, WandSparkles } from "lucide-react";
import Link from "next/link";
import GymnasticsMeetPreview from "@/components/landing/GymnasticsMeetPreview";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

export default function Hero() {
  return (
    <section
      id="landing-hero"
      className="relative overflow-hidden pb-20 pt-32 sm:pb-24 sm:pt-36 lg:pb-28 lg:pt-40"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f5eeff_0%,#fcfbff_52%,#fcfbff_100%)]" />
        <div className="absolute left-[-12%] top-[4%] h-[26rem] w-[26rem] rounded-full bg-[#eadcff] blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-[32rem] w-[32rem] rounded-full bg-[#efe6ff] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-16">
          <div className="max-w-3xl lg:pr-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e7ddff] bg-white/86 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#6f57c8] shadow-[0_12px_28px_rgba(118,87,205,0.08)] backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              AI event digitization
            </div>

            <h1
              className="mt-7 text-[clamp(3rem,7vw,5.7rem)] font-semibold leading-[0.94] tracking-[-0.055em] text-[#161129]"
              style={{
                fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
              }}
            >
              Turn meet PDFs, invites, flyers, and schedules into
              <span className="block bg-[linear-gradient(135deg,#6f4cff_0%,#8d66ff_52%,#b090ff_100%)] bg-clip-text text-transparent">
                live digital event pages.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#544f6b] sm:text-xl">
              Built for gymnastics meets and effortless event sharing. Envitefy helps you upload or
              capture the file you already have, organize the details, and share one polished
              mobile-friendly page people can actually use.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/gymnastics"
                className="group inline-flex items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#6f4cff_0%,#8f67ff_100%)] px-7 py-4 text-base font-semibold text-white shadow-[0_20px_44px_rgba(111,76,255,0.26)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_52px_rgba(111,76,255,0.32)]"
              >
                <AnimatedButtonLabel label="Start with Gymnastics" icon={ArrowRight} />
              </Link>
              <Link
                href="/snap"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e6dcff] bg-white px-7 py-4 text-base font-semibold text-[#2f2550] shadow-[0_14px_32px_rgba(93,67,171,0.08)] transition-all hover:-translate-y-0.5 hover:border-[#d9cbff] hover:bg-[#faf7ff]"
              >
                Try Snap
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Gymnastics-first meet pages",
                "One link for schedules, maps, and updates",
                "Works from PDFs, flyers, invites, and screenshots",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-[#ebe3ff] bg-white/90 px-4 py-2 text-sm font-semibold text-[#574d79] shadow-[0_12px_28px_rgba(108,78,199,0.06)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-4">
            <div className="pointer-events-none absolute left-[10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-[#dccdff]/80 blur-[90px]" />

            <div className="absolute -right-2 top-10 z-20 max-w-[14rem] rounded-[1.35rem] border border-[#eadfff] bg-white/94 px-4 py-4 shadow-[0_22px_44px_rgba(108,78,199,0.14)] backdrop-blur sm:right-4 lg:-right-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4eeff] text-[#744df5]">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#8a74c8]">
                    Source file
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#261d47]">
                    Meet packet, flyer, invite, or schedule goes in first
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 rounded-[2.4rem] border border-[#e6dcff] bg-white/72 p-3 shadow-[0_32px_90px_rgba(108,78,199,0.14)] backdrop-blur-sm sm:p-4">
              <div className="rounded-[2rem] border border-[#efe6ff] bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-3">
                <GymnasticsMeetPreview className="min-h-[unset] pt-0" />
              </div>
            </div>

            <div className="absolute -left-2 bottom-8 z-20 max-w-[16rem] rounded-[1.35rem] border border-[#eadfff] bg-white/94 px-4 py-4 shadow-[0_22px_44px_rgba(108,78,199,0.14)] backdrop-blur sm:-left-10">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4eeff] text-[#744df5]">
                  <WandSparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#8a74c8]">
                    AI processing
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#261d47]">
                    Organizing dates, venue, schedule, and share-ready details
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

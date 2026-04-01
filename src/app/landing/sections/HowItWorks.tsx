import {
  FileUp,
  LayoutPanelTop,
  ScanSearch,
  Share2,
  Trophy,
  WandSparkles,
} from "lucide-react";

const steps = [
  {
    step: "01",
    icon: FileUp,
    title: "Snap or upload",
    copy: "Start with a gymnastics meet packet, schedule PDF, flyer, invite, or event image. Use the file you already have.",
  },
  {
    step: "02",
    icon: ScanSearch,
    title: "Envitefy extracts and organizes",
    copy: "Envitefy pulls the important details into a structured draft so you are working from a cleaner event page, not raw OCR output.",
  },
  {
    step: "03",
    icon: Share2,
    title: "Share the live event page",
    copy: "Publish one polished page with schedules, venue info, maps, updates, and supporting links instead of another screenshot thread.",
  },
] as const;

const outputs = [
  {
    icon: Trophy,
    label: "Gymnastics meet pages",
  },
  {
    icon: LayoutPanelTop,
    label: "Mobile-ready event pages",
  },
  {
    icon: WandSparkles,
    label: "Cleaner details from messy inputs",
  },
] as const;

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start">
          <div className="max-w-xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#856ed1]">
              How it works
            </p>
            <h2
              className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.05em] text-[#17132b] sm:text-5xl"
              style={{
                fontFamily:
                  'var(--font-montserrat), var(--font-sans), sans-serif',
              }}
            >
              From document to live page in three clear steps.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#58536e]">
              The workflow is simple on purpose: bring the file in, let
              Envitefy structure the details, then publish a page people can
              actually rely on.
            </p>

            <div className="mt-8 rounded-[2rem] border border-[#ebe3ff] bg-white p-6 shadow-[0_20px_52px_rgba(102,76,189,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7f69c8]">
                What comes out
              </p>
              <div className="mt-4 grid gap-3">
                {outputs.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl border border-[#f0eaff] bg-[#faf7ff] px-4 py-3"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#6f55c9] shadow-sm">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-sm font-semibold text-[#2d244c]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map(({ step, icon: Icon, title, copy }) => (
              <article
                key={step}
                className="rounded-[2rem] border border-[#ece4ff] bg-white p-6 shadow-[0_18px_46px_rgba(98,71,186,0.08)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8f7bbf]">
                    {step}
                  </span>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f0e7ff_0%,#ffffff_100%)] text-[#6d54ca] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3
                  className="mt-7 text-[1.35rem] font-semibold leading-tight tracking-[-0.04em] text-[#1d1734]"
                  style={{
                    fontFamily:
                      'var(--font-montserrat), var(--font-sans), sans-serif',
                  }}
                >
                  {title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#5b556f]">
                  {copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

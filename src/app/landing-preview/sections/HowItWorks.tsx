import { ArrowRight, FileUp, Link2, Sparkles } from "lucide-react";

const steps = [
  {
    icon: FileUp,
    step: "Step 1",
    title: "Upload Meet Data",
    description:
      "Drop in a meet packet, schedule PDF, screenshot, or flyer. Envitefy is designed for the messy formats families actually receive.",
  },
  {
    icon: Sparkles,
    step: "Step 2",
    title: "Envitefy Builds the Page",
    description:
      "We turn the document into a polished meet hub with schedules, venue details, travel info, documents, and spectator-facing logistics.",
  },
  {
    icon: Link2,
    step: "Step 3",
    title: "Share One Link",
    description:
      "Parents, coaches, athletes, and spectators all get one clean destination instead of hunting through PDFs and texts.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4d8fb4]">
            How it works
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-4 font-['Poppins'] text-4xl font-semibold tracking-[-0.04em] text-[#0b2035] sm:text-5xl"
          >
            From packet upload to parent-ready meet page
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#587088]">
            The flow is intentionally simple: upload the source material, let
            Envitefy organize it, then send one link.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, description }, index) => (
            <article
              key={title}
              className="relative rounded-[2rem] border border-[#d7e2ec] bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f7f4] text-[#0f766e]">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#84a0b8]">
                  {step}
                </span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-[#10233f]">
                {title}
              </h3>
              <p className="mt-4 text-base leading-7 text-[#587088]">
                {description}
              </p>

              {index < steps.length - 1 ? (
                <div className="pointer-events-none absolute right-[-18px] top-14 hidden h-9 w-9 items-center justify-center rounded-full border border-[#d7e2ec] bg-white text-[#84a0b8] shadow-[0_10px_20px_rgba(15,23,42,0.08)] lg:flex">
                  <ArrowRight className="h-4 w-4" />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

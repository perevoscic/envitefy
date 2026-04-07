import { ArrowRight, CalendarRange, Upload, WandSparkles } from "lucide-react";
import styles from "./gymnastics-landing.module.css";

const steps = [
  {
    icon: Upload,
    eyebrow: "Step 1",
    title: "Upload Meet Info",
    copy: "Bring in your meet packet, session schedule, venue details, hotel sheet, and supporting documents.",
  },
  {
    icon: WandSparkles,
    eyebrow: "Step 2",
    title: "Envitefy Organizes It",
    copy: "We structure the information into the pieces gymnastics families actually need: sessions, locations, travel, documents, and updates.",
  },
  {
    icon: CalendarRange,
    eyebrow: "Step 3",
    title: "Share One Meet Page",
    copy: "Coaches, parents, athletes, and spectators all use the same polished page instead of hunting through PDFs and emails.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className={styles.container}>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4f46e5]">
            How it works
          </p>
          <h2 className="mt-4 font-[var(--font-gym-display)] text-4xl font-bold tracking-[-0.045em] text-[#17153f] sm:text-5xl">
            Upload once. Give every gymnastics family one reliable place to go.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {steps.map(({ icon: Icon, eyebrow, title, copy }, index) => (
            <article
              key={title}
              className="relative rounded-[2rem] border border-[#dde2f4] bg-white px-7 pb-7 pt-8 shadow-[0_18px_45px_rgba(30,27,75,0.06)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#efeeff] text-[#4f46e5]">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d95b3]">
                  {eyebrow}
                </span>
              </div>
              <h3 className="mt-6 font-[var(--font-gym-display)] text-2xl font-bold tracking-[-0.03em] text-[#1e1b4b]">
                {title}
              </h3>
              <p className="mt-4 text-base leading-7 text-[#55627f]">{copy}</p>

              {index < steps.length - 1 ? (
                <div className="pointer-events-none absolute right-[-1.25rem] top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#dde2f4] bg-white text-[#8d95b3] shadow-sm xl:flex">
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

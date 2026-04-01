const trustItems = [
  "Gymnastics families",
  "Coaches",
  "Meet organizers",
  "Schedules and PDFs",
  "Flyers and invites",
] as const;

export default function TrustStrip() {
  return (
    <section className="border-y border-[#ede6ff] bg-white/88 py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#8b76ca]">
              Built around the files real events already start from
            </p>
            <p className="mt-2 text-sm leading-6 text-[#61587c]">
              Envitefy is strongest when the source is already in someone&apos;s
              hands: a meet packet, a flyer, a schedule PDF, or an invite that
              needs to become one trustworthy page.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {trustItems.map((label) => (
              <span
                key={label}
                className="rounded-full border border-[#ebe2ff] bg-[#fbf8ff] px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#50476f]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

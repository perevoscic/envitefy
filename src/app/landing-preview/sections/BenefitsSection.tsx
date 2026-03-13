import {
  Check,
  MessageSquareMore,
  MonitorSmartphone,
  ScanText,
} from "lucide-react";

const benefits = [
  "No more messy PDFs in group chats",
  "One link for the whole meet",
  "Easy for parents and spectators",
  "Professional-looking event pages",
  "Works on phone and desktop",
  "Also useful for birthdays and weddings",
];

const proofPoints = [
  {
    icon: MessageSquareMore,
    title: "Less back-and-forth",
    copy: "Parents do not need to ask where parking is, which session they are in, or where the packet link went.",
  },
  {
    icon: ScanText,
    title: "Concrete input story",
    copy: "The product promise is specific: upload the meet material you already have and get a page that is easier to share.",
  },
  {
    icon: MonitorSmartphone,
    title: "Useful across devices",
    copy: "The page reads well on a phone in the parking lot and still looks polished on desktop when organizers share it ahead of time.",
  },
];

export default function BenefitsSection() {
  return (
    <section
      className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="benefits-heading"
    >
      <div className="mx-auto max-w-7xl rounded-[2.25rem] border border-[#d8e3f0] bg-[#102a43] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#79c7d3]">
              Benefits
            </p>
            <h2
              id="benefits-heading"
              className="mt-4 font-['Poppins'] text-4xl font-semibold tracking-[-0.04em] sm:text-5xl"
            >
              Better for families, cleaner for organizers
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#c8d7e5]">
              The page should answer the obvious question fast: why should a
              parent or coach care? The clearest answer is fewer handoffs, less
              confusion, and a more professional way to share meet details.
            </p>

            <div className="mt-8 grid gap-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f766e]/25 text-[#8be3d1]">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-[#edf5fb]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {proofPoints.map(({ icon: Icon, title, copy }) => (
              <article
                key={title}
                className="rounded-[1.7rem] border border-white/10 bg-white/6 p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#f4c46d]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#c8d7e5]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

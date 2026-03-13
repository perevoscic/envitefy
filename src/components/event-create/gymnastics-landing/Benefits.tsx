import { Check, Mail, MessageSquareText, ZoomIn } from "lucide-react";

const pains = [
  {
    title: "Parents zooming into PDFs",
    copy: "Session details and logistics are often locked inside packet pages that are hard to read on a phone.",
    icon: ZoomIn,
  },
  {
    title: "Schedules buried in emails",
    copy: "Meet timing, hotel details, and venue notes get spread across multiple attachments and messages.",
    icon: Mail,
  },
  {
    title: "Updates sent in group chats",
    copy: "Late changes and reminders become easy to miss when they are pushed through text threads.",
    icon: MessageSquareText,
  },
];

const solutions = [
  "One page for schedules, venue details, hotels, results, and announcements",
  "A cleaner experience for parents, athletes, coaches, and spectators",
  "A more polished presentation for your meet, gym, or host organization",
  "Works better on phones during real meet-day movement",
];

export default function Benefits() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4f46e5]">
              Why gymnastics meets need this
            </p>
            <h2 className="mt-4 font-[var(--font-gym-display)] text-4xl font-bold tracking-[-0.045em] text-[#17153f] sm:text-5xl">
              Gymnastics meet information is too important to live in messy files
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#55627f]">
              The pain points are familiar to every gym: packet PDFs are hard to
              read on mobile, hotel information lives somewhere else, and
              updates bounce between email and group text.
            </p>

            <div className="mt-8 rounded-[1.8rem] border border-[#222063] bg-[#1e1b4b] p-6 text-white shadow-[0_24px_60px_rgba(30,27,75,0.18)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b8c0ff]">
                Envitefy solves it with one meet page
              </p>
              <div className="mt-5 space-y-3">
                {solutions.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#d4af37]/20 text-[#f7da79]">
                      <Check className="h-4 w-4" />
                    </span>
                    <p className="text-sm leading-6 text-[#edf0ff]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {pains.map(({ title, copy, icon: Icon }, index) => (
              <article
                key={title}
                className={`rounded-[1.85rem] border p-6 shadow-[0_16px_40px_rgba(30,27,75,0.05)] ${
                  index === 1
                    ? "border-[#d8c27f] bg-[#fff8e7]"
                    : "border-[#dde2f4] bg-white"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    index === 1
                      ? "bg-[#f3e0a0] text-[#7b6112]"
                      : "bg-[#efeeff] text-[#4f46e5]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-[var(--font-gym-display)] text-xl font-bold tracking-[-0.02em] text-[#1e1b4b]">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#586581]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { Check, Mail, MessageSquareText, FileSearch2, Hotel } from "lucide-react";
import styles from "./gymnastics-landing.module.css";

const pains = [
  {
    title: "Parents zooming into PDFs",
    copy: "Session times and venue notes are stuck inside packet pages that are miserable to read on a phone.",
    icon: FileSearch2,
  },
  {
    title: "Schedules buried in emails",
    copy: "Important timing changes and attachments get spread across multiple inbox threads.",
    icon: Mail,
  },
  {
    title: "Hotel lists split from meet info",
    copy: "Travel details often live in a separate doc or booking site that families have to hunt down later.",
    icon: Hotel,
  },
  {
    title: "Updates sent in group chats",
    copy: "Late reminders are easy to miss when they only arrive through text threads.",
    icon: MessageSquareText,
  },
];

const solutions = [
  "One page for sessions, venue details, hotels, results, and announcements",
  "A cleaner experience for parents, athletes, coaches, and spectators",
  "A more polished presentation for your host gym or meet organization",
  "Better mobile readability during real meet-day movement",
];

export default function WhyGymnasticsNeedsThis() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className={`${styles.container} grid gap-8 xl:grid-cols-[minmax(0,0.82fr)_minmax(640px,1.08fr)] xl:items-start`}>
        <div className="max-w-[560px]">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4f46e5]">
            Why gymnastics meets need this
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-[#17153f] sm:text-5xl">
            Gymnastics meet information is too important to live in messy files
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#55627f]">
            Families do not experience your meet in the same order a PDF packet
            was assembled. They need one reliable place to check sessions,
            travel, venue details, results, and updates.
          </p>

          <div className="mt-10 rounded-[2rem] border border-[#25285e] bg-[linear-gradient(180deg,#1e2258_0%,#171b46_100%)] p-6 text-white shadow-[0_26px_70px_rgba(23,27,70,0.2)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c5ccef]">
              Envitefy solves it with one meet page
            </p>
            <div className="mt-5 space-y-3">
              {solutions.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3"
                >
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#d4af37]/18 text-[#f4d778]">
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-6 text-[#edf1ff]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {pains.map(({ title, copy, icon: Icon }, index) => (
            <article
              key={title}
              className={`rounded-[1.8rem] border p-6 shadow-[0_16px_40px_rgba(23,27,70,0.05)] ${
                index === 1 ? "border-[#e0cf9a] bg-[#fff8e7]" : "border-[#dde2ee] bg-white"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  index === 1 ? "bg-[#efe0ab] text-[#775d17]" : "bg-[#f2f2fb] text-[#4f46e5]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-[1.4rem] font-semibold text-[#171b46]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#586581]">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
